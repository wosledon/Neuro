using Neuro.Abstractions.Entity;

namespace Neuro.Api.Entity;

public class MyDocument : EntityBase
{
    public Guid ProjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;

    public Guid? ParentId { get; set; }

    public string TreePath { get; set; } = string.Empty;

    public int Sort { get; set; } = 0;

    /// <summary>
    /// 向量化时间，null 表示未向量化
    /// </summary>
    public DateTime? VectorizedAt { get; set; }
}
