using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using Microsoft.ML.OnnxRuntime;
using Microsoft.ML.OnnxRuntime.Tensors;

namespace Neuro.Vectorizer;

public class VectorizerOptions
{
    /// <summary>
    /// ONNX 模型文件路径（相对于运行时工作目录或绝对路径）。
    /// 默认指向仓库内 models/bert_Opset18.onnx
    /// </summary>
    public string ModelPath { get; set; } = "models/bert_Opset18.onnx";
}

public class OnnxVectorizer : IVectorizer, System.IDisposable
{
    private readonly InferenceSession? _session;
    private readonly string _modelPath;
    private readonly bool _modelExists;

    public OnnxVectorizer(VectorizerOptions opts)
    {
        if (opts == null) throw new System.ArgumentNullException(nameof(opts));

        // 尝试多个候选路径查找模型文件
        var candidates = new List<string>
        {
            opts.ModelPath,  // 配置的路径
            Path.Combine(AppContext.BaseDirectory, opts.ModelPath),  // 运行时目录
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", opts.ModelPath),  // 项目根目录
            Path.Combine(Directory.GetCurrentDirectory(), opts.ModelPath),  // 当前工作目录
        };

        foreach (var path in candidates)
        {
            var fullPath = Path.GetFullPath(path);
            if (System.IO.File.Exists(fullPath))
            {
                _modelPath = fullPath;
                _modelExists = true;
                _session = new InferenceSession(fullPath);
                System.Console.WriteLine($"向量模型已加载: {fullPath}");
                return;
            }
        }

        // 没有找到模型
        _modelPath = opts.ModelPath;
        _modelExists = false;
        _session = null;
        System.Console.WriteLine($"警告: 未找到向量模型文件，已尝试路径: {string.Join(", ", candidates.Select(p => Path.GetFullPath(p)))}");
    }

    public async System.Threading.Tasks.Task<float[]> EmbedAsync(int[] inputIds, CancellationToken cancellationToken = default)
    {
        var batch = await EmbedBatchAsync(new[] { inputIds }, cancellationToken);
        if (batch.Length == 0) return System.Array.Empty<float>();
        NormalizeL2(batch[0]);
        return batch[0];
    }

