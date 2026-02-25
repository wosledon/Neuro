using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using Neuro.RAG.Models;
using Neuro.Tokenizer;

namespace Neuro.RAG.Utils;

public class TextChunker
{
    private readonly ITokenizer? _tokenizer;
    private readonly int _chunkSize;
    private readonly int _overlap;
    private readonly int _minChunkTokens;
    private readonly bool _enableAdaptiveChunking;
    private readonly int _codeChunkSize;
    private readonly int _codeOverlap;
    private readonly int _mixedChunkSize;
    private readonly int _mixedOverlap;

    // Split on English punctuation + whitespace, OR CJK punctuation (no whitespace needed)
    private static readonly Regex SentenceSplitRegex = new(
        @"(?<=[.!?])\s+|(?<=[。！？；])",
        RegexOptions.Compiled);

    // Detect Markdown heading lines
    private static readonly Regex HeadingRegex = new(
        @"^(#{1,6})\s+(.+)$",
        RegexOptions.Compiled | RegexOptions.Multiline);

    // Detect fenced code block markers: ``` or ~~~
    private static readonly Regex CodeFenceRegex = new(
        @"^\s*(```+|~~~+)",
        RegexOptions.Compiled);

    // Detect CJK characters
    private static readonly Regex CjkCharRegex = new(
        @"[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u2e80-\u2eff\u3000-\u303f\uff00-\uffef]",
        RegexOptions.Compiled);

    private static readonly Regex LatinRegex = new(
        @"[A-Za-z]",
        RegexOptions.Compiled);

    // Match a CJK character or a run of non-CJK non-whitespace characters (a "word")
    private static readonly Regex CjkTokenRegex = new(
        @"[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]|[^\s\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]+",
        RegexOptions.Compiled);

    public TextChunker(
        ITokenizer? tokenizer = null,
        int chunkSize = 256,
        int overlap = 50,
        bool enableAdaptiveChunking = true,
        float codeChunkSizeRatio = 0.7f,
        float codeChunkOverlapRatio = 0.5f,
        float mixedChunkSizeRatio = 0.85f,
        float mixedChunkOverlapRatio = 0.8f)
    {
        _tokenizer = tokenizer;
        _chunkSize = chunkSize > 0 ? chunkSize : 256;
        _overlap = Math.Clamp(overlap, 0, chunkSize / 2);
        _minChunkTokens = Math.Max(1, Math.Min(10, _chunkSize / 3));

        _enableAdaptiveChunking = enableAdaptiveChunking;

        _codeChunkSize = ToAdaptiveChunkSize(_chunkSize, codeChunkSizeRatio, 32);
        _codeOverlap = ToAdaptiveOverlap(_overlap, codeChunkOverlapRatio, _codeChunkSize);

        _mixedChunkSize = ToAdaptiveChunkSize(_chunkSize, mixedChunkSizeRatio, 32);
        _mixedOverlap = ToAdaptiveOverlap(_overlap, mixedChunkOverlapRatio, _mixedChunkSize);
    }

    /// <summary>
    /// 将文本拆分为文档片段。
    /// 策略: Markdown标题分段 → 段落 → 句子 → 词/字符，逐级细化。
    /// 每个 chunk 前缀注入其所属的标题层级上下文。
    /// </summary>
    public IEnumerable<DocumentFragment> Chunk(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            yield break;

        var sections = SplitIntoSections(text);

        var chunkIndex = 0;
        foreach (var section in sections)
        {
            var fragments = ChunkSection(section.Content, section.HeadingContext, chunkIndex);
            foreach (var fragment in fragments)
            {
                yield return fragment;
            }
            chunkIndex += fragments.Count;
        }
    }

