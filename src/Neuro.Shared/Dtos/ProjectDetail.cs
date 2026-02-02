namespace Neuro.Shared.Dtos;

public class ProjectDetail
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
    public bool IsPin { get; set; }
    public Guid? ParentId { get; set; }
    public int Sort { get; set; }
}
