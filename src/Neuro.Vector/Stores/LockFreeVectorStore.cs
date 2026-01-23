using System.Collections.Immutable;
using System.Threading;

namespace Neuro.Vector.Stores;

/// <summary>
/// 无锁向量存储，基于不可变字典与原子交换（写时拷贝）实现。
/// 适合读多写少的小到中等规模集合，提供快照语义与原子批量 upsert。
/// </summary>
public class LockFreeVectorStore : IVectorStore
{
    // 不可变字典引用，通过原子交换更新
    private ImmutableDictionary<string, VectorRecord> _map = ImmutableDictionary<string, VectorRecord>.Empty;

    // 可选：上次使用的持久化文件路径
    private string? _lastPath;

    public Task UpsertAsync(IEnumerable<VectorRecord> records, CancellationToken cancellationToken = default)
    {
        if (records == null) throw new ArgumentNullException(nameof(records));

        // Apply batch upsert atomically using CAS loop
        while (true)
        {
            var snapshot = _map;
            var changed = snapshot;
            foreach (var r in records)
            {
                changed = changed.SetItem(r.Id, r);
            }

            var prior = Interlocked.CompareExchange(ref _map!, changed, snapshot);
            if (ReferenceEquals(prior, snapshot))
            {
                // succeeded
                return Task.CompletedTask;
            }

            // someone else updated concurrently, retry
            if (cancellationToken.IsCancellationRequested) return Task.FromCanceled(cancellationToken);
        }
    }

    public Task<IEnumerable<VectorRecord>> GetAsync(IEnumerable<string> ids, CancellationToken cancellationToken = default)
    {
        if (ids == null) throw new ArgumentNullException(nameof(ids));
        var snapshot = _map; // read snapshot
        var list = new List<VectorRecord>();
        foreach (var id in ids)
        {
            if (snapshot.TryGetValue(id, out var r)) list.Add(r);
        }
        return Task.FromResult((IEnumerable<VectorRecord>)list);
    }

    public Task DeleteAsync(IEnumerable<string> ids, CancellationToken cancellationToken = default)
    {
        if (ids == null) throw new ArgumentNullException(nameof(ids));

        while (true)
        {
            var snapshot = _map;
            var changed = snapshot;
            foreach (var id in ids)
            {
                changed = changed.Remove(id);
            }

            var prior = Interlocked.CompareExchange(ref _map!, changed, snapshot);
            if (ReferenceEquals(prior, snapshot))
            {
                return Task.CompletedTask;
            }

            if (cancellationToken.IsCancellationRequested) return Task.FromCanceled(cancellationToken);
        }
    }

    public Task<IEnumerable<(VectorRecord Record, float Score)>> QueryAsync(float[] queryEmbedding, int topK = 10, float minScore = -1f, CancellationToken cancellationToken = default)
    {
        if (queryEmbedding == null) throw new ArgumentNullException(nameof(queryEmbedding));
        var results = new List<(VectorRecord, float)>();
        var snapshot = _map;
        foreach (var kv in snapshot)
        {
            var score = CosineSimilarity(queryEmbedding, kv.Value.Embedding);
            if (score >= minScore) results.Add((kv.Value, score));
        }

        var ordered = results.OrderByDescending(r => r.Item2).Take(topK);
        return Task.FromResult((IEnumerable<(VectorRecord, float)>)ordered.ToList());
    }

    public Task SaveAsync(string? path = null, CancellationToken cancellationToken = default)
    {
        var target = path ?? _lastPath ?? "lockfree_vector_store.json";
        _lastPath = target;

        var list = _map.Values.ToArray().Select(r => new SerializableRecord(r.Id, r.Embedding, r.Metadata)).ToList();
        var json = System.Text.Json.JsonSerializer.Serialize(list, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
        File.WriteAllText(target, json);
        return Task.CompletedTask;
    }

    public Task LoadAsync(string? path = null, CancellationToken cancellationToken = default)
    {
        var target = path ?? _lastPath ?? "lockfree_vector_store.json";
        _lastPath = target;
        if (!File.Exists(target)) return Task.CompletedTask;
        var json = File.ReadAllText(target);
        var list = System.Text.Json.JsonSerializer.Deserialize<List<SerializableRecord>>(json);
        if (list == null) return Task.CompletedTask;

        var builder = ImmutableDictionary.CreateBuilder<string, VectorRecord>();
        foreach (var s in list)
        {
            builder[s.Id] = new VectorRecord(s.Id, s.Embedding, s.Metadata);
        }

        // atomic swap
        Interlocked.Exchange(ref _map!, builder.ToImmutable());
        return Task.CompletedTask;
    }

    private static float CosineSimilarity(float[] a, float[] b)
    {
        if (a == null || b == null) return -1f;
        if (a.Length != b.Length) return -1f;
        double dot = 0, na = 0, nb = 0;
        for (int i = 0; i < a.Length; i++)
        {
            dot += (double)a[i] * b[i];
            na += (double)a[i] * a[i];
            nb += (double)b[i] * b[i];
        }
        if (na == 0 || nb == 0) return -1f;
        return (float)(dot / (Math.Sqrt(na) * Math.Sqrt(nb)));
    }

    private record SerializableRecord(string Id, float[] Embedding, System.Collections.Generic.IDictionary<string, object?>? Metadata = null);
}