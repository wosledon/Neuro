using Neuro.Abstractions.Entity;

namespace Neuro.Api.Entity;

public class RoleDocument : EntityBase
{
    public Guid RoleId { get; set; }
    public Guid DocumentId { get; set; }
}