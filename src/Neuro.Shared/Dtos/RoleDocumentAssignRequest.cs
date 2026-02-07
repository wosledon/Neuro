namespace Neuro.Shared.Dtos;

public class RoleDocumentAssignRequest
{
    public Guid RoleId { get; set; }
    public Guid[] DocumentIds { get; set; } = Array.Empty<Guid>();
}
