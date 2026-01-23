using System.Collections.Generic;
using System.Linq;
using Neuro.RAG.Models;
using Neuro.Tokenizer;

namespace Neuro.RAG.Utils;

public class TextChunker
{
    private readonly ITokenizer? _tokenizer;
    private readonly int _chunkSize;
    private readonly int _overlap;

    public TextChunker(ITokenizer? tokenizer = null, int chunkSize = 128, int overlap = 16)
    {
        _tokenizer = tokenizer;
        _chunkSize = chunkSize;
        _overlap = overlap;
    }

    /// <summary>
    /// 将正文文本切分为文档片段（DocumentFragment）。优先使用提供的 <see cref="ITokenizer"/>，
    /// 如果 tokenizer 可用且返回了带有字符偏移的 Token，则按 token 的字符区间切分，保证片段文本能直接用于 LLM 上下文。
    /// 否则退回到基于段落或单词的近似切分。
    /// </summary>
    public IEnumerable<DocumentFragment> Chunk(string text)
    {
        if (string.IsNullOrEmpty(text)) yield break;

        if (_tokenizer == null)
        {
            // 无 tokenizer：按段落切分，忽略空行
            var parts = text.Split('\n').Where(s => !string.IsNullOrWhiteSpace(s)).ToArray();
            for (int i = 0; i < parts.Length; i++)
            {
                yield return new DocumentFragment(i.ToString(), parts[i], null, null, i);
            }
            yield break;
        }

        // 使用 tokenizer 获取 Token，优先使用带有 Start/End 的 tokens 来精确切分文本
        var tokens = _tokenizer.EncodeToTokens(text);
        if (tokens.Length == 0) yield break;

        bool hasOffsets = tokens.Any(t => t.Start >= 0 && t.End > t.Start);

        if (hasOffsets)
        {
            var idx = 0;
            var chunkIndex = 0;
            while (idx < tokens.Length)
            {
                var take = System.Math.Min(_chunkSize, tokens.Length - idx);
                var endIdx = idx + take - 1;
                var startChar = tokens[idx].Start;
                var endChar = tokens[endIdx].End;
                if (startChar < 0 || endChar <= startChar)
                {
                    // 回退：如果偏移不可用，则直接返回整段文本作为单片
                    yield return new DocumentFragment(chunkIndex.ToString(), text, null, null, chunkIndex);
                    yield break;
                }

                var fragText = text.Substring(startChar, endChar - startChar);
                yield return new DocumentFragment(chunkIndex.ToString(), fragText, null, null, chunkIndex);

                var step = System.Math.Max(1, take - _overlap);
                idx += step;
                chunkIndex++;
            }
            yield break;
        }

        // 无字符偏移：基于空白分词近似切分（按词累积使得每片大约包含 _chunkSize 个 token）
        var words = text.Split(' ').Where(s => !string.IsNullOrWhiteSpace(s)).ToArray();
        int wIdx = 0; int wChunkIndex = 0;
        while (wIdx < words.Length)
        {
            var take = System.Math.Min(_chunkSize, words.Length - wIdx);
            var fragText = string.Join(' ', words.Skip(wIdx).Take(take));
            yield return new DocumentFragment(wChunkIndex.ToString(), fragText, null, null, wChunkIndex);
            var step = System.Math.Max(1, take - _overlap);
            wIdx += step;
            wChunkIndex++;
        }
    }
}