    /// <summary>
    /// 按 Markdown 标题拆分文本为带层级上下文的 section 列表。
    /// </summary>
    private static List<(string HeadingContext, string Content)> SplitIntoSections(string text)
    {
        var sections = new List<(string HeadingContext, string Content)>();

        // 按行扫描，追踪标题层级栈
        var lines = text.Split('\n');
        var headingStack = new List<(int Level, string Text)>(); // 层级栈
        var currentLines = new List<string>();
        var inCodeFence = false;
        string? fenceMarker = null;

        foreach (var rawLine in lines)
        {
            var line = rawLine.TrimEnd('\r');
            if (TryToggleCodeFence(line, ref inCodeFence, ref fenceMarker))
            {
                currentLines.Add(line);
                continue;
            }

            var match = !inCodeFence ? HeadingRegex.Match(line) : Match.Empty;

            if (match.Success)
            {
                var level = match.Groups[1].Value.Length; // 1-6
                var headingText = match.Groups[2].Value.Trim();

                // 把当前积累的内容作为一个 section 输出
                if (currentLines.Count > 0)
                {
                    var content = string.Join('\n', currentLines).Trim();
                    if (!string.IsNullOrWhiteSpace(content))
                    {
                        sections.Add((BuildHeadingContext(headingStack), content));
                    }
                    currentLines.Clear();
                }

                // 更新标题栈: 弹出所有级别 >= 当前级别的标题
                while (headingStack.Count > 0 && headingStack[^1].Level >= level)
                    headingStack.RemoveAt(headingStack.Count - 1);
                headingStack.Add((level, headingText));
            }
            else
            {
                currentLines.Add(line);
            }
        }

        // 处理最后一段
        if (currentLines.Count > 0)
        {
            var content = string.Join('\n', currentLines).Trim();
            if (!string.IsNullOrWhiteSpace(content))
            {
                sections.Add((BuildHeadingContext(headingStack), content));
            }
        }

        // 如果没有任何标题（纯文本），返回整个文本作为一个 section
        if (sections.Count == 0 && !string.IsNullOrWhiteSpace(text))
        {
            sections.Add(("", text.Trim()));
        }

        return sections;
    }

    private static string BuildHeadingContext(List<(int Level, string Text)> stack)
    {
        if (stack.Count == 0) return "";
        return string.Join(" > ", stack.Select(h => h.Text));
    }

    /// <summary>
    /// 对单个 section 内容进行分块，注入 heading context 前缀。
    /// </summary>
    private List<DocumentFragment> ChunkSection(string sectionContent, string headingContext, int startIndex)
    {
        var results = new List<DocumentFragment>();
        var chunkIndex = startIndex;
        var paragraphs = SplitParagraphs(sectionContent);
        var buffer = new List<string>();
        var bufferTokenCount = 0;

        foreach (var paragraph in paragraphs)
        {
            var profile = GetChunkProfile(paragraph);
            var effectiveChunkSize = profile.ChunkSize;
            var effectiveOverlap = profile.Overlap;
            var paraTokenCount = CountTokens(paragraph);

            if (paraTokenCount <= effectiveChunkSize)
            {
                if (bufferTokenCount + paraTokenCount > effectiveChunkSize && buffer.Count > 0)
                {
                    var fragment = EmitChunk(buffer, headingContext, "\n\n", ref chunkIndex);
                    if (fragment != null) results.Add(fragment);

                    var overlapBuffer = CreateOverlapBuffer(buffer, effectiveOverlap);
                    buffer = overlapBuffer;
                    bufferTokenCount = buffer.Count > 0 ? CountTokens(string.Join("\n\n", buffer)) : 0;
                }

                buffer.Add(paragraph);
                bufferTokenCount += paraTokenCount;
            }
            else
            {
                if (buffer.Count > 0)
                {
                    var fragment = EmitChunk(buffer, headingContext, "\n\n", ref chunkIndex);
                    if (fragment != null) results.Add(fragment);
                    buffer.Clear();
                    bufferTokenCount = 0;
                }

                var textChunks = profile.IsCode
                    ? ChunkCodeBlock(paragraph, effectiveChunkSize, effectiveOverlap)
                    : ChunkBySentences(paragraph, effectiveChunkSize, effectiveOverlap);

                foreach (var sentenceChunk in textChunks)
                {
                    var fragment = EmitChunkText(sentenceChunk, headingContext, ref chunkIndex);
                    if (fragment != null) results.Add(fragment);
                }
            }
        }

        if (buffer.Count > 0)
        {
            var fragment = EmitChunk(buffer, headingContext, "\n\n", ref chunkIndex);
            if (fragment != null) results.Add(fragment);
        }

        return results;
    }

    /// <summary>
    /// 将 buffer 合并为一个 chunk，添加 heading context 前缀，过滤过小的 chunk。
    /// </summary>
    private DocumentFragment? EmitChunk(List<string> parts, string headingContext, string separator, ref int chunkIndex)
    {
        var chunkText = string.Join(separator, parts).Trim();
        return EmitChunkText(chunkText, headingContext, ref chunkIndex);
    }

    private DocumentFragment? EmitChunkText(string chunkText, string headingContext, ref int chunkIndex)
    {
        if (string.IsNullOrWhiteSpace(chunkText))
            return null;

        // 注入 heading context
        var finalText = chunkText;
        if (!string.IsNullOrEmpty(headingContext))
        {
            finalText = headingContext + ": " + chunkText;
        }

        // 过滤过小的 chunk (< _minChunkTokens)
        var tokenCount = CountTokens(finalText);
        if (tokenCount < _minChunkTokens)
            return null;

        var fragment = new DocumentFragment(chunkIndex.ToString(), finalText, null, null, chunkIndex);
        chunkIndex++;
        return fragment;
    }

