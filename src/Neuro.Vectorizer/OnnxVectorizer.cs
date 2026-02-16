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
        if (inputIds == null) throw new System.ArgumentNullException(nameof(inputIds));
        if (inputIds.Length == 0) return System.Array.Empty<float>();
        
        // 如果模型不存在，抛出异常提示用户
        if (!_modelExists || _session == null)
        {
            throw new System.InvalidOperationException($"向量模型文件不存在: {_modelPath}。请运行 'git lfs pull' 拉取模型文件，或从其他渠道获取 BERT ONNX 模型。");
        }

        // 构建常见 BERT 类模型的输入（根据模型的输入元素类型创建张量）
        var seqLen = inputIds.Length;
        var batch = 1;

        // 根据模型输入的声明类型（long/int/float）构建相应张量，避免类型不匹配
        var inputs = new List<NamedOnnxValue>();

        // 将输入元数据按小写名称索引以便快速查找（保留原始输入名以供 CreateFromTensor 使用）
        var inputMeta = _session.InputMetadata.ToDictionary(kv => kv.Key.ToLowerInvariant(), kv => (Key: kv.Key, Meta: kv.Value));

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
                var tLong = new DenseTensor<long>(new[] { batch, desired });
                for (int i = 0; i < desired; i++) tLong[0, i] = i < seqLen ? inputIds[i] : 0L;
                inputs.Add(NamedOnnxValue.CreateFromTensor(idsMeta.Key, tLong));
            }
            else if (IsType(et, typeof(int)))
            {
                var tInt = new DenseTensor<int>(new[] { batch, desired });
                for (int i = 0; i < desired; i++) tInt[0, i] = i < seqLen ? inputIds[i] : 0;
                inputs.Add(NamedOnnxValue.CreateFromTensor(idsMeta.Key, tInt));
            }
            else if (IsType(et, typeof(float)))
            {
                var tFloat = new DenseTensor<float>(new[] { batch, desired });
                for (int i = 0; i < desired; i++) tFloat[0, i] = i < seqLen ? inputIds[i] : 0f;
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
                var aLong = new DenseTensor<long>(new[] { batch, desired });
                for (int i = 0; i < desired; i++) aLong[0, i] = (i < seqLen && inputIds[i] != 0) ? 1L : 0L;
                inputs.Add(NamedOnnxValue.CreateFromTensor(attMeta.Key, aLong));
            }
            else if (IsType(et, typeof(int)))
            {
                var aInt = new DenseTensor<int>(new[] { batch, desired });
                for (int i = 0; i < desired; i++) aInt[0, i] = (i < seqLen && inputIds[i] != 0) ? 1 : 0;
                inputs.Add(NamedOnnxValue.CreateFromTensor(attMeta.Key, aInt));
            }
            else if (IsType(et, typeof(float)))
            {
                var aFloat = new DenseTensor<float>(new[] { batch, desired });
                for (int i = 0; i < desired; i++) aFloat[0, i] = (i < seqLen && inputIds[i] != 0) ? 1f : 0f;
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
                var ttLong = new DenseTensor<long>(new[] { batch, desired });
                for (int i = 0; i < desired; i++) ttLong[0, i] = 0L;
                inputs.Add(NamedOnnxValue.CreateFromTensor(tokMeta.Key, ttLong));
            }
            else if (IsType(et, typeof(int)))
            {
                var ttInt = new DenseTensor<int>(new[] { batch, desired });
                for (int i = 0; i < desired; i++) ttInt[0, i] = 0;
                inputs.Add(NamedOnnxValue.CreateFromTensor(tokMeta.Key, ttInt));
            }
            else if (IsType(et, typeof(float)))
            {
                var ttFloat = new DenseTensor<float>(new[] { batch, desired });
                for (int i = 0; i < desired; i++) ttFloat[0, i] = 0f;
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
                var fLong = new DenseTensor<long>(new[] { batch, desired });
                for (int i = 0; i < desired; i++) fLong[0, i] = i < seqLen ? inputIds[i] : 0L;
                inputs.Add(NamedOnnxValue.CreateFromTensor(key, fLong));
            }
            else if (IsType(et, typeof(int)))
            {
                var fInt = new DenseTensor<int>(new[] { batch, desired });
                for (int i = 0; i < desired; i++) fInt[0, i] = i < seqLen ? inputIds[i] : 0;
                inputs.Add(NamedOnnxValue.CreateFromTensor(key, fInt));
            }
            else if (IsType(et, typeof(float)))
            {
                var fFloat = new DenseTensor<float>(new[] { batch, desired });
                for (int i = 0; i < desired; i++) fFloat[0, i] = i < seqLen ? inputIds[i] : 0f;
                inputs.Add(NamedOnnxValue.CreateFromTensor(key, fFloat));
            }
            else
            {
                throw new System.NotSupportedException($"不支持的输入元素类型 {et}，输入名：{key}");
            }
        }

        using var results = _session.Run(inputs);

        // 优先使用 pooled 输出（如果存在）
        var outputValues = results.ToArray();

        // 将输出按名称映射为小写以便检测
        var outputs = outputValues.ToDictionary(r => r.Name.ToLowerInvariant(), r => r);

        // 候选名称
        string? pooledName = outputs.Keys.FirstOrDefault(k => k.Contains("pooler") || k.Contains("pooled") || k.Contains("cls"));
        string? lastHiddenName = outputs.Keys.FirstOrDefault(k => k.Contains("last_hidden") || k.Contains("sequence_output") || k.Contains("hidden_states") || k.Contains("output"));

        float[] embedding;

        if (pooledName != null)
        {
            // pooled (1, hidden)
            var pooled = outputs[pooledName].AsTensor<float>();
            // pooled shape may be [1, H]
            var dims = pooled.Dimensions.ToArray();
            if (dims.Length == 2) // [1, H]
            {
                var h = dims[1];
                embedding = new float[h];
                for (int i = 0; i < h; i++) embedding[i] = pooled[0, i];
                return embedding;
            }
            else if (dims.Length == 1)
            {
                var h = dims[0];
                embedding = new float[h];
                for (int i = 0; i < h; i++) embedding[i] = pooled[i];
                return embedding;
            }
        }

        // 回退：使用最后一层隐藏状态并在序列维度上做均值池化
        if (lastHiddenName != null)
        {
            var last = outputs[lastHiddenName].AsTensor<float>();
            var dims = last.Dimensions.ToArray();
            // expected [1, seqLen, hidden]
            if (dims.Length == 3)
            {
                int hidden = dims[2];
                embedding = new float[hidden];
                var seq = dims[1];
                for (int s = 0; s < seq; s++)
                {
                    for (int h = 0; h < hidden; h++)
                    {
                        embedding[h] += last[0, s, h];
                    }
                }
                // divide by seq (simple mean pooling)
                for (int h = 0; h < hidden; h++) embedding[h] /= seq;
                return embedding;
            }
        }

        // 如果都没有匹配，尝试取第一个 float 张量输出并展平
        var anyFloat = outputValues.FirstOrDefault(r => r.Value is Tensor<float>);
        if (anyFloat != null)
        {
            var t = anyFloat.AsTensor<float>();
            var len = t.Length;
            embedding = new float[len];

            // DenseTensor exposes a Memory buffer which is the most efficient way to copy
            if (t is DenseTensor<float> dt)
            {
                var span = dt.Buffer.Span;
                for (int i = 0; i < len; i++) embedding[i] = span[i];
                return embedding;
            }

            // Fallback: if tensor implements non-generic IEnumerable, enumerate and copy boxed values
            if (t is System.Collections.IEnumerable seq)
            {
                int idx = 0;
                foreach (var o in seq)
                {
                    if (idx >= len) break;
                    embedding[idx++] = (float)o;
                }
                return embedding;
            }

            // As a last resort return the zeros array (should not normally happen with common ONNX outputs)
            return embedding;
        }

        return System.Array.Empty<float>();
    }

    /// <summary>
    /// 检查模型文件是否存在
    /// </summary>
    public bool IsModelLoaded => _modelExists && _session != null;
    
    /// <summary>
    /// 获取模型路径
    /// </summary>
    public string ModelPath => _modelPath;

    public void Dispose()
    {
        _session?.Dispose();
    }
}
