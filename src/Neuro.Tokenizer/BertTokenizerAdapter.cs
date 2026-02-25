using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Neuro.Tokenizer;

/// <summary>
/// 简化的 BERT-compatible Tokenizer 适配器。
/// 由于没有完整的 WordPiece 词表，这里使用一个简化的实现：
/// 1. 将文本分割为单词
/// 2. 使用哈希将单词映射到 BERT 词表范围内 [0, 30521]
/// 注意：这是一个简化实现，生产环境应使用真实的 BERT Tokenizer
/// </summary>
public class BertTokenizerAdapter : ITokenizer
{
    private readonly TokenizerOptions _options;
    private readonly Random _random;
    private readonly HashSet<string> _vocab;
    private readonly Dictionary<string, int> _wordToId;
    private readonly Dictionary<int, string> _idToWord;

    // BERT 词表大小
    private const int VocabSize = 30522;
    private const int MaxWordLength = 100;

    public BertTokenizerAdapter(TokenizerOptions options)
    {
        _options = options ?? throw new ArgumentNullException(nameof(options));
        _random = new Random(42); // 固定种子以确保可重复性

        // 初始化简化词表
        _vocab = new HashSet<string>();
        _wordToId = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        _idToWord = new Dictionary<int, string>();

        // 添加特殊 token
        AddToVocab("[PAD]", 0);
        AddToVocab("[UNK]", 100);
        AddToVocab("[CLS]", 101);
        AddToVocab("[SEP]", 102);
        AddToVocab("[MASK]", 103);

        // 添加常见单词和字符
        var commonWords = new[] { "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
            "have", "has", "had", "do", "does", "did", "will", "would", "could", "should",
            "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them",
            "my", "your", "his", "her", "its", "our", "their",
            "this", "that", "these", "those",
            "and", "or", "but", "if", "then", "else", "when", "where", "why", "how",
            "in", "on", "at", "to", "for", "of", "with", "by", "from", "up", "about", "into", "through",
            "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
            ".", ",", "!", "?", ";", ":", "'", "\"", "-", "_", "(", ")", "[", "]", "{", "}",
            "public", "private", "class", "interface", "void", "string", "int", "bool", "return", "new",
            "function", "var", "let", "const", "if", "else", "for", "while", "return", "import", "export",
            "using", "namespace", "class", "struct", "enum", "async", "await", "task", "action", "func" };

        int id = 104;
        foreach (var word in commonWords)
        {
            if (id < VocabSize)
            {
                AddToVocab(word, id++);
            }
        }
    }

    private void AddToVocab(string word, int id)
    {
        _vocab.Add(word);
        _wordToId[word] = id;
        _idToWord[id] = word;
    }

    private int GetWordId(string word)
    {
        if (_wordToId.TryGetValue(word, out var id))
        {
            return id;
        }

        // 为了避免哈希碰撞，将未知单词缓存到词表中
        // 确保相同的单词总是映射到相同的唯一 ID
        var hash = word.GetHashCode();
        var mappedId = Math.Abs(hash) % (VocabSize - 1000) + 1000; // 保留前 1000 个位置给特殊 token

        // 检查是否已经有其他单词使用了这个ID（碰撞检测）
        if (!_idToWord.ContainsKey(mappedId))
        {
            // 缓存这个映射，避免重复计算
            _wordToId[word] = mappedId;
            _idToWord[mappedId] = word;
        }
        else if (_idToWord[mappedId] != word)
        {
            // 发生碰撞，线性探测找到下一个可用ID
            var probeId = mappedId;
            var maxProbes = 1000; // 限制探测次数
            var probeCount = 0;

            while (_idToWord.ContainsKey(probeId) && _idToWord[probeId] != word && probeCount < maxProbes)
            {
                probeId = (probeId + 1) % VocabSize;
                if (probeId < 1000) probeId = 1000; // 跳过保留区域
                probeCount++;
            }

            if (!_idToWord.ContainsKey(probeId))
            {
                _wordToId[word] = probeId;
                _idToWord[probeId] = word;
                mappedId = probeId;
            }
            else
            {
                mappedId = probeId;
            }
        }

        return mappedId;
    }

    public TokenizationResult Encode(string text)
    {
        if (text == null) throw new ArgumentNullException(nameof(text));

        var tokens = new List<Token>();
        var tokenIds = new List<int>();

        // 不添加 [CLS] token 到位置信息中，或者给它正确的位置
        // 这样 TextChunker 可以正确使用字符偏移

        // 简单的分词：按空格和标点符号分割，同时记录原始位置
        var words = TokenizeSimple(text);
        int currentPos = 0;
        int tokenCount = 0;

        foreach (var word in words)
        {
            // 跳过空字符串但仍然更新位置
            if (word.Length == 0)
            {
                continue;
            }

            // 在原文中找到这个word的实际位置
            var actualPos = text.IndexOf(word, currentPos);
            if (actualPos < 0)
            {
                actualPos = currentPos; // 找不到就使用当前位置
            }

            var wordId = GetWordId(word);
            var startPos = actualPos;
            var endPos = actualPos + word.Length;

            tokens.Add(new Token(wordId, word, startPos, endPos));
            tokenIds.Add(wordId);

            currentPos = endPos;
            tokenCount++;

            // 如果超过最大长度，截断
            if (_options.MaxSequenceLength.HasValue && tokenCount >= _options.MaxSequenceLength.Value)
            {
                break;
            }
        }

        return new TokenizationResult(tokenIds.ToArray(), tokens.ToArray(), text);
    }

    private List<string> TokenizeSimple(string text)
    {
        var result = new List<string>();
        var currentWord = new System.Text.StringBuilder();

        foreach (char c in text)
        {
            if (char.IsWhiteSpace(c))
            {
                if (currentWord.Length > 0)
                {
                    result.Add(currentWord.ToString());
                    currentWord.Clear();
                }
                result.Add(c.ToString());
            }
            else if (char.IsPunctuation(c) || char.IsSymbol(c))
            {
                if (currentWord.Length > 0)
                {
                    result.Add(currentWord.ToString());
                    currentWord.Clear();
                }
                result.Add(c.ToString());
            }
            else
            {
                currentWord.Append(c);
            }
        }

        if (currentWord.Length > 0)
        {
            result.Add(currentWord.ToString());
        }

        return result;
    }

    public Task<TokenizationResult> EncodeAsync(string text, CancellationToken cancellationToken = default)
    {
        return Task.Run(() => Encode(text), cancellationToken);
    }

    public int[] EncodeToIds(string text)
    {
        return Encode(text).TokenIds;
    }

    public Task<int[]> EncodeToIdsAsync(string text, CancellationToken cancellationToken = default)
    {
        return Task.Run(() => EncodeToIds(text), cancellationToken);
    }

    public Token[] EncodeToTokens(string text)
    {
        return Encode(text).Tokens;
    }
}
