using System.Linq.Expressions;
using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Neuro.Abstractions.Entity;
using Neuro.EntityFrameworkCore.Extensions;

namespace Neuro.EntityFrameworkCore;

using Neuro.Abstractions.Services;

public class NeuroDbContext : DbContext
{
    private readonly ICurrentUserService? _currentUser;

    public NeuroDbContext(DbContextOptions<NeuroDbContext> options
        , ICurrentUserService? currentUser = null) : base(options)
    {
        _currentUser = currentUser;
    }

    // 当前租户 ID，供全局查询过滤器使用
    public Guid? CurrentTenantId => _currentUser?.TenantId;
    
    // 是否是超级管理员，供全局查询过滤器使用
    public bool IsSuperUser => _currentUser?.IsSuper ?? false;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Register entities and apply default soft-delete & tenant filters during registration
        modelBuilder.RegisterEntity(this);

        base.OnModelCreating(modelBuilder);
    }

    public override int SaveChanges()
    {
        ApplyAuditingRules();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyAuditingRules();
        return base.SaveChangesAsync(cancellationToken);
    }

    void ApplyAuditingRules()
    {
        var entries = ChangeTracker.Entries();
        foreach (var entry in entries)
        {
            if (entry.Entity is IReadOnlyEntity && entry.State != EntityState.Added)
            {
                throw new InvalidOperationException("Cannot modify a read-only entity.");
            }
            var now = DateTime.UtcNow;

            if (entry.State == EntityState.Added && entry.Entity is EntityBase createdEntity)
            {
                createdEntity.CreatedAt = now;
                createdEntity.CreatedById = _currentUser?.UserId ?? Guid.Empty;
                createdEntity.CreatedByName = _currentUser?.UserName ?? string.Empty;
                createdEntity.TenantId = _currentUser?.TenantId;
            }
            else if (entry.State == EntityState.Modified && entry.Entity is EntityBase modifiedEntity)
            {
                modifiedEntity.UpdatedAt = now;
                modifiedEntity.UpdatedById = _currentUser?.UserId ?? modifiedEntity.UpdatedById;
                modifiedEntity.UpdatedByName = _currentUser?.UserName ?? modifiedEntity.UpdatedByName;
            }
            else if (entry.State == EntityState.Deleted && entry.Entity is EntityBase deletedEntity)
            {
                deletedEntity.IsDeleted = true;
                entry.State = EntityState.Modified;
            }
            else
            {
                // No action needed
            }
        }
    }
}
