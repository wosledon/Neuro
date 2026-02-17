namespace Neuro.Shared.Dtos;

/// <summary>
/// 文档创建/更新请求
/// </summary>
public class DocumentUpsertRequest
{
    public Guid? Id { get; set; }
    public Guid? ProjectId { get; set; }
    public string? Title { get; set; }
    public string? Content { get; set; }
    public Guid? ParentId { get; set; }
    public string? TreePath { get; set; }
    public int? Sort { get; set; }
    
    /// <summary>
    /// 是否是文件夹
    /// </summary>
    public bool? IsFolder { get; set; }
}
