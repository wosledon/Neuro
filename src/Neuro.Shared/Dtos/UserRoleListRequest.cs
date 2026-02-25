namespace Neuro.Shared.Dtos;

public class UserRoleListRequest : PageBase
{
    public Guid? UserId { get; set; }
    public Guid? RoleId { get; set; }
}
