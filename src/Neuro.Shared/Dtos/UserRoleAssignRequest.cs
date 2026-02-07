namespace Neuro.Shared.Dtos;

public class UserRoleAssignRequest
{
    public Guid UserId { get; set; }
    public Guid[] RoleIds { get; set; } = Array.Empty<Guid>();
}
