namespace Neuro.Shared.Dtos;

public class ProjectAISupportDetail
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public Guid AISupportId { get; set; }
    public string AISupportName { get; set; } = string.Empty;
}
