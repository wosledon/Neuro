using Neuro.Abstractions.Entity;

namespace Neuro.Api.Entity;

public class RolePermission : EntityBase
{
    public Guid RoleId { get; set; }
    public Guid PermissionId { get; set; }
}