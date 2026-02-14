namespace Neuro.Shared.Dtos;

public class PermissionUpsertRequest
{
    public Guid? Id { get; set; }
    public string? Name { get; set; }
    public string? Code { get; set; }
    public string? Description { get; set; }
    public Guid? MenuId { get; set; }
    public string? Action { get; set; }
    public string? Method { get; set; }
}
