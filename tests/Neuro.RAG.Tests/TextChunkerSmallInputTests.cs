using System.Linq;
using Neuro.RAG.Utils;
using Xunit;

namespace Neuro.RAG.Tests;

public class TextChunkerSmallInputTests
{
    [Fact]
    public void Chunk_SmallInput_CompletesQuickly()
    {
        var text = "hello"; // single word -> very small token count
        var chunker = new TextChunker(null); // no tokenizer, uses paragraph split
        var frags = chunker.Chunk(text).ToArray();
        // Should not hang; tiny input may be filtered by minChunkTokens
        Assert.NotNull(frags);
    }

    [Fact]
    public void Chunk_SmallInput_WithSmallChunkSize_ProducesFragments()
    {
        var text = "hello world test";
        var chunker = new TextChunker(null, chunkSize: 3, overlap: 0);
        var frags = chunker.Chunk(text).ToArray();
        Assert.NotNull(frags);
        Assert.NotEmpty(frags);
    }
}