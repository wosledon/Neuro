namespace Neuro.Shared.Dtos;

public class RolePermissionAssignRequest
{
    public Guid RoleId { get; set; }
    public Guid[] PermissionIds { get; set; } = Array.Empty<Guid>();
}
