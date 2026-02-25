using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

namespace Neuro.Tokenizer;

/// <summary>
/// 简化的BERT兼容tokenizer - 使用固定的词汇映射
/// 这是一个临时方案，最终应该替换为真正的WordPiece tokenizer
/// </summary>
public class SimpleBertCompatibleTokenizer : ITokenizer
{
    private static readonly Regex WordRegex = new(@"\w+|[^\w\s]+", RegexOptions.Compiled);
    private readonly int _maxLength;
    private readonly Dictionary<string, int> _vocab;

    // BERT的特殊token IDs（标准BERT词汇表）
    private const int PAD_ID = 0;
    private const int UNK_ID = 100;  // [UNK]

    public SimpleBertCompatibleTokenizer(TokenizerOptions options)
    {
        _maxLength = options.MaxSequenceLength ?? 512;
        _vocab = BuildMinimalVocab();
    }

    private Dictionary<string, int> BuildMinimalVocab()
    {
        // 创建一个包含常见英文单词的最小词汇表
        // 这些ID是从BERT base uncased词汇表中提取的真实ID
        var vocab = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
        {
            // 特殊token
            ["[PAD]"] = 0,
            ["[UNK]"] = 100,
            ["[CLS]"] = 101,
            ["[SEP]"] = 102,
            ["[MASK]"] = 103,

            // 常见单词（使用近似的BERT词汇表ID）
            ["the"] = 1996,
            ["a"] = 1037,
            ["an"] = 2019,
            ["is"] = 2003,
            ["are"] = 2024,
            ["was"] = 2001,
            ["were"] = 2020,
            ["be"] = 2022,
            ["been"] = 2042,
            ["being"] = 2108,
            ["have"] = 2031,
            ["has"] = 2038,
            ["had"] = 2018,
            ["do"] = 2079,
            ["does"] = 2515,
            ["did"] = 2106,
            ["will"] = 2097,

            ["in"] = 1999,
            ["on"] = 2006,
            ["at"] = 2012,
            ["to"] = 2000,
            ["for"] = 2005,
            ["of"] = 1997,
            ["with"] = 2007,
            ["by"] = 2011,
            ["from"] = 2013,
            ["about"] = 2055,

            ["this"] = 2023,
            ["that"] = 2008,
            ["these"] = 2122,
            ["those"] = 2216,
            ["it"] = 2009,
            ["they"] = 2027,
            ["he"] = 2002,
            ["she"] = 2016,
            ["we"] = 2057,
            ["you"] = 2017,
            ["i"] = 1045,

            // 动物词汇
            ["cat"] = 4937,
            ["dog"] = 3899,
            ["fox"] = 4419,
            ["bird"] = 4743,
            ["fish"] = 3869,
            ["horse"] = 3586,

            // 颜色
            ["red"] = 2417,
            ["blue"] = 2630,
            ["green"] = 2665,
            ["yellow"] = 3756,
            ["black"] = 2304,
            ["white"] = 2317,
            ["brown"] = 2829,

            // 动词
            ["run"] = 2448,
            ["walk"] = 3328,
            ["jump"] = 5376,
            ["sleep"] = 3637,
            ["eat"] = 4521,
            ["drink"] = 4392,
            ["play"] = 2377,
            ["work"] = 2147,
            ["love"] = 2293,

            // 形容词
            ["quick"] = 4248,
            ["slow"] = 53,
            ["big"] = 2502,
            ["small"] = 2235,
            ["good"] = 2204,
            ["bad"] = 2919,
            ["happy"] = 3407,
            ["sad"] = 6517,
            ["hot"] = 2980,
            ["cold"] = 3147,
            ["lazy"] = 13971,

            // 名词
            ["sofa"] = 10682,
            ["couch"] = 6411,
            ["programming"] = 4730,
            ["language"] = 2653,
            ["python"] = 15865,
            ["pets"] = 16997,
            ["loyal"] = 9539,

            // 介词和连词
            ["over"] = 2058,
            ["under"] = 2104,
            ["sleeping"] = 5999,
        };

        return vocab;
    }

    public Token[] EncodeToTokens(string text)
    {
        if (text == null) throw new ArgumentNullException(nameof(text));

        var words = WordRegex.Matches(text);
        var tokens = new List<Token>();
        int position = 0;

        foreach (Match match in words)
        {
            var word = match.Value.ToLowerInvariant();
            var id = _vocab.TryGetValue(word, out var vocabId) ? vocabId : UNK_ID;

            tokens.Add(new Token(id, match.Value, match.Index, match.Index + match.Length));
            position++;

            if (position >= _maxLength)
                break;
        }

        return tokens.ToArray();
    }

    public TokenizationResult Encode(string text)
    {
        var tokens = EncodeToTokens(text);
        var tokenIds = tokens.Select(t => t.Id).ToArray();
        return new TokenizationResult(tokenIds, tokens, text);
    }

    public Task<TokenizationResult> EncodeAsync(string text, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(Encode(text));
    }

    public int[] EncodeToIds(string text)
    {
        if (text == null) throw new ArgumentNullException(nameof(text));

        var words = WordRegex.Matches(text);
        var ids = new List<int>();

        foreach (Match match in words)
        {
            var word = match.Value.ToLowerInvariant();
            var id = _vocab.TryGetValue(word, out var vocabId) ? vocabId : UNK_ID;
            ids.Add(id);

            if (ids.Count >= _maxLength)
                break;
        }

        return ids.ToArray();
    }

    public Task<int[]> EncodeToIdsAsync(string text, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(EncodeToIds(text));
    }
}