    private static List<string> SplitParagraphs(string text)
    {
        var parts = new List<string>();
        var lines = text.Split('\n');
        var builder = new StringBuilder();
        var inCodeFence = false;
        string? fenceMarker = null;

        foreach (var rawLine in lines)
        {
            var line = rawLine.TrimEnd('\r');

            if (TryToggleCodeFence(line, ref inCodeFence, ref fenceMarker))
            {
                AppendLine(builder, line);
                continue;
            }

            if (!inCodeFence && string.IsNullOrWhiteSpace(line))
            {
                FlushParagraph(builder, parts);
                continue;
            }

            AppendLine(builder, line);
        }

        FlushParagraph(builder, parts);

        if (parts.Count <= 1
            && text.Length > 500
            && !text.Contains("```", StringComparison.Ordinal)
            && !text.Contains("~~~", StringComparison.Ordinal))
        {
            parts = text.Split('\n')
                .Select(p => p.Trim())
                .Where(p => !string.IsNullOrWhiteSpace(p))
                .ToList();
        }

        return parts;
    }

    private IEnumerable<string> ChunkCodeBlock(string text, int chunkSize, int overlap)
    {
        var lines = text.Split('\n')
            .Select(x => x.TrimEnd('\r'))
            .ToList();

        if (lines.Count == 0)
            yield break;

        var current = new List<string>();
        var currentTokenCount = 0;

        foreach (var line in lines)
        {
            var lineTokenCount = CountTokens(line);

            if (lineTokenCount > chunkSize)
            {
                if (current.Count > 0)
                {
                    yield return string.Join("\n", current).Trim();
                    current.Clear();
                    currentTokenCount = 0;
                }

                foreach (var chunk in ChunkByTokens(line, chunkSize, overlap))
                {
                    yield return chunk;
                }

                continue;
            }

            if (currentTokenCount + lineTokenCount > chunkSize && current.Count > 0)
            {
                yield return string.Join("\n", current).Trim();

                var overlapChunk = CreateOverlapBuffer(current, overlap);
                current = overlapChunk;
                currentTokenCount = overlapChunk.Count > 0 ? CountTokens(string.Join("\n", overlapChunk)) : 0;
            }

            current.Add(line);
            currentTokenCount += lineTokenCount;
        }

        if (current.Count > 0)
        {
            var remaining = string.Join("\n", current).Trim();
            if (!string.IsNullOrWhiteSpace(remaining))
                yield return remaining;
        }
    }

    private IEnumerable<string> ChunkBySentences(string text, int chunkSize, int overlap)
    {
        var sentences = SplitSentences(text);

        if (sentences.Count == 0)
        {
            foreach (var chunk in ChunkByTokens(text, chunkSize, overlap))
                yield return chunk;
            yield break;
        }

        var currentChunk = new List<string>();
        var currentTokenCount = 0;

        foreach (var sentence in sentences)
        {
            var sentTokenCount = CountTokens(sentence);

            if (sentTokenCount > chunkSize)
            {
                if (currentChunk.Count > 0)
                {
                    yield return string.Join(" ", currentChunk).Trim();
                    currentChunk.Clear();
                    currentTokenCount = 0;
                }

                foreach (var chunk in ChunkByTokens(sentence, chunkSize, overlap))
                    yield return chunk;
                continue;
            }

            if (currentTokenCount + sentTokenCount > chunkSize && currentChunk.Count > 0)
            {
                yield return string.Join(" ", currentChunk).Trim();

                var overlapChunk = CreateOverlapBuffer(currentChunk, overlap);
                currentChunk = overlapChunk;
                currentTokenCount = overlapChunk.Count > 0 ? CountTokens(string.Join(" ", overlapChunk)) : 0;
            }

            currentChunk.Add(sentence);
            currentTokenCount += sentTokenCount;
        }

        if (currentChunk.Count > 0)
        {
            var remaining = string.Join(" ", currentChunk).Trim();
            if (!string.IsNullOrWhiteSpace(remaining))
                yield return remaining;
        }
    }

    /// <summary>
    /// 断句: 支持英文标点+空格 和 CJK 标点(无需空格)。
    /// </summary>
    private static List<string> SplitSentences(string text)
    {
        return SentenceSplitRegex.Split(text)
            .Select(s => s.Trim())
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .ToList();
    }

