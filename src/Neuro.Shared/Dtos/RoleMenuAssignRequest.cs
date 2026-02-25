namespace Neuro.Shared.Dtos;

public class RoleMenuAssignRequest
{
    public Guid RoleId { get; set; }
    public Guid[] MenuIds { get; set; } = Array.Empty<Guid>();
}
