using System.Threading;

namespace Neuro.Tokenizer;

/// <summary>
/// 分词器接口，提供对文本的分词与 id 编码功能。
/// </summary>
public interface ITokenizer
{
    /// <summary>
    /// 对文本进行分词并返回包含 token id、token 信息及标准化文本的结果。
    /// </summary>
    TokenizationResult Encode(string text);

    /// <summary>
    /// Encode 的异步包装（方便异步调用语义）。
    /// </summary>
    System.Threading.Tasks.Task<TokenizationResult> EncodeAsync(string text, CancellationToken cancellationToken = default);

    /// <summary>
    /// 便捷方法：仅返回 token id 序列（int[]）。
    /// </summary>
    int[] EncodeToIds(string text);

    /// <summary>
    /// EncodeToIds 的异步包装。
    /// </summary>
    System.Threading.Tasks.Task<int[]> EncodeToIdsAsync(string text, CancellationToken cancellationToken = default);

    /// <summary>
    /// 返回 token 级别的详细信息（Id、Value、Start、End）。
    /// </summary>
    Token[] EncodeToTokens(string text);
}
