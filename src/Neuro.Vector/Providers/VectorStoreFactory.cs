using Microsoft.Extensions.DependencyInjection;
using Neuro.Vector.Stores;

namespace Neuro.Vector;

public static class VectorStoreFactory
{
    // 提供者注册表：将提供者名称映射到接收 IServiceProvider 与选项并返回 IVectorStore 的工厂方法
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, Func<IServiceProvider?, IDictionary<string, object?>?, IVectorStore>> _providers =
        new(System.StringComparer.OrdinalIgnoreCase);

    static VectorStoreFactory()
    {
        // 注册内置提供者
        RegisterProvider("local", (_, _) => new LocalVectorStore());
        RegisterProvider("lockfree", (_, _) => new LockFreeVectorStore());
    }

    // 注册一个接受 IServiceProvider（可为 null）和选项的提供者工厂方法
    public static void RegisterProvider(string name, Func<IServiceProvider?, IDictionary<string, object?>?, IVectorStore> factory)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("必须指定名称", nameof(name));
        if (factory == null) throw new ArgumentNullException(nameof(factory));
        _providers[name] = factory;
    }

    // 便捷重载：注册不需要 IServiceProvider 的提供者工厂
    public static void RegisterProvider(string name, Func<IDictionary<string, object?>?, IVectorStore> factory)
    {
        if (factory == null) throw new ArgumentNullException(nameof(factory));
        RegisterProvider(name, (_, opts) => factory(opts));
    }

    public static bool UnregisterProvider(string name) => _providers.TryRemove(name, out _);

    public static bool IsProviderRegistered(string name) => _providers.ContainsKey(name);

    public static IVectorStore Create(string provider, IDictionary<string, object?>? options = null, IServiceProvider? serviceProvider = null)
    {
        if (string.IsNullOrWhiteSpace(provider)) throw new ArgumentException("必须指定提供者名称", nameof(provider));
        if (_providers.TryGetValue(provider, out var factory)) return factory(serviceProvider, options);
        throw new NotSupportedException($"不支持提供者 '{provider}'。请使用 VectorStoreFactory.RegisterProvider 注册提供者。");
    }
}