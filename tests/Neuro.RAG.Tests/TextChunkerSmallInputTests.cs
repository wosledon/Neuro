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
        var frags = chunker.Chunk(text);
        // Should not hang and should produce at least one fragment
        Assert.NotNull(frags);
        Assert.NotEmpty(frags);
    }
}