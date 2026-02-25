namespace Neuro.Shared.Dtos;

public class UserGitCredentialDetail
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public Guid GitCredentialId { get; set; }
    public string GitCredentialName { get; set; } = string.Empty;
}
