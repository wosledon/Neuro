using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using Neuro.RAG.Abstractions;
using Neuro.RAG.Models;
using System.Collections.Generic;
using System.Threading;
using Neuro.Tokenizer;
using Neuro.Vectorizer;
using Neuro.Vector;

namespace Neuro.RAG.Tests;

public class RagServiceTests
{
    private ServiceProvider BuildProvider()
    {
        var services = new ServiceCollection();
        services.AddOptions();
        services.Configure<RagOptions>(_ => { });
        services.AddNeuroRAG();

        // Add test doubles
        services.AddSingleton<ITokenizer, TestTokenizer>();
        services.AddSingleton<IVectorizer, TestVectorizer>();
        services.AddSingleton<IVectorStore, TestVectorStore>();

        return services.BuildServiceProvider();
    }

    [Fact]
    public async Task IndexAndQueryAndAnswer_Works()
    {
        var sp = BuildProvider();
        var ingest = sp.GetRequiredService<IIngestService>();
        var search = sp.GetRequiredService<ISearchService>();
        var rag = sp.GetRequiredService<IRagService>();

        var ids = await ingest.IndexTextAsync("The quick brown fox jumps over the lazy dog and runs through the forest");
        Assert.NotEmpty(ids);

        var results = (await search.QueryAsync("quick brown fox")).ToArray();
        Assert.NotEmpty(results);

        var answer = await rag.AnswerAsync("what is hello?", async prompt => "LLM-REPLY");
        Assert.Equal("LLM-REPLY", answer.Answer);
        Assert.NotEmpty(answer.Sources);
    }

    // Simple test doubles below
    private class TestTokenizer : ITokenizer
    {
        public Token[] EncodeToTokens(string text) => text.Split(' ').Select((s, idx) => new Token(idx, s, 0, s.Length)).ToArray();
        public TokenizationResult Encode(string text) => new TokenizationResult(EncodeToTokens(text).Select(t => t.Id).ToArray(), EncodeToTokens(text), text);
        public Task<TokenizationResult> EncodeAsync(string text, CancellationToken cancellationToken = default) => Task.FromResult(Encode(text));
        public int[] EncodeToIds(string text) => text.Split(' ').Select(s => s.GetHashCode()).ToArray();
        public Task<int[]> EncodeToIdsAsync(string text, CancellationToken cancellationToken = default) => Task.FromResult(EncodeToIds(text));
    }

    private class TestVectorizer : IVectorizer
    {
        public Task<float[]> EmbedAsync(int[] inputIds, CancellationToken cancellationToken = default)
        {
            // simple embedding: sum and length
            float sum = 0;
            foreach (var i in inputIds) sum += i;
            return Task.FromResult(new float[] { sum, inputIds.Length });
        }
    }

    private class TestVectorStore : IVectorStore
    {
        private readonly List<VectorRecord> _records = new();
        public int Count => _records.Count;

        public Task DeleteAsync(System.Collections.Generic.IEnumerable<string> ids, CancellationToken cancellationToken = default)
        {
            _records.RemoveAll(r => ids.Contains(r.Id));
            return Task.CompletedTask;
        }

        public Task<VectorRecord[]> GetAsyncReturn(System.Collections.Generic.IEnumerable<string> ids) => Task.FromResult(_records.Where(r => ids.Contains(r.Id)).ToArray());

        public Task<System.Collections.Generic.IEnumerable<VectorRecord>> GetAsync(System.Collections.Generic.IEnumerable<string> ids, CancellationToken cancellationToken = default)
            => Task.FromResult(_records.Where(r => ids.Contains(r.Id)).AsEnumerable());

        public Task SaveAsync(string? path = null, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task LoadAsync(string? path = null, CancellationToken cancellationToken = default) => Task.CompletedTask;

        public Task UpsertAsync(System.Collections.Generic.IEnumerable<VectorRecord> records, CancellationToken cancellationToken = default)
        {
            foreach (var r in records)
            {
                _records.RemoveAll(x => x.Id == r.Id);
                _records.Add(r);
            }
            return Task.CompletedTask;
        }

        public Task<System.Collections.Generic.IEnumerable<(VectorRecord Record, float Score)>> QueryAsync(float[] queryEmbedding, int topK = 10, float minScore = -1f, CancellationToken cancellationToken = default)
        {
            // simple similarity: negative absolute difference on sum of embedding components
            var qsum = 0f;
            foreach (var v in queryEmbedding) qsum += v;
            var list = _records.Select(r => (Record: r, Score: 1f / (1f + System.Math.Abs(r.Embedding.Sum() - qsum)))).OrderByDescending(x => x.Score).Take(topK).AsEnumerable();
            return Task.FromResult(list);
        }
    }
}
