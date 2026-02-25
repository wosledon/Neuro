using Neuro.Abstractions.Entity;

namespace Neuro.Api.Entity;

public class UserTeam : EntityBase
{
    public Guid UserId { get; set; }
    public Guid TeamId { get; set; }
}
