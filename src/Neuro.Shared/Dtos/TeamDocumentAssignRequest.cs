namespace Neuro.Shared.Dtos;

public class TeamDocumentAssignRequest
{
    public Guid TeamId { get; set; }
    public Guid[] DocumentIds { get; set; } = Array.Empty<Guid>();
}
