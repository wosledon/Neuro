namespace Neuro.Api.Entity;

public class ProjectGitCredential
{
    /// <summary>
    /// 关联的项目 ID
    /// </summary>
    public Guid ProjectId { get; set; }

    public Guid GitCredentialId { get; set; }
}