using Xunit;

namespace Neuro.Tokenizer.Tests;

public class TokenizerTests
{
    [Fact]
    public void Encode_ReturnsIdsAndTokens()
    {
        var opts = new TokenizerOptions();
        var t = new TiktokenTokenizerAdapter(opts);

        var res = t.Encode("hello 你好");

        Assert.NotNull(res);
        Assert.NotEmpty(res.TokenIds);
        Assert.NotEmpty(res.Tokens);
        Assert.Equal(res.TokenIds.Length, res.Tokens.Length);
    }

    [Fact]
    public void EncodeToIds_TruncationWorks()
    {
        var opts = new TokenizerOptions { MaxSequenceLength = 2 };
        var t = new TiktokenTokenizerAdapter(opts);
        var ids = t.EncodeToIds("this is a test for truncation");
        Assert.True(ids.Length >= 2);
    }

    [Fact]
    public async Task EncodeAsync_Works()
    {
        var opts = new TokenizerOptions();
        var t = new TiktokenTokenizerAdapter(opts);
        var res = await t.EncodeAsync("async test");
        Assert.NotNull(res);
    }
}