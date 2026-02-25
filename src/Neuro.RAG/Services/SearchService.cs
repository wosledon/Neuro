using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Options;
using Neuro.RAG.Abstractions;
using Neuro.RAG.Models;
using Neuro.Vector;
using Neuro.Vectorizer;
using Neuro.Tokenizer;

namespace Neuro.RAG.Services;

public class SearchService : ISearchService
{
    private static readonly Regex TokenRegex = new("[\\p{L}\\p{N}_]+", RegexOptions.Compiled);
    private static readonly Regex CjkRegex = new("[\\u3400-\\u4DBF\\u4E00-\\u9FFF\\uF900-\\uFAFF]", RegexOptions.Compiled);
    private readonly ITokenizer _tokenizer;
    private readonly IVectorizer _vectorizer;
    private readonly IVectorStore _store;
    private readonly IOptions<RagOptions> _options;

    /// <summary>
    /// 内部缓存：存储每个词的文档频率（用于TF-IDF计算）
    /// </summary>
    private Dictionary<string, int> _termDocFrequency = new();
    /// <summary>
    /// 内部缓存：总文档数
    /// </summary>
    private int _totalDocCount = 0;

    public SearchService(ITokenizer tokenizer, IVectorizer vectorizer, IVectorStore store, IOptions<RagOptions> options)
    {
        _tokenizer = tokenizer;
        _vectorizer = vectorizer;
        _store = store;
        _options = options;
        
        // 初始化文档频率缓存（懒加载）
        _ = InitializeTermFrequencyCacheAsync();
    }

    /// <summary>
    /// 后台初始化文档频率缓存（用于TF-IDF计算）
    /// </summary>
    private async Task InitializeTermFrequencyCacheAsync()
    {
        try
        {
            // 获取所有文档的词频统计
            var ids = await _store.ListIdsByPrefixAsync(string.Empty);
            _totalDocCount = ids.Count();
            
            if (_totalDocCount > 0)
            {
                var cache = new Dictionary<string, int>();
                var docCount = 0;
                
                // 采样部分文档以提高初始化速度
                var sampleIds = ids.Take(Math.Min(1000, _totalDocCount)).ToList();
                
                foreach (var id in sampleIds)
                {
                    var record = await _store.GetAsync(new[] { id });
                    if (record == null || !record.Any()) continue;
                    
                    var text = record.First().Metadata?["text"]?.ToString();
                    if (string.IsNullOrWhiteSpace(text)) continue;
                    
                    var tokens = Tokenize(text);
                    foreach (var token in tokens)
                    {
                        cache.TryGetValue(token, out var freq);
                        cache[token] = freq + 1;
                    }
                    
                    docCount++;
                    if (docCount >= 1000) break;
                }
                
                _termDocFrequency = cache;
            }
        }
        catch
        {
            // 初始化失败不影响搜索功能
        }
    }

