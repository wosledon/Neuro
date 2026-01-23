namespace Neuro.Tokenizer;

/// <summary>
/// 分词结果，包含 token id 列表、token 详细信息以及标准化后的文本。
/// </summary>
public record TokenizationResult(int[] TokenIds, Token[] Tokens, string NormalizedText);