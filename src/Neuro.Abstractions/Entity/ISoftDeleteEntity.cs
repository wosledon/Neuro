namespace Neuro.Abstractions.Entity;

public interface ISoftDeleteEntity : IEntity
{
    bool IsDeleted { get; set; }
}
