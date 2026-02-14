namespace Neuro.Shared.Dtos;

public class TeamUserAssignRequest
{
    public Guid TeamId { get; set; }
    public Guid[] UserIds { get; set; } = Array.Empty<Guid>();
}
