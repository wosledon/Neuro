namespace Neuro.Shared.Dtos;

public class TeamDetail
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
    public bool IsPin { get; set; }
    public Guid? ParentId { get; set; }
    public string TreePath { get; set; } = string.Empty;
    public int Sort { get; set; }
}
