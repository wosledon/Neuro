namespace Neuro.Shared.Dtos;

/// <summary>
/// 文档详情 DTO
/// </summary>
public class DocumentDetail
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public Guid? ParentId { get; set; }
    public string TreePath { get; set; } = string.Empty;
    public int Sort { get; set; }
    
    /// <summary>
    /// 是否是文件夹
    /// </summary>
    public bool IsFolder { get; set; }
    
    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedAt { get; set; }
    
    /// <summary>
    /// 更新时间
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}
