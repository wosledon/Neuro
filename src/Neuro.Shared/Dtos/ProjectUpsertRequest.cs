using System;
using Neuro.Shared.Enums;

namespace Neuro.Shared.Dtos;

public class ProjectUpsertRequest
{
    public Guid? Id { get; set; }
    public string? Name { get; set; }
    public string? Code { get; set; }
    public ProjectTypeEnum? Type { get; set; }
    public string? Description { get; set; }
    public bool? IsEnabled { get; set; }
    public ProjectStatusEnum? Status { get; set; }
    public bool? IsPin { get; set; }
    public Guid? ParentId { get; set; }
    public string? TreePath { get; set; }
    public string? RepositoryUrl { get; set; }
    public string? HomepageUrl { get; set; }
    public string? DocsUrl { get; set; }
    public int? Sort { get; set; }

    #region Git 集成
    public Guid? GitCredentialId { get; set; }
    #endregion

    #region AI 文档生成
    public Guid? AISupportId { get; set; }
    public bool? EnableAIDocs { get; set; }
    #endregion
}
