using System.Collections.Generic;
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
    private readonly InferenceSession _session;

    public OnnxVectorizer(VectorizerOptions opts)
    {
        if (opts == null) throw new System.ArgumentNullException(nameof(opts));
        _session = new InferenceSession(opts.ModelPath);
    }

    public async System.Threading.Tasks.Task<float[]> EmbedAsync(int[] inputIds, CancellationToken cancellationToken = default)
    {
        if (inputIds == null) throw new System.ArgumentNullException(nameof(inputIds));
        if (inputIds.Length == 0) return System.Array.Empty<float>();

        // Build inputs for common BERT-like model
        var seqLen = inputIds.Length;
        var batch = 1;

        // ONNX runtime uses long for token ids in many exported models
        var inputIdsTensor = new DenseTensor<long>(new[] { batch, seqLen });
        var attentionMask = new DenseTensor<long>(new[] { batch, seqLen });
        var tokenTypeIds = new DenseTensor<long>(new[] { batch, seqLen });

        for (int i = 0; i < seqLen; i++)
        {
            inputIdsTensor[0, i] = inputIds[i];
            attentionMask[0, i] = inputIds[i] == 0 ? 0L : 1L; // treat 0 as padding by convention
            tokenTypeIds[0, i] = 0L;
        }

        var inputs = new List<NamedOnnxValue>();

        // Try to map inputs by common names if present; otherwise add by standard names
        var inputNames = _session.InputMetadata.Keys.Select(k => k.ToLowerInvariant()).ToList();

        if (inputNames.Contains("input_ids")) inputs.Add(NamedOnnxValue.CreateFromTensor("input_ids", inputIdsTensor));
        if (inputNames.Contains("attention_mask")) inputs.Add(NamedOnnxValue.CreateFromTensor("attention_mask", attentionMask));
        if (inputNames.Contains("token_type_ids")) inputs.Add(NamedOnnxValue.CreateFromTensor("token_type_ids", tokenTypeIds));

        // Fallbacks: some models name differently
        if (!inputs.Any())
        {
            // pick the first input and use input_ids there
            var first = _session.InputMetadata.Keys.First();
            inputs.Add(NamedOnnxValue.CreateFromTensor(first, inputIdsTensor));
        }

        using var results = _session.Run(inputs);

        // Prefer pooled output if exists
        var outputValues = results.ToArray();

        // Map outputs by name to lower-case for detection
        var outputs = outputValues.ToDictionary(r => r.Name.ToLowerInvariant(), r => r);

        // Candidate names
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

        // fallback to last hidden state and mean-pool over sequence dimension
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

        // If nothing matched, try to take the first float tensor result and flatten
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

    public void Dispose()
    {
        _session?.Dispose();
    }
}
