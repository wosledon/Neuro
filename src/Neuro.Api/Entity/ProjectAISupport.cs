using Neuro.Abstractions.Entity;

namespace Neuro.Api.Entity;

public class ProjectAISupport : EntityBase
{
    public Guid ProjectId { get; set; }
    public Guid AISupportId { get; set; }
}
