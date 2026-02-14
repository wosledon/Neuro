namespace Neuro.Shared.Dtos;

public class ProjectAISupportAssignRequest
{
    public Guid ProjectId { get; set; }
    public Guid[] AISupportIds { get; set; } = Array.Empty<Guid>();
}
