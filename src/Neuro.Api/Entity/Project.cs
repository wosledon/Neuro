using System.ComponentModel;
using Neuro.Abstractions.Entity;
using Neuro.Shared.Enums;

namespace Neuro.Api.Entity;

public class Project : EntityBase
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public ProjectTypeEnum Type { get; set; } = ProjectTypeEnum.Document;

    public string Description { get; set; } = string.Empty;

    public bool IsEnabled { get; set; } = true;

    public ProjectStatusEnum Status { get; set; } = ProjectStatusEnum.Active;

    public bool IsPin { get; set; } = false;

    public Guid? ParentId { get; set; }

    public string TreePath { get; set; } = string.Empty;

    public string RepositoryUrl { get; set; } = string.Empty;
    public string HomepageUrl { get; set; } = string.Empty;
    public string DocsUrl { get; set; } = string.Empty;

    public int Sort { get; set; } = 0;

    #region Git 集成

    /// <summary>
    /// Git 凭据 ID
    /// </summary>
    public Guid? GitCredentialId { get; set; }

    /// <summary>
    /// 最后拉取时间
    /// </summary>
    public DateTime? LastPullAt { get; set; }

    /// <summary>
    /// 本地仓库路径
    /// </summary>
    public string LocalRepositoryPath { get; set; } = string.Empty;

    /// <summary>
    /// 默认分支
    /// </summary>
    public string DefaultBranch { get; set; } = "main";

    #endregion

    #region AI 文档生成

    /// <summary>
    /// 使用的 AI 模型 ID（AISupport）
    /// </summary>
    public Guid? AISupportId { get; set; }

    /// <summary>
    /// 是否启用 AI 文档生成
    /// </summary>
    public bool EnableAIDocs { get; set; } = false;

    /// <summary>
    /// 文档生成状态
    /// </summary>
    public ProjectDocGenStatus DocGenStatus { get; set; } = ProjectDocGenStatus.Pending;

    /// <summary>
    /// 最后生成时间
    /// </summary>
    public DateTime? LastDocGenAt { get; set; }

    /// <summary>
    /// 包含的文件模式（glob 模式，如 *.cs, *.md）
    /// </summary>
    public string IncludePatterns { get; set; } = "*.cs,*.md,*.txt,*.json,*.xml,*.yaml,*.yml";

    /// <summary>
    /// 排除的文件模式
    /// </summary>
    public string ExcludePatterns { get; set; } = "bin/*,obj/*,node_modules/*,.git/*,*.dll,*.exe";

    #endregion
}

/// <summary>
/// 项目文档生成状态
/// </summary>
public enum ProjectDocGenStatus
{
    [Description("待处理")]
    Pending = 0,
    [Description("拉取中")]
    Pulling = 1,
    [Description("生成中")]
    Generating = 2,
    [Description("已完成")]
    Completed = 3,
    [Description("失败")]
    Failed = 4
}