    /// <summary>
    /// 按 token 粒度分块。支持 CJK 字符级分割和英文词级分割。
    /// </summary>
    private IEnumerable<string> ChunkByTokens(string text, int chunkSize, int overlap)
    {
        // 使用 CjkTokenRegex 分割: 每个 CJK 字符单独一个 token，连续英文/数字为一个 token
        var tokens = CjkTokenRegex.Matches(text)
            .Select(m => m.Value)
            .Where(t => !string.IsNullOrWhiteSpace(t))
            .ToList();

        if (tokens.Count == 0)
            yield break;

        // 使用 tokenizer 精确计数，否则估算
        var tokensPerChunk = chunkSize;
        var overlapTokens = overlap;

        if (_tokenizer == null)
        {
            // 粗略估算: 每个 CJK 字符 ~1.5 BPE tokens, 每个英文词 ~1.3 tokens
            tokensPerChunk = Math.Max(1, (int)(chunkSize / 1.5));
            overlapTokens = Math.Max(0, (int)(overlap / 1.5));
        }

        var step = Math.Max(1, tokensPerChunk - overlapTokens);
        var index = 0;

        while (index < tokens.Count)
        {
            var take = Math.Min(tokensPerChunk, tokens.Count - index);
            var slice = JoinTokens(tokens, index, take);

            if (_tokenizer != null)
            {
                // 精确模式: 动态调整 take 使得 token 数 <= _chunkSize
                var ids = _tokenizer.EncodeToIds(slice);
                while (ids.Length > chunkSize && take > 1)
                {
                    take--;
                    slice = JoinTokens(tokens, index, take);
                    ids = _tokenizer.EncodeToIds(slice);
                }
            }

            if (!string.IsNullOrWhiteSpace(slice))
                yield return slice.Trim();

            if (_tokenizer != null)
            {
                // 精确步进: 计算 overlap 对应的实际 token 段数
                var overlapCount = 0;
                var overlapBpe = 0;
                for (int i = index + take - 1; i >= index && overlapBpe < overlap; i--)
                {
                    overlapBpe += EstimateSingleTokenCount(tokens[i]);
                    overlapCount++;
                }
                var actualStep = Math.Max(1, take - overlapCount);
                index += actualStep;
            }
            else
            {
                index += Math.Max(1, take - overlapTokens);
            }
        }
    }

    /// <summary>
    /// 智能拼接 token: CJK 字符间无空格，英文词间加空格。
    /// </summary>
    private static string JoinTokens(List<string> tokens, int start, int count)
    {
        var sb = new StringBuilder();
        for (int i = start; i < start + count && i < tokens.Count; i++)
        {
            var tok = tokens[i];
            if (sb.Length > 0)
            {
                bool prevIsCjk = IsCjkChar(sb[sb.Length - 1]);
                bool currIsCjk = tok.Length == 1 && IsCjkChar(tok[0]);
                // Add space unless both sides are CJK characters
                if (!(prevIsCjk && currIsCjk))
                    sb.Append(' ');
            }
            sb.Append(tok);
        }
        return sb.ToString();
    }

    private static bool IsCjkChar(char ch)
    {
        return (ch >= '\u4e00' && ch <= '\u9fff') ||
               (ch >= '\u3400' && ch <= '\u4dbf') ||
               (ch >= '\uf900' && ch <= '\ufaff');
    }

    private int EstimateSingleTokenCount(string token)
    {
        if (_tokenizer != null)
            return _tokenizer.EncodeToIds(token).Length;
        return CjkCharRegex.IsMatch(token) ? 2 : 1;
    }

