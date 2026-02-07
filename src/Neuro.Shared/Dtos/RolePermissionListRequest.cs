namespace Neuro.Shared.Dtos;

public class RolePermissionListRequest : PageBase
{
    public Guid? RoleId { get; set; }
    public Guid? PermissionId { get; set; }
}
