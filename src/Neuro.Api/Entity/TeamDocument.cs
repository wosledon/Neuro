using Neuro.Abstractions.Entity;

namespace Neuro.Api.Entity;

public class TeamDocument : EntityBase
{
    public Guid TeamId { get; set; }
    public Guid DocumentId { get; set; }
}