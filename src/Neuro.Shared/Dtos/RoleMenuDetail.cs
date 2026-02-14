namespace Neuro.Shared.Dtos;

public class RoleMenuDetail
{
    public Guid Id { get; set; }
    public Guid RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public Guid MenuId { get; set; }
    public string MenuName { get; set; } = string.Empty;
    public string MenuCode { get; set; } = string.Empty;
}
