using System;
using System.Diagnostics;
using System.Linq.Expressions;
using System.Reflection;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection; // 需要用于 BuildServiceProvider/GetRequiredService
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

                    if (addSoftDeleteFilter && typeof(ISoftDeleteEntity).IsAssignableFrom(type))
                    {
                        var parameter = Expression.Parameter(type, "e");
                        var efPropertyMethod = typeof(EF).GetMethod(nameof(EF.Property), BindingFlags.Public | BindingFlags.Static)?.MakeGenericMethod(typeof(bool));
                        if (efPropertyMethod != null)
                        {
                            var isDeletedProperty = Expression.Call(efPropertyMethod, parameter, Expression.Constant(nameof(ISoftDeleteEntity.IsDeleted)));
                            var body = Expression.Not(isDeletedProperty);
                            var lambda = Expression.Lambda(body, parameter);
                            modelBuilder.Entity(type).HasQueryFilter(lambda);
                        }
                    }

                    if (addTenantFilter && context != null && typeof(ITenantEntity).IsAssignableFrom(type))
                    {
                        // 构建表达式：e => EF.Property<Guid?>(e, "TenantId") == ((NeuroDbContext)context).CurrentTenantId
                        var parameter = Expression.Parameter(type, "e");
                        var efPropertyMethod = typeof(EF).GetMethod(nameof(EF.Property), BindingFlags.Public | BindingFlags.Static)?.MakeGenericMethod(typeof(Guid?));
                        if (efPropertyMethod == null) continue;

                        var tenantProperty = Expression.Call(efPropertyMethod, parameter, Expression.Constant(nameof(ITenantEntity.TenantId)));

                        // 访问 context.CurrentTenantId
                        var contextConst = Expression.Constant(context);
                        var currentTenantProp = Expression.Property(contextConst, nameof(NeuroDbContext.CurrentTenantId));

                        var body = Expression.Equal(tenantProperty, currentTenantProp);
                        var lambda = Expression.Lambda(body, parameter);

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
