using Neuro.Abstractions.Entity;

namespace Neuro.Api.Entity;

public class Permission : EntityBase
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public Guid? MenuId { get; set; }

    public string Action { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
}
