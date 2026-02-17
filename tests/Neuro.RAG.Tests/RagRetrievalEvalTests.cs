using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using Neuro.RAG.Models;
using Neuro.RAG.Services;
using Neuro.Tokenizer;
using Neuro.Vector;
using Neuro.Vector.Stores;
using Neuro.Vectorizer;
using Xunit;
using Xunit.Abstractions;

namespace Neuro.RAG.Tests;

public class RagRetrievalEvalTests
{
    private readonly ITestOutputHelper _output;

    public RagRetrievalEvalTests(ITestOutputHelper output)
    {
        _output = output;
    }

    [Fact]
    public async Task OfflineEval_BaselineVsTuned_ReportsRecallAndMrr()
    {
        var dataset = BuildDataset();

        var baseline = new RagOptions
        {
            TopK = 3,
            MinScore = 0.1f,
            PrefetchFactor = 4,
            MaxPerSource = 3,
            KeywordBoost = 0.6f,
            MinKeywordScore = 0.01f
        };

        var tuned = new RagOptions
        {
            TopK = 3,
            MinScore = 0f,
            PrefetchFactor = 4,
            MaxPerSource = 3,
            KeywordBoost = 0.6f,
            MinKeywordScore = 0f
        };

        var baselineMetrics = await EvaluateAsync(dataset, baseline);
        var tunedMetrics = await EvaluateAsync(dataset, tuned);

        _output.WriteLine($"Baseline -> Recall@3: {baselineMetrics.RecallAtK:F3}, MRR@3: {baselineMetrics.MrrAtK:F3}");
        _output.WriteLine($"Tuned    -> Recall@3: {tunedMetrics.RecallAtK:F3}, MRR@3: {tunedMetrics.MrrAtK:F3}");

        foreach (var row in tunedMetrics.Details)
        {
            _output.WriteLine($"Q={row.Query} | Rank={row.FirstRelevantRank?.ToString() ?? "None"} | Top={string.Join(", ", row.TopSources)}");
        }

        Assert.True(tunedMetrics.RecallAtK >= baselineMetrics.RecallAtK, "调优后 Recall@K 不应下降");
        Assert.True(tunedMetrics.MrrAtK >= baselineMetrics.MrrAtK, "调优后 MRR 不应下降");
    }

    private static async Task<RetrievalMetrics> EvaluateAsync(EvalDataset dataset, RagOptions options)
    {
        var tokenizer = new SemanticTestTokenizer();
        var vectorizer = new SemanticTestVectorizer(tokenizer);
        var store = new LockFreeVectorStore();

        var records = new List<VectorRecord>();
        foreach (var doc in dataset.Documents)
        {
            var tokenIds = tokenizer.EncodeToIds(doc.Text);
            var embedding = await vectorizer.EmbedAsync(tokenIds);
            records.Add(new VectorRecord(
                doc.Id,
                embedding,
                new Dictionary<string, object?>
                {
                    ["text"] = doc.Text,
                    ["source"] = doc.Id,
                    ["chunkIndex"] = 0
                }));
        }

        await store.UpsertAsync(records);

        var search = new SearchService(tokenizer, vectorizer, store, Options.Create(options));

        var details = new List<QueryEvalDetail>();
        var hitCount = 0;
        float mrrSum = 0f;

        foreach (var query in dataset.Queries)
        {
            var results = (await search.QueryAsync(query.Text, options.TopK)).ToArray();
            var sources = results.Select(r => r.Fragment.Metadata?["source"]?.ToString() ?? string.Empty).ToArray();

            int? firstRelevant = null;
            for (var index = 0; index < sources.Length; index++)
            {
                if (query.RelevantSourceIds.Contains(sources[index]))
                {
                    firstRelevant = index + 1;
                    break;
                }
            }

            if (firstRelevant.HasValue)
            {
                hitCount++;
                mrrSum += 1f / firstRelevant.Value;
            }

            details.Add(new QueryEvalDetail(query.Text, firstRelevant, sources));
        }

        var queryCount = dataset.Queries.Count;
        return new RetrievalMetrics(
            RecallAtK: queryCount == 0 ? 0f : (float)hitCount / queryCount,
            MrrAtK: queryCount == 0 ? 0f : mrrSum / queryCount,
            Details: details);
    }

