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
}
