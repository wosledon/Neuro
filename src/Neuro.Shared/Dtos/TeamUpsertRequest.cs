namespace Neuro.Shared.Dtos;

public class TeamUpsertRequest
{
    public Guid? Id { get; set; }
    public string? Name { get; set; }
    public string? Code { get; set; }
    public string? Description { get; set; }
    public bool? IsEnabled { get; set; }
    public Guid? ParentId { get; set; }
    public int? Sort { get; set; }
}