    public async System.Threading.Tasks.Task<float[][]> EmbedBatchAsync(IReadOnlyList<int[]> inputBatch, CancellationToken cancellationToken = default)
    {
        if (inputBatch == null) throw new System.ArgumentNullException(nameof(inputBatch));
        if (inputBatch.Count == 0) return System.Array.Empty<float[]>();
        if (inputBatch.Any(ids => ids == null || ids.Length == 0))
        {
            throw new System.ArgumentException("批量输入中存在空 token 序列", nameof(inputBatch));
        }

        // 如果模型不存在，抛出异常提示用户
        if (!_modelExists || _session == null)
        {
            throw new System.InvalidOperationException($"向量模型文件不存在: {_modelPath}。请运行 'git lfs pull' 拉取模型文件，或从其他渠道获取 BERT ONNX 模型。");
        }

        // 将输入元数据按小写名称索引以便快速查找（保留原始输入名以供 CreateFromTensor 使用）
        var inputMeta = _session.InputMetadata.ToDictionary(kv => kv.Key.ToLowerInvariant(), kv => (Key: kv.Key, Meta: kv.Value));

        var batchSize = inputBatch.Count;
        var fixedBatch = GetFixedBatchSize(inputMeta);
        if (fixedBatch > 0 && fixedBatch != batchSize)
        {
            var merged = new List<float[]>(batchSize);

            if (batchSize < fixedBatch)
            {
                var padded = new List<int[]>(fixedBatch);
                for (var i = 0; i < batchSize; i++)
                {
                    padded.Add(inputBatch[i]);
                }

                var padSource = inputBatch[batchSize - 1];
                while (padded.Count < fixedBatch)
                {
                    padded.Add(padSource);
                }

                var embedded = await EmbedBatchAsync(padded, cancellationToken);
                for (var i = 0; i < batchSize; i++)
                {
                    merged.Add(embedded[i]);
                }

                return merged.ToArray();
            }

            for (var offset = 0; offset < batchSize; offset += fixedBatch)
            {
                cancellationToken.ThrowIfCancellationRequested();

                var take = System.Math.Min(fixedBatch, batchSize - offset);
                var block = new List<int[]>(fixedBatch);
                for (var i = 0; i < take; i++)
                {
                    block.Add(inputBatch[offset + i]);
                }

                var padSource = block[block.Count - 1];
                while (block.Count < fixedBatch)
                {
                    block.Add(padSource);
                }

                var embedded = await EmbedBatchAsync(block, cancellationToken);
                for (var i = 0; i < take; i++)
                {
                    merged.Add(embedded[i]);
                }
            }

            return merged.ToArray();
        }

        var seqLen = inputBatch.Max(x => x.Length);

        // 根据模型输入的声明类型（long/int/float）构建相应张量，避免类型不匹配
        var inputs = new List<NamedOnnxValue>();

        // 本地函数：判断元素类型是否匹配指定的 CLR 类型
        bool IsType(System.Type t, System.Type candidate) => t == candidate;

        // input_ids
        if (inputMeta.TryGetValue("input_ids", out var idsMeta))
        {
            var meta = idsMeta.Meta;
            var et = meta.ElementType;
            var dims = meta.Dimensions?.ToArray();
            var desired = seqLen;
            if (dims != null && dims.Length >= 2 && dims[1] > 0) desired = dims[1];

            if (IsType(et, typeof(long)))
            {
                var tLong = new DenseTensor<long>(new[] { batchSize, desired });
                for (int b = 0; b < batchSize; b++)
                {
                    var ids = inputBatch[b];
                    var len = System.Math.Min(ids.Length, desired);
                    for (int i = 0; i < desired; i++) tLong[b, i] = i < len ? ids[i] : 0L;
                }
                inputs.Add(NamedOnnxValue.CreateFromTensor(idsMeta.Key, tLong));
            }
            else if (IsType(et, typeof(int)))
            {
                var tInt = new DenseTensor<int>(new[] { batchSize, desired });
                for (int b = 0; b < batchSize; b++)
                {
                    var ids = inputBatch[b];
                    var len = System.Math.Min(ids.Length, desired);
                    for (int i = 0; i < desired; i++) tInt[b, i] = i < len ? ids[i] : 0;
                }
                inputs.Add(NamedOnnxValue.CreateFromTensor(idsMeta.Key, tInt));
            }
            else if (IsType(et, typeof(float)))
            {
                var tFloat = new DenseTensor<float>(new[] { batchSize, desired });
                for (int b = 0; b < batchSize; b++)
                {
                    var ids = inputBatch[b];
                    var len = System.Math.Min(ids.Length, desired);
                    for (int i = 0; i < desired; i++) tFloat[b, i] = i < len ? ids[i] : 0f;
                }
                inputs.Add(NamedOnnxValue.CreateFromTensor(idsMeta.Key, tFloat));
            }
            else
            {
                throw new System.NotSupportedException($"不支持的输入元素类型 {et}，输入名：{idsMeta.Key}");
            }
        }

        // attention_mask
        if (inputMeta.TryGetValue("attention_mask", out var attMeta))
        {
            var meta = attMeta.Meta;
            var et = meta.ElementType;
            var dims = meta.Dimensions?.ToArray();
            var desired = seqLen;
            if (dims != null && dims.Length >= 2 && dims[1] > 0) desired = dims[1];

            if (IsType(et, typeof(long)))
            {
                var aLong = new DenseTensor<long>(new[] { batchSize, desired });
                for (int b = 0; b < batchSize; b++)
                {
                    var len = System.Math.Min(inputBatch[b].Length, desired);
                    for (int i = 0; i < len; i++) aLong[b, i] = 1L;
                }
                inputs.Add(NamedOnnxValue.CreateFromTensor(attMeta.Key, aLong));
            }
            else if (IsType(et, typeof(int)))
            {
                var aInt = new DenseTensor<int>(new[] { batchSize, desired });
                for (int b = 0; b < batchSize; b++)
                {
                    var len = System.Math.Min(inputBatch[b].Length, desired);
                    for (int i = 0; i < len; i++) aInt[b, i] = 1;
                }
                inputs.Add(NamedOnnxValue.CreateFromTensor(attMeta.Key, aInt));
            }
            else if (IsType(et, typeof(float)))
            {
                var aFloat = new DenseTensor<float>(new[] { batchSize, desired });
                for (int b = 0; b < batchSize; b++)
                {
                    var len = System.Math.Min(inputBatch[b].Length, desired);
                    for (int i = 0; i < len; i++) aFloat[b, i] = 1f;
                }
                inputs.Add(NamedOnnxValue.CreateFromTensor(attMeta.Key, aFloat));
            }
            else
            {
                throw new System.NotSupportedException($"不支持的输入元素类型 {et}，输入名：{attMeta.Key}");
            }
        }

        // token_type_ids（通常为 0）
        if (inputMeta.TryGetValue("token_type_ids", out var tokMeta))
        {
            var meta = tokMeta.Meta;
            var et = meta.ElementType;
            var dims = meta.Dimensions?.ToArray();
            var desired = seqLen;
            if (dims != null && dims.Length >= 2 && dims[1] > 0) desired = dims[1];

            if (IsType(et, typeof(long)))
            {
                var ttLong = new DenseTensor<long>(new[] { batchSize, desired });
                inputs.Add(NamedOnnxValue.CreateFromTensor(tokMeta.Key, ttLong));
            }
            else if (IsType(et, typeof(int)))
            {
                var ttInt = new DenseTensor<int>(new[] { batchSize, desired });
                inputs.Add(NamedOnnxValue.CreateFromTensor(tokMeta.Key, ttInt));
            }
            else if (IsType(et, typeof(float)))
            {
                var ttFloat = new DenseTensor<float>(new[] { batchSize, desired });
                inputs.Add(NamedOnnxValue.CreateFromTensor(tokMeta.Key, ttFloat));
            }
            else
            {
                throw new System.NotSupportedException($"不支持的输入元素类型 {et}，输入名：{tokMeta.Key}");
            }
        }

        // 回退：如果没有任何输入被添加，则将第一个模型输入映射为 input_ids（基于其声明类型创建张量）
        if (!inputs.Any())
        {
            var first = _session.InputMetadata.First();
            var key = first.Key;
            var meta = first.Value;
            var et = meta.ElementType;
            var dims = meta.Dimensions?.ToArray();
            var desired = seqLen;
            if (dims != null && dims.Length >= 2 && dims[1] > 0) desired = dims[1];

            if (IsType(et, typeof(long)))
            {
                var fLong = new DenseTensor<long>(new[] { batchSize, desired });
                for (int b = 0; b < batchSize; b++)
                {
                    var ids = inputBatch[b];
                    var len = System.Math.Min(ids.Length, desired);
                    for (int i = 0; i < desired; i++) fLong[b, i] = i < len ? ids[i] : 0L;
                }
                inputs.Add(NamedOnnxValue.CreateFromTensor(key, fLong));
            }
            else if (IsType(et, typeof(int)))
            {
                var fInt = new DenseTensor<int>(new[] { batchSize, desired });
                for (int b = 0; b < batchSize; b++)
                {
                    var ids = inputBatch[b];
                    var len = System.Math.Min(ids.Length, desired);
                    for (int i = 0; i < desired; i++) fInt[b, i] = i < len ? ids[i] : 0;
                }
                inputs.Add(NamedOnnxValue.CreateFromTensor(key, fInt));
            }
            else if (IsType(et, typeof(float)))
            {
                var fFloat = new DenseTensor<float>(new[] { batchSize, desired });
                for (int b = 0; b < batchSize; b++)
                {
                    var ids = inputBatch[b];
                    var len = System.Math.Min(ids.Length, desired);
                    for (int i = 0; i < desired; i++) fFloat[b, i] = i < len ? ids[i] : 0f;
                }
                inputs.Add(NamedOnnxValue.CreateFromTensor(key, fFloat));
            }
            else
            {
                throw new System.NotSupportedException($"不支持的输入元素类型 {et}，输入名：{key}");
            }
        }

        using var results = _session.Run(inputs);

        var outputValues = results.ToArray();
        var outputs = outputValues.ToDictionary(r => r.Name.ToLowerInvariant(), r => r);

        // Detect output tensors by shape
        string? lastHiddenName = null;
        string? pooledName = null;

        foreach (var kv in outputs)
        {
            try
            {
                var tensor = kv.Value.AsTensor<float>();
                var dims = tensor.Dimensions.ToArray();

                if (dims.Length == 3) // [batch, seq_len, hidden] - hidden states
                {
                    lastHiddenName = kv.Key;
                }
                else if (dims.Length == 2 && dims[1] > 0 && dims[1] < 2048) // [batch, hidden] - pooled
                {
                    pooledName = kv.Key;
                }
            }
            catch { continue; }
        }

        float[][] embeddings;

        // PRIORITY: Mean pooling over hidden states (much better for sentence similarity
        // than CLS/pooler output from base BERT models)
        if (lastHiddenName != null)
        {
            var last = outputs[lastHiddenName].AsTensor<float>();
            var dims = last.Dimensions.ToArray();
            if (dims.Length == 3)
            {
                int hidden = dims[2];
                var seqDim = dims[1];
                embeddings = new float[batchSize][];
                for (int b = 0; b < batchSize; b++)
                {
                    var row = new float[hidden];
                    var totalLen = System.Math.Min(inputBatch[b].Length, seqDim);
                    // Exclude [CLS] (position 0) and [SEP] (last token) from mean pooling
                    // to focus on content tokens. For base BERT, this improves quality.
                    var start = totalLen > 2 ? 1 : 0;
                    var end = totalLen > 2 ? totalLen - 1 : totalLen;
                    var count = end - start;
                    if (count <= 0) count = 1;

                    for (int s = start; s < end; s++)
                    {
                        for (int h = 0; h < hidden; h++)
                        {
                            row[h] += last[b, s, h];
                        }
                    }

                    var invLen = 1f / count;
                    for (int h = 0; h < hidden; h++) row[h] *= invLen;
                    embeddings[b] = row;
                }
                return embeddings;
            }
        }

        // Fallback: pooler output
        if (pooledName != null)
        {
            var pooled = outputs[pooledName].AsTensor<float>();
            var dims = pooled.Dimensions.ToArray();
            if (dims.Length == 2)
            {
                var h = dims[1];
                embeddings = new float[batchSize][];
                for (int b = 0; b < batchSize; b++)
                {
                    var row = new float[h];
                    for (int i = 0; i < h; i++) row[i] = pooled[b, i];
                    embeddings[b] = row;
                }
                return embeddings;
            }
        }

        // Last resort: take first float tensor
        var anyFloat = outputValues.FirstOrDefault(r => r.Value is Tensor<float>);
        if (anyFloat != null)
        {
            var t = anyFloat.AsTensor<float>();
            if (t is DenseTensor<float> dt)
            {
                var embedding = new float[t.Length];
                var span = dt.Buffer.Span;
                for (int i = 0; i < t.Length; i++) embedding[i] = span[i];
                return new[] { embedding };
            }
        }

        return System.Array.Empty<float[]>();
    }

