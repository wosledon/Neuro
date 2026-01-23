using Microsoft.ML.Tokenizers;
using Xunit.Abstractions;

namespace Neuro.Tokenizer.Tests;

public class TokenizerDemo
{
    private readonly ITestOutputHelper _output;
    public TokenizerDemo(ITestOutputHelper output)
    {
        _output = output;
    }

    [Fact]
    public void Test1()
    {
        var tokenizer = TiktokenTokenizer.CreateForEncoding("o200k_base");

        var result = tokenizer.EncodeToTokens("你好，这是一个测试文本！", out _);

        _output.WriteLine("Tokens: " + string.Join(", ", result.Select(x => x.Value)));
    }
}
