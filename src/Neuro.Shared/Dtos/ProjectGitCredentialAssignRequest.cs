namespace Neuro.Shared.Dtos;

public class ProjectGitCredentialAssignRequest
{
    public Guid ProjectId { get; set; }
    public Guid[] GitCredentialIds { get; set; } = Array.Empty<Guid>();
}
