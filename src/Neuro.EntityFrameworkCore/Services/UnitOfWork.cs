using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Neuro.Abstractions.Entity;

namespace Neuro.EntityFrameworkCore.Services;

public class UnitOfWork<TDbContext> : IUnitOfWork where TDbContext : NeuroDbContext
{
    private readonly TDbContext _db;
    private readonly ILogger<UnitOfWork<TDbContext>> _logger;
    public UnitOfWork(TDbContext dbContext, ILogger<UnitOfWork<TDbContext>> logger)
    {
        _db = dbContext;
        _logger = logger;
    }
    public async Task<bool> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _db.SaveChangesAsync(cancellationToken) > 0;
    }

    public async Task TransactionAsync(Func<CancellationToken, Task> action, CancellationToken cancellationToken = default)
    {
        try
        {
            using var transaction = _db.Database.BeginTransaction();
            await action(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Transaction failed");
            await _db.Database.RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }

    public async Task AddAsync<T>(T entity) where T : class, IEntity
    {
        await _db.Set<T>().AddAsync(entity);
    }

    public async Task AddRangeAsync<T>(IEnumerable<T> entities) where T : class, IEntity
    {
        await _db.Set<T>().AddRangeAsync(entities);
    }

    public IQueryable<T> E<T>() where T : class, IEntity
    {
        return _db.Set<T>();
    }

    public IQueryable<T> Q<T>() where T : class, IEntity
    {
        return _db.Set<T>().AsNoTracking();
    }

    public Task RemoveAsync<T>(T entity) where T : class, IEntity
    {
        _db.Set<T>().Remove(entity);
        return Task.CompletedTask;
    }

    public async Task RemoveByIdAsync<T>(Guid id) where T : class, IEntity, new()
    {
        var entity = new T() { Id = id };
        // If the entity supports soft delete, mark IsDeleted = true instead of physical delete
        if (entity is ISoftDeleteEntity soft)
        {
            soft.IsDeleted = true;
            _db.Set<T>().Attach(entity);
            var entry = _db.Entry(entity);
            entry.Property(nameof(ISoftDeleteEntity.IsDeleted)).IsModified = true;
        }
        else
        {
            _db.Set<T>().Attach(entity);
            _db.Set<T>().Remove(entity);
        }

        await Task.CompletedTask;
    }

    public Task RemoveByIdsAsync<T>(IEnumerable<Guid> ids) where T : class, IEntity, new()
    {
        foreach (var id in ids)
        {
            var entity = new T() { Id = id };
            if (entity is ISoftDeleteEntity soft)
            {
                soft.IsDeleted = true;
                _db.Set<T>().Attach(entity);
                var entry = _db.Entry(entity);
                entry.Property(nameof(ISoftDeleteEntity.IsDeleted)).IsModified = true;
            }
            else
            {
                _db.Set<T>().Attach(entity);
                _db.Set<T>().Remove(entity);
            }
        }

        return Task.CompletedTask;
    }

    public Task RemoveRangeAsync<T>(IEnumerable<T> entities) where T : class, IEntity
    {
        _db.Set<T>().RemoveRange(entities);
        return Task.CompletedTask;
    }

    public Task UpdateAsync<T>(T entity) where T : class, IEntity
    {
        _db.Set<T>().Update(entity);
        _db.Entry(entity).State = EntityState.Modified;
        return Task.CompletedTask;
    }

    public Task UpdateRangeAsync<T>(IEnumerable<T> entities) where T : class, IEntity
    {
        _db.Set<T>().UpdateRange(entities);
        foreach (var entity in entities)
        {
            _db.Entry(entity).State = EntityState.Modified;
        }
        return Task.CompletedTask;
    }
}
