namespace Neuro.Api.Entity;

public class UserGitCredential
{
    /// <summary>
    /// 关联的用户 ID
    /// </summary>
    public Guid UserId { get; set; }

    public Guid GitCredentialId { get; set; }
}
