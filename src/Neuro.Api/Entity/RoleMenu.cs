using Neuro.Abstractions.Entity;

namespace Neuro.Api.Entity;

public class RoleMenu : EntityBase
{
    public Guid RoleId { get; set; }
    public Guid MenuId { get; set; }
}
