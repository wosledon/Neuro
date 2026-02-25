using Neuro.Abstractions.Entity;

namespace Neuro.Api.Entity;

public class Team : EntityBase
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public bool IsEnabled { get; set; } = true;

    public bool IsPin { get; set; } = false;

    public Guid? ParentId { get; set; }

    public string TreePath { get; set; } = string.Empty;

    public int Sort { get; set; } = 0;

    public Guid? LeaderId { get; set; }
}