    /// <summary>
    /// 估算 token 数量。支持 CJK 字符计数。
    /// </summary>
    public int CountTokens(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return 0;

        if (_tokenizer != null)
        {
            return _tokenizer.EncodeToIds(text).Length;
        }

        // 无 tokenizer 时的估算: CJK 字符 * 1.5 + 英文词汇 * 1.3
        var cjkCount = 0;
        foreach (var ch in text)
        {
            if (ch >= '\u4e00' && ch <= '\u9fff' || ch >= '\u3400' && ch <= '\u4dbf' || ch >= '\uf900' && ch <= '\ufaff')
                cjkCount++;
        }

        var nonCjkText = CjkCharRegex.Replace(text, " ");
        var wordCount = nonCjkText.Split(new[] { ' ', '\t', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries).Length;

        return (int)(cjkCount * 1.5 + wordCount * 1.3);
    }

    private List<string> CreateOverlapBuffer(List<string> buffer, int overlapTokens)
    {
        if (overlapTokens <= 0 || buffer.Count == 0)
            return new List<string>();

        var result = new List<string>();
        var tokenCount = 0;

        for (int i = buffer.Count - 1; i >= 0; i--)
        {
            var itemTokens = CountTokens(buffer[i]);
            if (tokenCount + itemTokens > overlapTokens && result.Count > 0)
                break;

            result.Insert(0, buffer[i]);
            tokenCount += itemTokens;
        }

        return result;
    }

    private static bool IsLikelyCodeBlock(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return false;
        }

        if (text.Contains("```", StringComparison.Ordinal) || text.Contains("~~~", StringComparison.Ordinal))
        {
            return true;
        }

        var lines = text.Split('\n');
        var codeLikeLineCount = 0;
        foreach (var rawLine in lines)
        {
            var line = rawLine.Trim();
            if (line.Length == 0)
            {
                continue;
            }

            if (line.StartsWith("//", StringComparison.Ordinal)
                || line.StartsWith("#", StringComparison.Ordinal)
                || line.StartsWith("import ", StringComparison.Ordinal)
                || line.StartsWith("using ", StringComparison.Ordinal)
                || line.EndsWith(";", StringComparison.Ordinal)
                || line.Contains("{", StringComparison.Ordinal)
                || line.Contains("}", StringComparison.Ordinal))
            {
                codeLikeLineCount++;
            }
        }

        return codeLikeLineCount >= 2;
    }

    private (int ChunkSize, int Overlap, bool IsCode) GetChunkProfile(string text)
    {
        var isCode = IsLikelyCodeBlock(text);
        if (!_enableAdaptiveChunking)
        {
            return (_chunkSize, _overlap, isCode);
        }

        if (isCode)
        {
            return (_codeChunkSize, _codeOverlap, true);
        }

        if (IsMixedContent(text))
        {
            return (_mixedChunkSize, _mixedOverlap, false);
        }

        return (_chunkSize, _overlap, false);
    }

    private static bool IsMixedContent(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return false;
        }

        var hasCjk = CjkCharRegex.IsMatch(text);
        var hasLatin = LatinRegex.IsMatch(text);
        if (!hasCjk || !hasLatin)
        {
            return false;
        }

        var codeSignals = 0;
        if (text.Contains("`", StringComparison.Ordinal)) codeSignals++;
        if (text.Contains(";", StringComparison.Ordinal)) codeSignals++;
        if (text.Contains("{", StringComparison.Ordinal) || text.Contains("}", StringComparison.Ordinal)) codeSignals++;
        if (text.Contains("=>", StringComparison.Ordinal) || text.Contains("::", StringComparison.Ordinal)) codeSignals++;

        return codeSignals > 0;
    }

    private static int ToAdaptiveChunkSize(int baseChunkSize, float ratio, int min)
    {
        var safeBaseChunkSize = Math.Max(1, baseChunkSize);
        var normalizedRatio = float.IsFinite(ratio) ? ratio : 1f;
        normalizedRatio = Math.Clamp(normalizedRatio, 0.3f, 1.5f);
        var value = (int)Math.Round(safeBaseChunkSize * normalizedRatio);
        var lowerBound = Math.Min(min, safeBaseChunkSize);
        return Math.Clamp(value, lowerBound, safeBaseChunkSize);
    }

    private static int ToAdaptiveOverlap(int baseOverlap, float ratio, int chunkSize)
    {
        var normalizedRatio = float.IsFinite(ratio) ? ratio : 1f;
        normalizedRatio = Math.Clamp(normalizedRatio, 0f, 1.5f);
        var value = (int)Math.Round(baseOverlap * normalizedRatio);
        return Math.Clamp(value, 0, chunkSize / 2);
    }

    private static bool TryToggleCodeFence(string line, ref bool inCodeFence, ref string? fenceMarker)
    {
        var match = CodeFenceRegex.Match(line);
        if (!match.Success)
        {
            return false;
        }

        var marker = match.Groups[1].Value;
        if (!inCodeFence)
        {
            inCodeFence = true;
            fenceMarker = marker;
            return true;
        }

        if (fenceMarker != null && marker.StartsWith(fenceMarker[0]))
        {
            inCodeFence = false;
            fenceMarker = null;
        }

        return true;
    }

    private static void AppendLine(StringBuilder builder, string line)
    {
        if (builder.Length > 0)
        {
            builder.Append('\n');
        }

        builder.Append(line);
    }

    private static void FlushParagraph(StringBuilder builder, List<string> parts)
    {
        if (builder.Length == 0)
        {
            return;
        }

        var paragraph = builder.ToString().Trim();
        if (!string.IsNullOrWhiteSpace(paragraph))
        {
            parts.Add(paragraph);
        }

        builder.Clear();
    }
}