    private static int GetFixedBatchSize(Dictionary<string, (string Key, NodeMetadata Meta)> inputMeta)
    {
        static bool IsKnownInput(string name)
            => name == "input_ids" || name == "attention_mask" || name == "token_type_ids";

        foreach (var item in inputMeta)
        {
            if (!IsKnownInput(item.Key))
            {
                continue;
            }

            var dims = item.Value.Meta.Dimensions;
            if (dims == null || dims.Length == 0)
            {
                continue;
            }

            var batch = dims[0];
            if (batch > 0)
            {
                return batch;
            }
        }

        return -1;
    }

    /// <summary>
    /// 检查模型文件是否存在
    /// </summary>
    public bool IsModelLoaded => _modelExists && _session != null;

    /// <summary>
    /// 获取模型路径
    /// </summary>
    public string ModelPath => _modelPath;

    /// <summary>
    /// L2 normalize an embedding vector in-place, improving cosine similarity quality.
    /// </summary>
    private static void NormalizeL2(float[] vec)
    {
        if (vec == null || vec.Length == 0) return;
        double norm = 0;
        for (int i = 0; i < vec.Length; i++)
            norm += (double)vec[i] * vec[i];
        norm = System.Math.Sqrt(norm);
        if (norm < 1e-12) return;
        var invNorm = (float)(1.0 / norm);
        for (int i = 0; i < vec.Length; i++)
            vec[i] *= invNorm;
    }

    public void Dispose()
    {
        _session?.Dispose();
    }
}
