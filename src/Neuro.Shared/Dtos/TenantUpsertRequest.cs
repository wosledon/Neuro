namespace Neuro.Shared.Dtos;

public class TenantUpsertRequest
{
    public Guid? Id { get; set; }
    public string? Name { get; set; }
    public string? Code { get; set; }
    public string? Logo { get; set; }
    public string? Description { get; set; }
    public bool? IsEnabled { get; set; }
    public DateTime? ExpiredAt { get; set; }
}
