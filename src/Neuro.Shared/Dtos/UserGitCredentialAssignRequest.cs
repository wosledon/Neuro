namespace Neuro.Shared.Dtos;

public class UserGitCredentialAssignRequest
{
    public Guid UserId { get; set; }
    public Guid[] GitCredentialIds { get; set; } = Array.Empty<Guid>();
}
