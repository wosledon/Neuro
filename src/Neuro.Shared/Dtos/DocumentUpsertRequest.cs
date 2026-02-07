namespace Neuro.Shared.Dtos;

public class DocumentUpsertRequest
{
    public Guid? Id { get; set; }
    public Guid? ProjectId { get; set; }
    public string? Title { get; set; }
    public string? Content { get; set; }
    public Guid? ParentId { get; set; }
    public string? TreePath { get; set; }
    public int? Sort { get; set; }
}
