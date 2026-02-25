namespace Neuro.Shared.Dtos;

public class UserTeamAssignRequest
{
    public Guid UserId { get; set; }
    public Guid[] TeamIds { get; set; } = Array.Empty<Guid>();
}
