using System;
using Neuro.Shared.Enums;

namespace Neuro.Shared.Dtos;

public class ProjectDetail
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public ProjectTypeEnum Type { get; set; }
    public string Description { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
    public ProjectStatusEnum Status { get; set; }
    public bool IsPin { get; set; }
    public Guid? ParentId { get; set; }
    public string TreePath { get; set; } = string.Empty;
    public string RepositoryUrl { get; set; } = string.Empty;
    public string HomepageUrl { get; set; } = string.Empty;
    public string DocsUrl { get; set; } = string.Empty;
    public int Sort { get; set; }

    #region Git 集成
    public Guid? GitCredentialId { get; set; }
    public string? GitCredentialName { get; set; }
    #endregion

    #region AI 文档生成
    public Guid? AISupportId { get; set; }
    public string? AISupportName { get; set; }
    public bool EnableAIDocs { get; set; }
    #endregion
}
