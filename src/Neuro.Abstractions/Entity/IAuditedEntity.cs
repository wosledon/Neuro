namespace Neuro.Abstractions.Entity;

public interface IAuditedEntity : IEntity
{
    public Guid CreatedById { get; set; }
    public Guid? UpdatedById { get; set; }
    public string CreatedByName { get; set; }
    public string? UpdatedByName { get; set; }
    DateTime CreatedAt { get; set; }
    DateTime? UpdatedAt { get; set; }
}
