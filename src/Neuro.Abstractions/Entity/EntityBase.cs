namespace Neuro.Abstractions.Entity;

public abstract class EntityBase : ITenantEntity, IAuditedEntity, ISoftDeleteEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid? TenantId { get; set; }
    public Guid CreatedById { get; set; }
    public Guid? UpdatedById { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public string? UpdatedByName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public bool IsDeleted { get; set; } = false;
}