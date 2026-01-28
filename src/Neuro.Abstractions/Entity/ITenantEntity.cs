namespace Neuro.Abstractions.Entity;

public interface ITenantEntity : IEntity
{
    Guid? TenantId { get; set; }
}
