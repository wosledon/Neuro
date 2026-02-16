namespace Neuro.RAG.Models;

public class RagOptions
{
    /// <summary>
    /// 返回的最相关文档片段数量，增加以获得更多上下文
    /// </summary>
    public int TopK { get; set; } = 10;

    /// <summary>
    /// 向量相似度的最小阈值，过滤低质量结果
    /// </summary>
    public float MinScore { get; set; } = 0.3f;

    /// <summary>
    /// 预取因子，用于在重排序前获取更多候选
    /// </summary>
    public int PrefetchFactor { get; set; } = 4;

    /// <summary>
    /// 每个来源的最大结果数，避免单一来源主导
    /// </summary>
    public int MaxPerSource { get; set; } = 5;

    /// <summary>
    /// 文本分块大小（token数），256适合精确检索，128最大序列长度下约2个chunk
    /// </summary>
    public int ChunkSize { get; set; } = 256;

    /// <summary>
    /// 分块重叠大小（token数），保持上下文连续性
    /// </summary>
    public int ChunkOverlap { get; set; } = 50;

    /// <summary>
    /// 关键字匹配的权重加成
    /// </summary>
    public float KeywordBoost { get; set; } = 0.6f;

    /// <summary>
    /// 关键字匹配的最小分数阈值
    /// </summary>
    public float MinKeywordScore { get; set; } = 0f;

    /// <summary>
    /// 是否启用词法回退（慎用，可能影响性能）
    /// </summary>
    public bool EnableLexicalFallback { get; set; } = false;

    /// <summary>
    /// 词法回退扫描的最大候选数量，减少以提高性能
    /// </summary>
    public int LexicalCandidateLimit { get; set; } = 500;

    /// <summary>
    /// 向量化批处理大小
    /// </summary>
    public int VectorizeBatchSize { get; set; } = 16;

    /// <summary>
    /// RAG提示词模板
    /// </summary>
    public string? PromptTemplate { get; set; }
}
