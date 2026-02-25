namespace Neuro.Shared.Dtos;

public class ProjectGitCredentialDetail
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public Guid GitCredentialId { get; set; }
    public string GitCredentialName { get; set; } = string.Empty;
}
