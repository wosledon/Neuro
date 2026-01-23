using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Neuro.RAG.Abstractions;
using Neuro.RAG.Models;
using Neuro.Tokenizer;
using Neuro.Vectorizer;
using Neuro.Vector;
using Neuro.Document;

namespace Neuro.RAG.Services;

public class IngestService : IIngestService
{
    private readonly ITokenizer _tokenizer;
    private readonly IVectorizer _vectorizer;
    private readonly IVectorStore _store;
    private readonly Utils.TextChunker _chunker;

    public IngestService(ITokenizer tokenizer, IVectorizer vectorizer, IVectorStore store, Utils.TextChunker chunker)
    {
        _tokenizer = tokenizer ?? throw new ArgumentNullException(nameof(tokenizer));
        _vectorizer = vectorizer ?? throw new ArgumentNullException(nameof(vectorizer));
        _store = store ?? throw new ArgumentNullException(nameof(store));
        _chunker = chunker ?? throw new ArgumentNullException(nameof(chunker));
    }

    public async Task<IEnumerable<string>> IndexFileAsync(string filePath, CancellationToken cancellationToken = default)
    {
        using var fs = System.IO.File.OpenRead(filePath);
        var md = NeuroConverter.ConvertToMarkdown(fs, filePath);
        return await IndexTextAsync(md, filePath, cancellationToken);
    }

    public async Task<IEnumerable<string>> IndexTextAsync(string text, string? id = null, CancellationToken cancellationToken = default)
    {
        if (text == null) throw new ArgumentNullException(nameof(text));

        var chunks = _chunker.Chunk(text);
        var records = new List<VectorRecord>();
        var ids = new List<string>();

        int i = 0;
        foreach (var chunk in chunks)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var tokenIds = _tokenizer.EncodeToIds(chunk.Text);
            var embedding = await _vectorizer.EmbedAsync(tokenIds, cancellationToken);
            var chunkId = (id ?? Guid.NewGuid().ToString()) + ":" + i;
            var meta = new Dictionary<string, object?> { ["text"] = chunk.Text, ["source"] = id, ["chunkIndex"] = i };
            records.Add(new VectorRecord(chunkId, embedding, meta));
            ids.Add(chunkId);
            i++;
        }

        await _store.UpsertAsync(records, cancellationToken);
        return ids;
    }
}
