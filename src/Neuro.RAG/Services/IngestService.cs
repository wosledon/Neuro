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
using Microsoft.Extensions.Options;

namespace Neuro.RAG.Services;

public class IngestService : IIngestService
{
    private readonly ITokenizer _tokenizer;
    private readonly IVectorizer _vectorizer;
    private readonly IVectorStore _store;
    private readonly Utils.TextChunker _chunker;
    private readonly RagOptions _options;

    public IngestService(ITokenizer tokenizer, IVectorizer vectorizer, IVectorStore store, Utils.TextChunker chunker, IOptions<RagOptions> options)
    {
        _tokenizer = tokenizer ?? throw new ArgumentNullException(nameof(tokenizer));
        _vectorizer = vectorizer ?? throw new ArgumentNullException(nameof(vectorizer));
        _store = store ?? throw new ArgumentNullException(nameof(store));
        _chunker = chunker ?? throw new ArgumentNullException(nameof(chunker));
        _options = options?.Value ?? new RagOptions();
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

        var chunks = _chunker.Chunk(text).ToList();

        var records = new List<VectorRecord>();
        var ids = new List<string>();
        var validChunks = new List<(DocumentFragment Chunk, string ChunkId, int[] TokenIds)>();

        int i = 0;
        foreach (var chunk in chunks)
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (string.IsNullOrEmpty(chunk.Text))
            {
                continue;
            }

            var tokenIds = _tokenizer.EncodeToIds(chunk.Text);
            if (tokenIds.Length == 0)
            {
                continue;
            }

            var chunkId = (id ?? Guid.NewGuid().ToString()) + ":" + i;
            validChunks.Add((chunk, chunkId, tokenIds));
            i++;
        }

        var batchSize = _options.VectorizeBatchSize <= 0 ? 16 : _options.VectorizeBatchSize;
        for (var offset = 0; offset < validChunks.Count; offset += batchSize)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var currentBatch = validChunks.Skip(offset).Take(batchSize).ToArray();
            var tokenBatch = currentBatch.Select(x => x.TokenIds).ToArray();
            var embeddings = await _vectorizer.EmbedBatchAsync(tokenBatch, cancellationToken);

            for (var batchIndex = 0; batchIndex < currentBatch.Length; batchIndex++)
            {
                var item = currentBatch[batchIndex];
                var embedding = embeddings[batchIndex];
                if (embedding.Length == 0)
                {
                    continue;
                }

                // L2 normalize for consistent cosine similarity
                NormalizeL2(embedding);

                var meta = new Dictionary<string, object?> { ["text"] = item.Chunk.Text, ["source"] = id, ["chunkIndex"] = item.Chunk.ChunkIndex };
                records.Add(new VectorRecord(item.ChunkId, embedding, meta));
                ids.Add(item.ChunkId);
            }
        }

        if (records.Count > 0)
        {
            await _store.UpsertAsync(records, cancellationToken);
        }

        return ids;
    }

    private static void NormalizeL2(float[] vec)
    {
        if (vec == null || vec.Length == 0) return;
        double norm = 0;
        for (int i = 0; i < vec.Length; i++)
            norm += (double)vec[i] * vec[i];
        norm = Math.Sqrt(norm);
        if (norm < 1e-12) return;
        var invNorm = (float)(1.0 / norm);
        for (int i = 0; i < vec.Length; i++)
            vec[i] *= invNorm;
    }
}
