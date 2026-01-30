using Neuro.Abstractions.Entity;

namespace Neuro.Api.Entity;

public class UserRole : EntityBase
{
    public Guid UserId { get; set; }
    public Guid RoleId { get; set; }
}
