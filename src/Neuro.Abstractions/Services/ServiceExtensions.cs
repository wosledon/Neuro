using System;
using System.Linq;
using System.Reflection;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Neuro.Abstractions.Services
{
    public static class ServiceExtensions
    {
        extension(IHostApplicationBuilder builder)
        {
            /// <summary>
            /// 自动扫描当前 AppDomain 中的类型并按约定注册服务。
            /// 支持三种生命周期标记接口：IScopedLifeTimeService / ISingletonLifeTimeService / ITransientLifeTimeService。
            /// 对程序集和类型获取进行了容错处理，忽略系统/动态程序集。
            /// </summary>
            public IHostApplicationBuilder RegisterServices()
            {
                var assemblies = AppDomain.CurrentDomain.GetAssemblies()
                    .Where(a => !a.IsDynamic
                                && !string.IsNullOrWhiteSpace(GetAssemblyLocationSafe(a))
                                && !(a.FullName?.StartsWith("Microsoft.", StringComparison.OrdinalIgnoreCase) ?? false)
                                && !(a.FullName?.StartsWith("System.", StringComparison.OrdinalIgnoreCase) ?? false)
                                && !(a.FullName?.StartsWith("netstandard", StringComparison.OrdinalIgnoreCase) ?? false))
                    .ToArray();

                var allTypes = assemblies.SelectMany(a =>
                {
                    try
                    {
                        return a.GetTypes();
                    }
                    catch (ReflectionTypeLoadException ex)
                    {
                        return ex.Types?.Where(t => t != null).Select(t => t!) ?? Array.Empty<Type>();
                    }
                    catch
                    {
                        return Array.Empty<Type>();
                    }
                })
                .Where(t => t is { IsClass: true, IsAbstract: false })
                .ToArray();

                RegisterByLifetime(builder, allTypes, typeof(IScopedLifeTimeService), (b, @interface, impl) =>
                {
                    if (@interface != null) b.Services.AddScoped(@interface, impl);
                    else b.Services.AddScoped(impl);
                });

                RegisterByLifetime(builder, allTypes, typeof(ISingletonLifeTimeService), (b, @interface, impl) =>
                {
                    if (@interface != null) b.Services.AddSingleton(@interface, impl);
                    else b.Services.AddSingleton(impl);
                });

                RegisterByLifetime(builder, allTypes, typeof(ITransientLifeTimeService), (b, @interface, impl) =>
                {
                    if (@interface != null) b.Services.AddTransient(@interface, impl);
                    else b.Services.AddTransient(impl);
                });

                return builder;
            }
        }

        private static void RegisterByLifetime(IHostApplicationBuilder builder, Type[] types, Type markerInterface, Action<IHostApplicationBuilder, Type?, Type> registerAction)
        {
            var matches = types.Where(t => markerInterface.IsAssignableFrom(t)).ToArray();
            foreach (var impl in matches)
            {
                var @interface = impl.GetInterfaces()
                    .FirstOrDefault(i => string.Equals(i.Name, "I" + impl.Name, StringComparison.Ordinal));

                try
                {
                    registerAction(builder, @interface, impl);
                }
                catch
                {
                    // 单个注册失败时忽略，避免启动崩溃
                }
            }
        }

        private static string? GetAssemblyLocationSafe(Assembly assembly)
        {
            try { return assembly.Location; }
            catch { return null; }
        }
    }
}
