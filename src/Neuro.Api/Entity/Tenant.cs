using Neuro.Abstractions.Entity;

namespace Neuro.Api.Entity;

public class Tenant : EntityBase
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;

    public string Logo { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public bool IsEnabled { get; set; } = true;
    public DateTime? ExpiredAt { get; set; }
}
