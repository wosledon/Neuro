using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Neuro.RAG.Abstractions;
using Neuro.RAG.Models;
using Neuro.Vector;
using Neuro.Vectorizer;
using Neuro.Tokenizer;

namespace Neuro.RAG.Services;

public class SearchService : ISearchService
{
    private readonly ITokenizer _tokenizer;
    private readonly IVectorizer _vectorizer;
    private readonly IVectorStore _store;

    public SearchService(ITokenizer tokenizer, IVectorizer vectorizer, IVectorStore store)
    {
        _tokenizer = tokenizer;
        _vectorizer = vectorizer;
        _store = store;
    }

    public async Task<IEnumerable<SearchResult>> QueryAsync(string query, int topK = 5, CancellationToken cancellationToken = default)
    {
        var ids = _tokenizer.EncodeToIds(query);
        var emb = await _vectorizer.EmbedAsync(ids, cancellationToken);
        var found = await _store.QueryAsync(emb, topK, cancellationToken: cancellationToken);
        return found.Select(f => new SearchResult(new DocumentFragment(f.Record.Id, f.Record.Metadata != null && f.Record.Metadata.ContainsKey("text") ? f.Record.Metadata["text"]?.ToString() ?? string.Empty : string.Empty, f.Record.Metadata, null, f.Record.Metadata != null && f.Record.Metadata.ContainsKey("chunkIndex") ? (int)f.Record.Metadata["chunkIndex"]! : 0), f.Score, f.Record.Embedding));
    }
}
