using System.Linq;
using Neuro.RAG.Utils;
using Neuro.RAG.Models;
using Neuro.Tokenizer;
using Xunit;
using System.Threading.Tasks;

namespace Neuro.RAG.Tests;

public class TextChunkerTests
{
    private class OffsetTokenizer : ITokenizer
    {
        // 简单分词：按空格分割并记录字符偏移
        public Token[] EncodeToTokens(string text)
        {
            var parts = text.Split(' ');
            var list = new System.Collections.Generic.List<Token>();
            var pos = 0;
            for (int i = 0; i < parts.Length; i++)
            {
                var p = parts[i];
                var start = text.IndexOf(p, pos);
                if (start < 0) start = pos;
                var end = start + p.Length;
                list.Add(new Token(i, p, start, end));
                pos = end;
            }
            return list.ToArray();
        }

        public TokenizationResult Encode(string text) => new TokenizationResult(EncodeToTokens(text).Select(t => t.Id).ToArray(), EncodeToTokens(text), text);
        public System.Threading.Tasks.Task<TokenizationResult> EncodeAsync(string text, System.Threading.CancellationToken cancellationToken = default) => Task.FromResult(Encode(text));
        public int[] EncodeToIds(string text) => EncodeToTokens(text).Select(t => t.Id).ToArray();
        public Task<int[]> EncodeToIdsAsync(string text, System.Threading.CancellationToken cancellationToken = default) => Task.FromResult(EncodeToIds(text));
    }

    [Fact]
    public void Chunk_WithTokenizer_ProducesFragments_WithSubstrings()
    {
        var text = "This is a test of chunking using offsets and tokenizer.";
        var tokenizer = new OffsetTokenizer();
        var chunker = new TextChunker(tokenizer, chunkSize: 4, overlap: 1);

        var frags = chunker.Chunk(text).ToArray();
        Assert.True(frags.Length >= 1);
        foreach (var f in frags)
        {
            Assert.False(string.IsNullOrWhiteSpace(f.Text));
            Assert.Contains(f.Text.Trim(), text);
        }
    }

    [Fact]
    public void Chunk_WithoutTokenizer_SplitsParagraphs()
    {
        var text = "Para1\n\nPara2\n\nPara3";
        // With small chunk size, each paragraph becomes its own chunk
        var chunker = new TextChunker(null, chunkSize: 1, overlap: 0);
        var frags = chunker.Chunk(text).ToArray();
        Assert.Equal(3, frags.Length);
        Assert.Contains(frags, f => f.Text.Contains("Para1"));
    }
}