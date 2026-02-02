namespace Neuro.Shared.Dtos;

public class UserDetail
{
    public Guid Id { get; set; }
    public string Account { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Avatar { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    public Guid? TenantId { get; set; }
    public string TenantName { get; set; } = string.Empty;
}
