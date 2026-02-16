using System.Threading;
using System.Collections.Generic;
using System.Linq;

namespace Neuro.Vector;

/// <summary>
/// 向量记录，包含 Id、Embedding 与可选的 Metadata
/// </summary>
public record VectorRecord(string Id, float[] Embedding, System.Collections.Generic.IDictionary<string, object?>? Metadata = null);

public interface IVectorStore
{
    /// <summary>
    /// 插入或更新向量记录（Upsert）
    /// </summary>
    System.Threading.Tasks.Task UpsertAsync(System.Collections.Generic.IEnumerable<VectorRecord> records, CancellationToken cancellationToken = default);

    /// <summary>
    /// 根据 Id 获取记录，缺失的 Id 将被忽略
    /// </summary>
    System.Threading.Tasks.Task<System.Collections.Generic.IEnumerable<VectorRecord>> GetAsync(System.Collections.Generic.IEnumerable<string> ids, CancellationToken cancellationToken = default);

    /// <summary>
    /// 根据 Id 删除记录
    /// </summary>
    System.Threading.Tasks.Task DeleteAsync(System.Collections.Generic.IEnumerable<string> ids, CancellationToken cancellationToken = default);

    /// <summary>
    /// 根据 Id 前缀列举记录 Id。默认返回空集合，具体存储可按需覆写以支持高效前缀清理。
    /// </summary>
    System.Threading.Tasks.Task<IEnumerable<string>> ListIdsByPrefixAsync(string prefix, CancellationToken cancellationToken = default)
        => System.Threading.Tasks.Task.FromResult(Enumerable.Empty<string>());

    /// <summary>
    /// 对给定的 embedding 进行最近邻查询。返回 (record, score) 列表，score 为余弦相似度，范围 [-1,1]
    /// </summary>
    System.Threading.Tasks.Task<System.Collections.Generic.IEnumerable<(VectorRecord Record, float Score)>> QueryAsync(float[] queryEmbedding, int topK = 10, float minScore = -1f, CancellationToken cancellationToken = default);

    /// <summary>
    /// 可选：将存储持久化到磁盘（由具体实现决定）
    /// </summary>
    System.Threading.Tasks.Task SaveAsync(string? path = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// 可选：从磁盘加载存储（由具体实现决定）
    /// </summary>
    System.Threading.Tasks.Task LoadAsync(string? path = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// 获取存储中的记录数量
    /// </summary>
    int Count { get; }
}