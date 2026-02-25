using Neuro.Abstractions.Entity;

namespace Neuro.Api.Entity;

public class FileResource : EntityBase
{
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsEnabled { get; set; } = true;
}