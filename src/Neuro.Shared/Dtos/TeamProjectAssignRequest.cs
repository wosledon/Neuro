namespace Neuro.Shared.Dtos;

public class TeamProjectAssignRequest
{
    public Guid TeamId { get; set; }
    public Guid[] ProjectIds { get; set; } = Array.Empty<Guid>();
}
