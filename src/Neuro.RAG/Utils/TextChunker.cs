using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using Neuro.RAG.Models;
using Neuro.Tokenizer;

namespace Neuro.RAG.Utils;

public class TextChunker
{
    private readonly ITokenizer? _tokenizer;
    private readonly int _chunkSize;
    private readonly int _overlap;

    // Split on sentence-ending punctuation followed by whitespace
    private static readonly Regex SentenceSplitRegex = new(
        @"(?<=[.!?。！？；])\s+",
        RegexOptions.Compiled);

    public TextChunker(ITokenizer? tokenizer = null, int chunkSize = 256, int overlap = 50)
    {
        _tokenizer = tokenizer;
        _chunkSize = chunkSize > 0 ? chunkSize : 256;
        _overlap = Math.Clamp(overlap, 0, chunkSize / 2);
    }

    /// <summary>
    /// Split text into document fragments using sentence-aware chunking.
    /// Strategy: paragraphs -> sentences -> words as progressively smaller units.
    /// </summary>
    public IEnumerable<DocumentFragment> Chunk(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            yield break;

        var paragraphs = SplitParagraphs(text);
        var chunkIndex = 0;
        var buffer = new List<string>();
        var bufferTokenCount = 0;

        foreach (var paragraph in paragraphs)
        {
            var paraTokenCount = CountTokens(paragraph);

            if (paraTokenCount <= _chunkSize)
            {
                // Check if adding this paragraph would overflow
                if (bufferTokenCount + paraTokenCount > _chunkSize && buffer.Count > 0)
                {
                    var chunkText = string.Join("\n\n", buffer).Trim();
                    if (!string.IsNullOrWhiteSpace(chunkText))
                    {
                        yield return new DocumentFragment(chunkIndex.ToString(), chunkText, null, null, chunkIndex);
                        chunkIndex++;
                    }

                    var overlapBuffer = CreateOverlapBuffer(buffer, _overlap);
                    buffer = overlapBuffer;
                    bufferTokenCount = buffer.Count > 0 ? CountTokens(string.Join("\n\n", buffer)) : 0;
                }

                buffer.Add(paragraph);
                bufferTokenCount += paraTokenCount;
            }
            else
            {
                // Paragraph is too large: flush buffer, then split by sentences
                if (buffer.Count > 0)
                {
                    var chunkText = string.Join("\n\n", buffer).Trim();
                    if (!string.IsNullOrWhiteSpace(chunkText))
                    {
                        yield return new DocumentFragment(chunkIndex.ToString(), chunkText, null, null, chunkIndex);
                        chunkIndex++;
                    }
                    buffer.Clear();
                    bufferTokenCount = 0;
                }

                foreach (var sentenceChunk in ChunkBySentences(paragraph))
                {
                    yield return new DocumentFragment(chunkIndex.ToString(), sentenceChunk, null, null, chunkIndex);
                    chunkIndex++;
                }
            }
        }

        // Emit remaining buffer
        if (buffer.Count > 0)
        {
            var chunkText = string.Join("\n\n", buffer).Trim();
            if (!string.IsNullOrWhiteSpace(chunkText))
            {
                yield return new DocumentFragment(chunkIndex.ToString(), chunkText, null, null, chunkIndex);
            }
        }
    }

    private static List<string> SplitParagraphs(string text)
    {
        // Split on double newlines (paragraph breaks)
        var parts = Regex.Split(text, @"\r?\n\s*\r?\n")
            .Select(p => p.Trim())
            .Where(p => !string.IsNullOrWhiteSpace(p))
            .ToList();

        // If no paragraph breaks found in long text, split on single newlines
        if (parts.Count <= 1 && text.Length > 500)
        {
            parts = text.Split('\n')
                .Select(p => p.Trim())
                .Where(p => !string.IsNullOrWhiteSpace(p))
                .ToList();
        }

        return parts;
    }

    private IEnumerable<string> ChunkBySentences(string text)
    {
        var sentences = SentenceSplitRegex.Split(text)
            .Select(s => s.Trim())
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .ToList();

        if (sentences.Count == 0)
        {
            foreach (var chunk in ChunkByWords(text))
                yield return chunk;
            yield break;
        }

        var currentChunk = new List<string>();
        var currentTokenCount = 0;

        foreach (var sentence in sentences)
        {
            var sentTokenCount = CountTokens(sentence);

            // Single sentence exceeds chunk size
            if (sentTokenCount > _chunkSize)
            {
                if (currentChunk.Count > 0)
                {
                    yield return string.Join(" ", currentChunk).Trim();
                    currentChunk.Clear();
                    currentTokenCount = 0;
                }

                foreach (var chunk in ChunkByWords(sentence))
                    yield return chunk;
                continue;
            }

            // Adding this sentence would overflow
            if (currentTokenCount + sentTokenCount > _chunkSize && currentChunk.Count > 0)
            {
                yield return string.Join(" ", currentChunk).Trim();

                var overlapChunk = CreateOverlapBuffer(currentChunk, _overlap);
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

    private IEnumerable<string> ChunkByWords(string text)
    {
        var words = text.Split(new[] { ' ', '\t' }, StringSplitOptions.RemoveEmptyEntries);
        if (words.Length == 0)
            yield break;

        // Estimate ~1.3 tokens per word for English text
        var wordsPerChunk = Math.Max(1, (int)(_chunkSize / 1.3));
        var overlapWords = Math.Max(0, (int)(_overlap / 1.3));
        var step = Math.Max(1, wordsPerChunk - overlapWords);

        var index = 0;
        while (index < words.Length)
        {
            var take = Math.Min(wordsPerChunk, words.Length - index);
            var slice = string.Join(' ', words.Skip(index).Take(take)).Trim();
            if (!string.IsNullOrWhiteSpace(slice))
                yield return slice;

            index += step;
        }
    }

    private int CountTokens(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return 0;

        if (_tokenizer != null)
        {
            return _tokenizer.EncodeToIds(text).Length;
        }

        // Rough estimate: ~1.3 tokens per word for English
        var wordCount = text.Split(new[] { ' ', '\t', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries).Length;
        return (int)(wordCount * 1.3);
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
}
