namespace Neuro.Shared.Dtos;

public class DocumentDetail
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public Guid? ParentId { get; set; }
    public string TreePath { get; set; } = string.Empty;
    public int Sort { get; set; }
}