    public async Task<IEnumerable<SearchResult>> QueryAsync(string query, int topK = 5, CancellationToken cancellationToken = default)
    {
        var cfg = _options.Value;
        // 根据需要调整预取数量，确保有足够候选进行重排序
        var rerankFactor = cfg.EnableRerank ? 2 : 1;
        var prefetch = System.Math.Max(topK * System.Math.Max(1, cfg.PrefetchFactor) * rerankFactor, topK * rerankFactor);
        var minScore = cfg.MinScore;
        var maxPerSource = cfg.MaxPerSource;
        var keywordBoost = cfg.KeywordBoost;
        var minKeywordScore = cfg.MinKeywordScore;

        var ids = _tokenizer.EncodeToIds(query);
        var emb = await _vectorizer.EmbedAsync(ids, cancellationToken);
        var found = await _store.QueryAsync(emb, prefetch, minScore, cancellationToken);

        var baseResults = found
            .Select(f => new SearchResult(
                new DocumentFragment(
                    f.Record.Id,
                    f.Record.Metadata != null && f.Record.Metadata.ContainsKey("text")
                        ? f.Record.Metadata["text"]?.ToString() ?? string.Empty
                        : string.Empty,
                    f.Record.Metadata,
                    null,
                    f.Record.Metadata != null && f.Record.Metadata.ContainsKey("chunkIndex")
                        ? (int)f.Record.Metadata["chunkIndex"]!
                        : 0),
                f.Score,
                f.Record.Embedding))
            .Where(r => !string.IsNullOrWhiteSpace(r.Fragment.Text))
            .ToList();

        var queryTokens = Tokenize(query);
        var scored = new List<(SearchResult Result, float CombinedScore, string Text, string SourceKey)>(baseResults.Count);
        foreach (var result in baseResults)
        {
            var keywordScore = queryTokens.Count == 0 ? 0f : ComputeKeywordScore(queryTokens, result.Fragment.Text, _termDocFrequency, _totalDocCount);
            if (queryTokens.Count > 0 && minKeywordScore > 0f && keywordScore < minKeywordScore)
            {
                continue;
            }

            var combined = keywordBoost > 0f && queryTokens.Count > 0
                ? result.Score * (1f + keywordBoost * keywordScore)
                : result.Score;

            scored.Add((result with { Score = combined }, combined, result.Fragment.Text, GetSourceKey(result)));
        }

        // 基于混合得分排序
        var sorted = scored
            .OrderByDescending(r => r.CombinedScore)
            .Select(r => r.Result)
            .DistinctBy(r => r.Fragment.Text)
            .ToList();

        // 应用重排序（Rerank）
        if (sorted.Count > 1 && cfg.EnableRerank)
        {
            sorted = RerankResults(sorted, query, topK * 2);
        }

        var results = sorted;

        if (cfg.EnableLexicalFallback && queryTokens.Count > 0 && results.Count < topK)
        {
            var fallback = await QueryLexicalFallbackAsync(query, queryTokens, prefetch, cfg.LexicalCandidateLimit, cancellationToken);
            if (fallback.Count > 0)
            {
                var merged = results
                    .Concat(fallback)
                    .OrderByDescending(r => r.Score)
                    .DistinctBy(r => r.Fragment.Text)
                    .ToList();
                results = merged;
            }
        }

        // 再次应用重排序（对合并后的结果）
        if (results.Count > 1 && cfg.EnableRerank)
        {
            results = RerankResults(results, query, topK);
        }

        if (maxPerSource > 0)
        {
            var perSource = new Dictionary<string, int>(System.StringComparer.OrdinalIgnoreCase);
            var limited = new List<SearchResult>();
            foreach (var result in results)
            {
                var key = GetSourceKey(result);
                perSource.TryGetValue(key, out var count);
                if (count >= maxPerSource)
                {
                    continue;
                }

                perSource[key] = count + 1;
                limited.Add(result);
                if (limited.Count >= topK)
                {
                    break;
                }
            }

            return limited;
        }

        return results.Take(topK);
    }

    private static HashSet<string> Tokenize(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return new HashSet<string>(System.StringComparer.OrdinalIgnoreCase);
        }

        var matches = TokenRegex.Matches(text);
        var tokens = new HashSet<string>(System.StringComparer.OrdinalIgnoreCase);
        foreach (Match match in matches)
        {
            if (match.Success && match.Value.Length > 0)
            {
                tokens.Add(match.Value);

                if (ContainsCjk(match.Value))
                {
                    foreach (var gram in BuildCjkNGrams(match.Value, 2))
                    {
                        tokens.Add(gram);
                    }
                }
            }
        }

