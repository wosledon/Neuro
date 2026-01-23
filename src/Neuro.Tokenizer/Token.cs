namespace Neuro.Tokenizer;

/// <summary>
/// 表示一个分词标记（Token）。
/// - Id: token id（整数）
/// - Value: token 对应的文本（若不可用则可能为空字符串）
/// - Start/End: 在原始文本中的字符起止偏移（若不可用则为 -1）
/// </summary>
public record Token(int Id, string Value, int Start, int End);