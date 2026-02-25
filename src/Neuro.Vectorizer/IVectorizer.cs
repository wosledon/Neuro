using System.Collections.Generic;
using System.Threading;

namespace Neuro.Vectorizer;

public interface IVectorizer
{
    /// <summary>
    /// 将 token id 序列转换为 embedding 向量（单条示例）。
    /// </summary>
    /// <param name="inputIds">Token id 序列（不含 batch 维度）。</param>
    /// <param name="cancellationToken"></param>
    /// <returns>长度固定的 float 数组表示 embedding。</returns>
    System.Threading.Tasks.Task<float[]> EmbedAsync(int[] inputIds, CancellationToken cancellationToken = default);

    /// <summary>
    /// 批量向量化。默认逐条调用 <see cref="EmbedAsync"/>，具体实现可覆写以提升吞吐。
    /// </summary>
    System.Threading.Tasks.Task<float[][]> EmbedBatchAsync(IReadOnlyList<int[]> inputBatch, CancellationToken cancellationToken = default)
        => EmbedBatchCoreAsync(inputBatch, this, cancellationToken);

    private static async System.Threading.Tasks.Task<float[][]> EmbedBatchCoreAsync(IReadOnlyList<int[]> inputBatch, IVectorizer vectorizer, CancellationToken cancellationToken)
    {
        if (inputBatch == null) throw new System.ArgumentNullException(nameof(inputBatch));
        if (inputBatch.Count == 0) return [];

        var result = new float[inputBatch.Count][];
        for (var i = 0; i < inputBatch.Count; i++)
        {
            cancellationToken.ThrowIfCancellationRequested();
            result[i] = await vectorizer.EmbedAsync(inputBatch[i], cancellationToken);
        }

        return result;
    }
}
