using System.Text.Json;
using System.Text.Json.Serialization;
using System.Collections.Concurrent;
using System.Threading;

namespace Neuro.Vector.Stores;

public class LocalVectorStoreOptions
{
    public ConsistencyMode Consistency { get; init; } = ConsistencyMode.Snapshot;

    /// <summary>
    /// 仅用于测试：当 Consistency==Strict 时，在 Save 中引入一个人为延迟（毫秒），用于模拟耗时保存以测试阻塞行为。
    /// </summary>
    public int SaveDelayMsForTesting { get; init; } = 0;
}

public enum ConsistencyMode
{
    Snapshot,
    Strict
}

public class LocalVectorStore : IVectorStore
{
    private readonly ConcurrentDictionary<string, VectorRecord> _store = new();
    private readonly ReaderWriterLockSlim _rw = new();
    private readonly LocalVectorStoreOptions _options;

    // 可选：上次使用的持久化文件路径
    private string? _lastPath;

    public LocalVectorStore(LocalVectorStoreOptions? options = null)
    {
        _options = options ?? new LocalVectorStoreOptions();
    }

    public Task UpsertAsync(IEnumerable<VectorRecord> records, CancellationToken cancellationToken = default)
    {
        if (records == null) throw new ArgumentNullException(nameof(records));

        if (_options.Consistency == ConsistencyMode.Strict)
        {
            _rw.EnterReadLock();
            try
            {
                foreach (var r in records)
                {
                    _store.AddOrUpdate(r.Id, r, (k, v) => r);
                }
            }
            finally { _rw.ExitReadLock(); }
        }
        else
        {
            foreach (var r in records)
            {
                _store.AddOrUpdate(r.Id, r, (k, v) => r);
            }
        }

        return Task.CompletedTask;
    }

    public Task<IEnumerable<VectorRecord>> GetAsync(IEnumerable<string> ids, CancellationToken cancellationToken = default)
    {
        if (ids == null) throw new ArgumentNullException(nameof(ids));
        var results = new List<VectorRecord>();
        foreach (var id in ids)
        {
            if (_store.TryGetValue(id, out var r)) results.Add(r);
        }
        return Task.FromResult((IEnumerable<VectorRecord>)results);
    }

    public Task DeleteAsync(IEnumerable<string> ids, CancellationToken cancellationToken = default)
    {
        if (ids == null) throw new ArgumentNullException(nameof(ids));

        if (_options.Consistency == ConsistencyMode.Strict)
        {
            _rw.EnterReadLock();
            try
            {
                foreach (var id in ids)
                {
                    _store.TryRemove(id, out _);
                }
            }
            finally { _rw.ExitReadLock(); }
        }
        else
        {
            foreach (var id in ids)
            {
                _store.TryRemove(id, out _);
            }
        }

        return Task.CompletedTask;
    }

    public Task<IEnumerable<(VectorRecord Record, float Score)>> QueryAsync(float[] queryEmbedding, int topK = 10, float minScore = -1f, CancellationToken cancellationToken = default)
    {
        if (queryEmbedding == null) throw new ArgumentNullException(nameof(queryEmbedding));
        var results = new List<(VectorRecord, float)>();

        // 使用快照以获得稳定视图，避免阻塞写操作
        var snapshot = _store.Values.ToArray();
        foreach (var r in snapshot)
        {
            var score = CosineSimilarity(queryEmbedding, r.Embedding);
            if (score >= minScore) results.Add((r, score));
        }

        var ordered = results.OrderByDescending(r => r.Item2).Take(topK);
        return Task.FromResult((IEnumerable<(VectorRecord, float)>)ordered.ToList());
    }

    public Task SaveAsync(string? path = null, CancellationToken cancellationToken = default)
    {
        var target = path ?? _lastPath ?? "local_vector_store.json";
        _lastPath = target;

        // 在 Strict 模式下，获取写锁以保证保存期间不会有并发的 upsert/delete
        if (_options.Consistency == ConsistencyMode.Strict)
        {
            _rw.EnterWriteLock();
            try
            {
                if (_options.SaveDelayMsForTesting > 0) Thread.Sleep(_options.SaveDelayMsForTesting);
                var list = _store.Values.Select(r => new SerializableRecord(r.Id, r.Embedding, r.Metadata)).ToList();
                var json = JsonSerializer.Serialize(list, new JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(target, json);
            }
            finally { _rw.ExitWriteLock(); }
        }
        else
        {
            // 快照模式：获取瞬时快照并序列化，避免阻塞写入者
            var list = _store.Values.ToArray().Select(r => new SerializableRecord(r.Id, r.Embedding, r.Metadata)).ToList();
            var json = JsonSerializer.Serialize(list, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(target, json);
        }

        return Task.CompletedTask;
    }

    public Task LoadAsync(string? path = null, CancellationToken cancellationToken = default)
    {
        var target = path ?? _lastPath ?? "local_vector_store.json";
        _lastPath = target;
        if (!File.Exists(target)) return Task.CompletedTask;
        var json = File.ReadAllText(target);
        var list = JsonSerializer.Deserialize<List<SerializableRecord>>(json);
        if (list == null) return Task.CompletedTask;

        // In strict mode, ensure exclusive write
        if (_options.Consistency == ConsistencyMode.Strict)
        {
            _rw.EnterWriteLock();
            try
            {
                _store.Clear();
                foreach (var s in list)
                {
                    _store[s.Id] = new VectorRecord(s.Id, s.Embedding, s.Metadata);
                }
            }
            finally { _rw.ExitWriteLock(); }
        }
        else
        {
            _store.Clear();
            foreach (var s in list)
            {
                _store[s.Id] = new VectorRecord(s.Id, s.Embedding, s.Metadata);
            }
        }

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