using Neuro.Abstractions.Entity;

namespace Neuro.EntityFrameworkCore.Services;

public interface IUnitOfWork
{
    public IQueryable<T> Q<T>() where T : class, IEntity;

    public IQueryable<T> E<T>() where T : class, IEntity;

    public Task<bool> SaveChangesAsync(CancellationToken cancellationToken = default);

    public Task TransactionAsync(Func<CancellationToken, Task> action, CancellationToken cancellationToken = default);

    public Task AddAsync<T>(T entity) where T : class, IEntity;
    public Task AddRangeAsync<T>(IEnumerable<T> entities) where T : class, IEntity;
    public Task UpdateAsync<T>(T entity) where T : class, IEntity;
    public Task UpdateRangeAsync<T>(IEnumerable<T> entities) where T : class, IEntity;
    public Task RemoveAsync<T>(T entity) where T : class, IEntity;
    public Task RemoveRangeAsync<T>(IEnumerable<T> entities) where T : class, IEntity;
    public Task RemoveByIdAsync<T>(Guid id) where T : class, IEntity, new();
    public Task RemoveByIdsAsync<T>(IEnumerable<Guid> ids) where T : class, IEntity, new();
}