    private static EvalDataset BuildDataset()
    {
        var docs = new List<CorpusDoc>
        {
            new("doc-car-oil", "汽车 发动机 保养 与 机油 更换 周期 指南"),
            new("doc-battery", "新能源 电池 热 管理 系统 与 安全 策略"),
            new("doc-cat", "猫咪 饮食 健康 与 常见 疾病 预防"),
            new("doc-cache", "Redis 缓存 失效 策略 与 一致性 处理"),
            new("doc-rag", "RAG 检索 增强 生成 的 分块 召回 与 重排 实践")
        };

        var queries = new List<QueryCase>
        {
            new("轿车 多久 换 润滑油", new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "doc-car-oil" }),
            new("储能 电芯 温控 怎么 做", new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "doc-battery" }),
            new("家猫 吃 什么 更 健康", new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "doc-cat" }),
            new("如何 避免 缓存 与 数据库 不一致", new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "doc-cache" }),
            new("RAG 系统 怎么 提升 召回 质量", new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "doc-rag" })
        };

        return new EvalDataset(docs, queries);
    }

    private sealed record EvalDataset(IReadOnlyList<CorpusDoc> Documents, IReadOnlyList<QueryCase> Queries);
    private sealed record CorpusDoc(string Id, string Text);
    private sealed record QueryCase(string Text, HashSet<string> RelevantSourceIds);
    private sealed record QueryEvalDetail(string Query, int? FirstRelevantRank, string[] TopSources);
    private sealed record RetrievalMetrics(float RecallAtK, float MrrAtK, IReadOnlyList<QueryEvalDetail> Details);

    private sealed class SemanticTestTokenizer : ITokenizer
    {
        private static readonly Regex TokenRegex = new("[\\p{L}\\p{N}_]+", RegexOptions.Compiled);
        private readonly Dictionary<string, int> _termToId = new(StringComparer.OrdinalIgnoreCase);
        private readonly Dictionary<int, string> _idToTerm = new();
        private int _nextId = 1;

        public string? GetTerm(int id)
        {
            return _idToTerm.TryGetValue(id, out var term) ? term : null;
        }

        public TokenizationResult Encode(string text)
        {
            var tokens = EncodeToTokens(text);
            return new TokenizationResult(tokens.Select(t => t.Id).ToArray(), tokens, text);
        }

        public Task<TokenizationResult> EncodeAsync(string text, CancellationToken cancellationToken = default)
            => Task.FromResult(Encode(text));

        public int[] EncodeToIds(string text)
            => EncodeToTokens(text).Select(t => t.Id).ToArray();

        public Task<int[]> EncodeToIdsAsync(string text, CancellationToken cancellationToken = default)
            => Task.FromResult(EncodeToIds(text));

        public Token[] EncodeToTokens(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return Array.Empty<Token>();
            }

            var matches = TokenRegex.Matches(text);
            var list = new List<Token>(matches.Count);
            foreach (Match match in matches)
            {
                if (!match.Success || string.IsNullOrWhiteSpace(match.Value))
                {
                    continue;
                }

                var term = match.Value.Trim();
                if (!_termToId.TryGetValue(term, out var id))
                {
                    id = _nextId++;
                    _termToId[term] = id;
                    _idToTerm[id] = term;
                }

                list.Add(new Token(id, term, match.Index, match.Index + match.Length));
            }

            return list.ToArray();
        }
    }

    private sealed class SemanticTestVectorizer : IVectorizer
    {
        private readonly SemanticTestTokenizer _tokenizer;
        private static readonly Dictionary<string, int> ConceptIndex = new(StringComparer.OrdinalIgnoreCase)
        {
            ["汽车"] = 0,
            ["机油"] = 1,
            ["周期"] = 2,
            ["电池"] = 3,
            ["热管理"] = 4,
            ["猫咪"] = 5,
            ["健康"] = 6,
            ["缓存"] = 7,
            ["一致性"] = 8,
            ["RAG"] = 9,
            ["召回"] = 10,
            ["重排"] = 11,
        };

        private static readonly Dictionary<string, string> Synonyms = new(StringComparer.OrdinalIgnoreCase)
        {
            ["轿车"] = "汽车",
            ["车辆"] = "汽车",
            ["润滑油"] = "机油",
            ["多久"] = "周期",
            ["电芯"] = "电池",
            ["温控"] = "热管理",
            ["家猫"] = "猫咪",
            ["疾病"] = "健康",
            ["redis"] = "缓存",
            ["不一致"] = "一致性",
            ["检索增强生成"] = "RAG",
            ["排序"] = "重排"
        };

        public SemanticTestVectorizer(SemanticTestTokenizer tokenizer)
        {
            _tokenizer = tokenizer;
        }

        public Task<float[]> EmbedAsync(int[] inputIds, CancellationToken cancellationToken = default)
        {
            var vector = new float[ConceptIndex.Count + 1];
            foreach (var id in inputIds)
            {
                var raw = _tokenizer.GetTerm(id);
                if (string.IsNullOrWhiteSpace(raw))
                {
                    continue;
                }

                var normalized = Normalize(raw);
                if (ConceptIndex.TryGetValue(normalized, out var idx))
                {
                    vector[idx] += 1f;
                }
            }

            vector[^1] = inputIds.Length;
            return Task.FromResult(vector);
        }

        private static string Normalize(string term)
        {
            if (Synonyms.TryGetValue(term, out var mapped))
            {
                return mapped;
            }

            return term;
        }
    }
}
