using System;
using System.Diagnostics;
using System.Linq.Expressions;
using System.Reflection;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Neuro.Abstractions.Entity;

namespace Neuro.EntityFrameworkCore.Extensions
{
    public static class DbContextExtensions
    {
        extension(ModelBuilder modelBuilder)
        {
            /// <summary>
            /// 扫描并注册所有实现了 <see cref="IEntity"/> 的实体类型。
            /// 可选地为实现 <see cref="ISoftDeleteEntity"/> 的实体添加全局查询过滤器，自动排除 IsDeleted == true 的记录。
            /// </summary>
            public void RegisterEntity(DbContext? context = null, bool addSoftDeleteFilter = true, bool addTenantFilter = true)
            {
                var entityTypes = AppDomain.CurrentDomain.GetAssemblies()
                    .Where(a => !a.IsDynamic && !string.IsNullOrWhiteSpace(GetAssemblyLocationSafe(a)))
                    .SelectMany(a =>
                    {
                        try { return a.GetTypes(); }
                        catch (ReflectionTypeLoadException ex) { return ex.Types.Where(t => t != null)!; }
                        catch { return Array.Empty<Type>(); }
                    })
                    .Where(t => typeof(IEntity).IsAssignableFrom(t) && t.IsClass && !t.IsAbstract)
                    .ToList();

                foreach (var type in entityTypes)
                {
                    if (type is null) continue;

                    if (modelBuilder.Model.FindEntityType(type) is null)
                    {
                        modelBuilder.Entity(type);
                    }

                    // Build combined query filter for soft-delete and tenant if both apply.
                    Expression? combinedBody = null;
                    ParameterExpression? parameter = null;

                    if (addSoftDeleteFilter && typeof(ISoftDeleteEntity).IsAssignableFrom(type))
                    {
                        parameter ??= Expression.Parameter(type, "e");
                        var efPropertyMethod = typeof(EF).GetMethod(nameof(EF.Property), BindingFlags.Public | BindingFlags.Static)?.MakeGenericMethod(typeof(bool));
                        if (efPropertyMethod != null)
                        {
                            var isDeletedProperty = Expression.Call(efPropertyMethod, parameter, Expression.Constant(nameof(ISoftDeleteEntity.IsDeleted)));
                            var notDeleted = Expression.Not(isDeletedProperty);
                            combinedBody = combinedBody is null ? notDeleted : Expression.AndAlso(combinedBody, notDeleted);
                        }
                    }

                    if (addTenantFilter && context != null && typeof(ITenantEntity).IsAssignableFrom(type))
                    {
                        parameter ??= Expression.Parameter(type, "e");
                        var efPropertyMethod = typeof(EF).GetMethod(nameof(EF.Property), BindingFlags.Public | BindingFlags.Static)?.MakeGenericMethod(typeof(Guid?));
                        if (efPropertyMethod != null)
                        {
                            var tenantProperty = Expression.Call(efPropertyMethod, parameter, Expression.Constant(nameof(ITenantEntity.TenantId)));

                            // Use a property access on the context instance so EF Core can evaluate per-DbContext instance.
                            var contextConst = Expression.Constant(context);
                            var currentTenantProp = Expression.Property(contextConst, nameof(NeuroDbContext.CurrentTenantId));
                            
                            // 添加对 IsSuperUser 的判断，超管可以看到所有租户数据
                            var isSuperUserProp = Expression.Property(contextConst, nameof(NeuroDbContext.IsSuperUser));
                            
                            // 条件：如果是超管，返回 true；否则检查租户ID
                            // (IsSuperUser OR TenantId == CurrentTenantId)
                            var tenantEquals = Expression.Equal(tenantProperty, currentTenantProp);
                            var condition = Expression.OrElse(isSuperUserProp, tenantEquals);
                            
                            combinedBody = combinedBody is null ? condition : Expression.AndAlso(combinedBody, condition);
                        }
                    }

                    if (combinedBody != null && parameter != null)
                    {
                        var lambda = Expression.Lambda(combinedBody, parameter);
                        modelBuilder.Entity(type).HasQueryFilter(lambda);
                    }
                }
            }
        }

        private static string? GetAssemblyLocationSafe(Assembly assembly)
        {
            try { return assembly.Location; }
            catch { return null; }
        }

        extension(IApplicationBuilder builder)
        {
            public void AutoInitDatabase<TDbContext>(bool reset = false)
                    where TDbContext : NeuroDbContext
            {
                try
                {
                    using var scoped = builder.ApplicationServices.CreateScope();
                    var db = scoped.ServiceProvider.GetRequiredService<TDbContext>();

                    if (reset)
                    {
                        db.Database.EnsureDeleted();
                    }

                    db.Database.EnsureCreated();
                }
                catch (Exception ex)
                {
                    Debug.WriteLine($"AutoMerge failed: {ex}");
                }
            }
        }
    }
}
