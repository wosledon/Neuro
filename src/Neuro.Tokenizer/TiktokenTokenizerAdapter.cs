using Microsoft.ML.Tokenizers;

namespace Neuro.Tokenizer;

/// <summary>
/// 基于 Microsoft.ML.Tokenizers 的适配器实现（封装 TiktokenTokenizer）。
/// 当前实现通过 EncodingName 创建分词器，并返回 token id 与 token 文本（如可获得）。
/// 注意：本适配器不支持通过本地文件路径直接创建编码（EncodingFilePath），请使用 EncodingName。
/// </summary>
public class TiktokenTokenizerAdapter : ITokenizer
{
    private readonly TokenizerOptions _options;
    private readonly object _initLock = new object();
    private TiktokenTokenizer? _inner;

    public TiktokenTokenizerAdapter(TokenizerOptions options)
    {
        _options = options ?? throw new ArgumentNullException(nameof(options));
    }

    private void EnsureInitialized()
    {
        if (_inner != null) return;
        lock (_initLock)
        {
            if (_inner != null) return;

            // 优先检查本地编码路径是否被设置，但当前实现不支持该选项
            if (!string.IsNullOrEmpty(_options.EncodingFilePath))
            {
                throw new NotSupportedException("当前适配器不支持通过 EncodingFilePath 加载编码，请使用 EncodingName 或升级 tokenizer 包以获得该功能。");
            }

            // 使用指定的编码名称创建分词器（当前包支持的方式）
            _inner = TiktokenTokenizer.CreateForEncoding(_options.EncodingName);
        }
    }

    public TokenizationResult Encode(string text)
    {
        if (text == null) throw new ArgumentNullException(nameof(text));
        EnsureInitialized();
        var inner = _inner!; // initialized

        // EncodeToTokens already returns token-like structures or ids; handle the common shapes directly (no reflection)
        var raw = inner.EncodeToTokens(text, out var normalizedText);

        return new TokenizationResult(raw.Select(x => x.Id).ToArray(), raw.Select(x => new Token(x.Id, x.Value ?? string.Empty, x.Offset.Start.Value, x.Offset.End.Value)).ToArray(), normalizedText ?? string.Empty);
    }



    public System.Threading.Tasks.Task<TokenizationResult> EncodeAsync(string text, System.Threading.CancellationToken cancellationToken = default)
    {
        // 分词为 CPU 密集型操作；这里使用 Task.Run 封装以提供异步接口（简单且易用）
        return System.Threading.Tasks.Task.Run(() => Encode(text), cancellationToken);
    }

    public int[] EncodeToIds(string text)
    {
        // 返回纯 id 列表，方便传入向量化流程
        return Encode(text).TokenIds;
    }

    public System.Threading.Tasks.Task<int[]> EncodeToIdsAsync(string text, System.Threading.CancellationToken cancellationToken = default)
    {
        return System.Threading.Tasks.Task.Run(() => EncodeToIds(text), cancellationToken);
    }

    public Token[] EncodeToTokens(string text)
    {
        // 返回 token 详细信息
        return Encode(text).Tokens;
    } 
}