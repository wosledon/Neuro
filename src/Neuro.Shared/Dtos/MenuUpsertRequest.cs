namespace Neuro.Shared.Dtos;

public class MenuUpsertRequest
{
    public Guid? Id { get; set; }
    public string? Name { get; set; }
    public string? Code { get; set; }
    public string? Description { get; set; }
    public Guid? ParentId { get; set; }
    public string? Url { get; set; }
    public string? Icon { get; set; }
    public int? Sort { get; set; }
}
