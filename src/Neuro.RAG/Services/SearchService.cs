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

    public SearchService(ITokenizer tokenizer, IVectorizer vectorizer, IVectorStore store, IOptions<RagOptions> options)
    {
        _tokenizer = tokenizer;
        _vectorizer = vectorizer;
        _store = store;
        _options = options;
    }

    public async Task<IEnumerable<SearchResult>> QueryAsync(string query, int topK = 5, CancellationToken cancellationToken = default)
    {
        var cfg = _options.Value;
        var prefetch = System.Math.Max(topK * System.Math.Max(1, cfg.PrefetchFactor), topK);
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
            var keywordScore = queryTokens.Count == 0 ? 0f : ComputeKeywordScore(queryTokens, result.Fragment.Text);
            if (queryTokens.Count > 0 && minKeywordScore > 0f && keywordScore < minKeywordScore)
            {
                continue;
            }

            var combined = keywordBoost > 0f && queryTokens.Count > 0
                ? result.Score * (1f + keywordBoost * keywordScore)
                : result.Score;

            scored.Add((result with { Score = combined }, combined, result.Fragment.Text, GetSourceKey(result)));
        }

        var results = scored
            .OrderByDescending(r => r.CombinedScore)
            .Select(r => r.Result)
            .DistinctBy(r => r.Fragment.Text)
            .ToList();

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

    private static float ComputeKeywordScore(HashSet<string> queryTokens, string text)
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

        // 使用 F1-score 风格的计算，考虑召回率和精确率
        // recall = overlap / queryTokens.Count
        // precision = overlap / fragmentTokens.Count
        // F1 = 2 * (precision * recall) / (precision + recall)
        var recall = (float)overlap / queryTokens.Count;
        var precision = (float)overlap / fragmentTokens.Count;
        return 2f * precision * recall / (precision + recall);
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
            var lexicalScore = keywordScore + substringBonus;

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
}
