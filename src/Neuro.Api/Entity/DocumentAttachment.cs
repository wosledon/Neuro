using Neuro.Abstractions.Entity;

namespace Neuro.Api.Entity;

/// <summary>
/// 文档附件关联实体
/// </summary>
public class DocumentAttachment : EntityBase
{
    /// <summary>
    /// 关联的文档ID
    /// </summary>
    public Guid DocumentId { get; set; }
    
    /// <summary>
    /// 文件名称
    /// </summary>
    public string FileName { get; set; } = string.Empty;
    
    /// <summary>
    /// 存储Key
    /// </summary>
    public string StorageKey { get; set; } = string.Empty;
    
    /// <summary>
    /// 文件大小（字节）
    /// </summary>
    public long FileSize { get; set; }
    
    /// <summary>
    /// MIME类型
    /// </summary>
    public string? MimeType { get; set; }
    
    /// <summary>
    /// 文件哈希（用于去重）
    /// </summary>
    public string? FileHash { get; set; }
    
    /// <summary>
    /// 是否内联显示（图片等可直接在Markdown中显示）
    /// </summary>
    public bool IsInline { get; set; } = false;
    
    /// <summary>
    /// 排序顺序
    /// </summary>
    public int Sort { get; set; } = 0;
}