        return tokens;
    }

    private static bool ContainsCjk(string text)
    {
        return !string.IsNullOrWhiteSpace(text) && CjkRegex.IsMatch(text);
    }

    private static IEnumerable<string> BuildCjkNGrams(string text, int n)
    {
        if (string.IsNullOrWhiteSpace(text) || n <= 0)
        {
            yield break;
        }

        var chars = text.Where(c => !char.IsWhiteSpace(c)).ToArray();
        if (chars.Length == 0)
        {
            yield break;
        }

        if (chars.Length < n)
        {
            yield return new string(chars);
            yield break;
        }

        for (var index = 0; index <= chars.Length - n; index++)
        {
            yield return new string(chars, index, n);
        }
    }

    private static float ComputeKeywordScore(
        HashSet<string> queryTokens, 
        string text, 
        Dictionary<string, int>? termDocFrequency = null, 
        int totalDocCount = 1)
    {
        if (queryTokens.Count == 0 || string.IsNullOrWhiteSpace(text))
        {
            return 0f;
        }

        var fragmentTokens = Tokenize(text);
        if (fragmentTokens.Count == 0)
        {
            return 0f;
        }

        var overlap = 0;
        var queryTokenFreq = queryTokens.GroupBy(t => t).ToDictionary(g => g.Key, g => g.Count());
        var fragmentTokenFreq = fragmentTokens.GroupBy(t => t).ToDictionary(g => g.Key, g => g.Count());

        foreach (var token in queryTokens)
        {
            if (fragmentTokens.Contains(token))
            {
                overlap++;
            }
        }

        if (overlap == 0)
        {
            return 0f;
        }

        // 使用改进的TF-IDF风格计算
        // : 考虑词频和逆文档频率
        var idfSum = 0f;
        var tfIdfScore = 0f;
        var docs = Math.Max(1, totalDocCount);
        
        foreach (var token in queryTokens)
        {
            // 计算IDF: log((docs + 1) / (docFreq + 1)) + 1
            var docFreq = 1;
            if (termDocFrequency != null)
            {
                termDocFrequency.TryGetValue(token, out docFreq);
            }
            var idf = (float)(Math.Log((docs + 1) / (docFreq + 1)) + 1.0);
            idfSum += idf;

            // TF-IDF: tf * idf
            var tf = (float)queryTokenFreq[token] / queryTokens.Count;
            tfIdfScore += tf * idf;
        }

        // 归一化得分
        var normalizedScore = tfIdfScore / Math.Max(1, idfSum);

        // F1-score 风格的计算，考虑召回率和精确率
        var recall = (float)overlap / queryTokens.Count;
        var precision = (float)overlap / fragmentTokens.Count;
        var f1 = 2f * precision * recall / (precision + recall);

        // 结合TF-IDF和F1得分
        return 0.6f * normalizedScore + 0.4f * f1;
    }

    /// <summary>
    /// 计算查询的TF-IDF权重
    /// </summary>
    private Dictionary<string, float> ComputeQueryTfidfWeights(HashSet<string> queryTokens)
    {
        var weights = new Dictionary<string, float>();
        var totalDocs = Math.Max(1, _totalDocCount);

        foreach (var token in queryTokens)
        {
            var docFreq = 1;
            _termDocFrequency.TryGetValue(token, out docFreq);
            var idf = (float)(Math.Log((totalDocs + 1) / (docFreq + 1)) + 1.0);
            weights[token] = idf;
        }

        return weights;
    }

    private static string GetSourceKey(SearchResult result)
    {
        if (result.Fragment.Metadata != null && result.Fragment.Metadata.ContainsKey("source"))
        {
            var source = result.Fragment.Metadata["source"]?.ToString();
            if (!string.IsNullOrWhiteSpace(source))
            {
                return source;
            }
        }

        var id = result.Fragment.Id ?? string.Empty;
        var idx = id.IndexOf(':');
        return idx > 0 ? id.Substring(0, idx) : id;
    }

    private async Task<List<SearchResult>> QueryLexicalFallbackAsync(
        string query,
        HashSet<string> queryTokens,
        int maxCandidates,
        int lexicalCandidateLimit,
        CancellationToken cancellationToken)
    {
        var ids = await _store.ListIdsByPrefixAsync(string.Empty, cancellationToken);

        // 限制候选数量，避免扫描过多记录
        if (lexicalCandidateLimit > 0)
        {
            ids = ids.Take(lexicalCandidateLimit);
        }

        var records = await _store.GetAsync(ids, cancellationToken);
        var queryTrimmed = query.Trim();
        var scored = new List<SearchResult>(System.Math.Min(maxCandidates, lexicalCandidateLimit));
        var queryWeights = ComputeQueryTfidfWeights(queryTokens);

        // 早期终止：一旦找到足够的高质量结果就停止
        var highScoreThreshold = 0.5f;
        var earlyStopCount = System.Math.Max(maxCandidates * 2, 20);

        foreach (var record in records)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var text = record.Metadata != null && record.Metadata.ContainsKey("text")
                ? record.Metadata["text"]?.ToString() ?? string.Empty
                : string.Empty;
            if (string.IsNullOrWhiteSpace(text))
            {
                continue;
            }

            var keywordScore = ComputeKeywordScore(queryTokens, text);
            var substringBonus = queryTrimmed.Length > 1 && text.Contains(queryTrimmed, System.StringComparison.OrdinalIgnoreCase) ? 0.35f : 0f;
            
            // 添加查询词在文档中的位置得分
            var positionScore = ComputePositionScore(query, text);
            
            // 结合TF-IDF权重的位置得分
            var lexicalScore = 0.5f * keywordScore + 0.3f * substringBonus + 0.2f * positionScore;

            // 使用更严格的阈值过滤，避免低质量结果
            if (lexicalScore <= 0.1f)
            {
                continue;
            }

            var fragment = new DocumentFragment(
                record.Id,
                text,
                record.Metadata,
                null,
                record.Metadata != null && record.Metadata.ContainsKey("chunkIndex")
                    ? (int)record.Metadata["chunkIndex"]!
                    : 0);

            scored.Add(new SearchResult(fragment, lexicalScore, record.Embedding));

            // 早期终止：如果已经找到足够多的高分结果
            if (scored.Count >= earlyStopCount && scored.Count(x => x.Score >= highScoreThreshold) >= maxCandidates)
            {
                break;
            }
        }

        return scored
            .OrderByDescending(x => x.Score)
            .Take(System.Math.Max(1, maxCandidates))
            .ToList();
    }
    
    /// <summary>
    /// 计算查询词在文档中的位置得分（靠近文档开头的词更重要）
    /// </summary>
    private static float ComputePositionScore(string query, string text)
    {
        var queryWords = query.ToLower().Split(new[] { ' ', '\t', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries);
        var textLower = text.ToLower();
        
        if (queryWords.Length == 0) return 0f;
        
        var totalPositionScore = 0f;
        
        foreach (var word in queryWords)
        {
            var index = textLower.IndexOf(word, StringComparison.OrdinalIgnoreCase);
            if (index >= 0)
            {
                // 越靠前得分越高
                var positionRatio = 1f - (Math.Min(index, 500) / 500f);
                totalPositionScore += positionRatio;
            }
        }
        
        return totalPositionScore / queryWords.Length;
    }
    
    /// <summary>
    /// 对搜索结果进行重排序（Rerank）
    /// 结合向量相似度、关键词匹配度和位置得分
    /// </summary>
    private List<SearchResult> RerankResults(List<SearchResult> results, string query, int topK)
    {
        if (results.Count <= 1) return results;
        
        var queryTokens = Tokenize(query);
        var queryWeights = ComputeQueryTfidfWeights(queryTokens);
        
        var reranked = new List<SearchResult>();
        
        foreach (var result in results)
        {
            var originalScore = result.Score;
            
            // 重新计算关键词匹配得分（使用TF-IDF）
            var keywordScore = ComputeKeywordScore(queryTokens, result.Fragment.Text, _termDocFrequency, _totalDocCount);

            // 位置得分
            var positionScore = ComputePositionScore(query, result.Fragment.Text);

            // 信息熵得分（文本长度适中）
            var textLengthScore = ComputeTextLengthScore(result.Fragment.Text);

            // 重排序得分：加权组合
            var rerankScore =
                0.4f * originalScore +      // 原始向量相似度
                0.25f * keywordScore +       // TF-IDF关键词匹配
                0.2f * positionScore +       // 位置重要性
                0.15f * textLengthScore;     // 文本质量

            reranked.Add(result with { Score = rerankScore });
        }
        
        // 按重排序得分重新排序
        return reranked
            .OrderByDescending(r => r.Score)
            .Take(topK)
            .ToList();
    }
    
    /// <summary>
    /// 计算文本长度得分（适中的长度更有信息量）
    /// </summary>
    private static float ComputeTextLengthScore(string text)
    {
        var length = text.Length;
        
        // 理想长度：200-500字符
        if (length >= 200 && length <= 500) return 1.0f;
        
        if (length < 200)
        {
            // 太短，信息量不足
            return length / 200f;
        }
        
        // 太长，信息密度降低
        return Math.Max(0.3f, 1f - (length - 500) / 1000f);
    }
}
