namespace Neuro.Shared.Dtos;

public class RoleMenuListRequest : PageBase
{
    public Guid? RoleId { get; set; }
    public Guid? MenuId { get; set; }
}
