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

    public bool IsPin { get; set; } = false;

    public Guid? ParentId { get; set; }

    public string TreePath { get; set; } = string.Empty;

    public string RepositoryUrl { get; set; } = string.Empty;
    public string HomepageUrl { get; set; } = string.Empty;
    public string DocsUrl { get; set; } = string.Empty;

    public int Sort { get; set; } = 0;
}
