using Neuro.Abstractions.Entity;

namespace Neuro.Api.Entity;

public class Menu : EntityBase
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public Guid? ParentId { get; set; }

    public string TreePath { get; set; } = string.Empty;

    public string Url { get; set; } = string.Empty;

    public string Icon { get; set; } = string.Empty;

    public int Sort { get; set; } = 0;
}
