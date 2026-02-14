using Neuro.Abstractions.Entity;

namespace Neuro.Api.Entity;

public class TeamProject : EntityBase
{
    public Guid TeamId { get; set; }
    public Guid ProjectId { get; set; }
}