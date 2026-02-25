namespace Neuro.Tokenizer;

public class TokenizerOptions
{
    /// <summary>
    /// 要使用的编码名称（例如："o200k_base"）。
    /// </summary>
    public string EncodingName { get; set; } = "o200k_base";

    /// <summary>
    /// 可选：本地编码数据的文件路径（覆盖内置资源）。当前适配器暂不支持此选项并会抛出异常。
    /// </summary>
    public string? EncodingFilePath { get; set; }

    /// <summary>
    /// BERT vocab.txt 文件路径。如果提供了有效路径，BertWordPieceTokenizer 将使用完整词汇表。
    /// </summary>
    public string? VocabPath { get; set; }

    /// <summary>
    /// 是否启用标准化（normalization），默认 true。
    /// </summary>
    public bool UseNormalization { get; set; } = true;

    /// <summary>
    /// 最大返回的 token 数（截断）。null 表示不截断。
    /// </summary>
    public int? MaxSequenceLength { get; set; }

    /// <summary>
    /// 填充 token id（默认 0）。
    /// </summary>
    public int PaddingId { get; set; } = 0;

    /// <summary>
    /// 如果找不到指定的编码，是否在初始化时抛出异常。
    /// </summary>
    public bool ThrowOnMissingEncoding { get; set; } = true;
}