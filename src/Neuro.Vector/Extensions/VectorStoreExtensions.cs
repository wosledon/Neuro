using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace Neuro.Vector;

public static class VectorStoreExtensions
{
    public static IHostApplicationBuilder AddVectorStore(this IHostApplicationBuilder builder, Action<VectorStoreOptions>? configure = null)
    {
        builder.Services.AddVectorStore(configure);
        return builder;
    }

    public static IServiceCollection AddVectorStore(this IServiceCollection services, Action<VectorStoreOptions>? configure = null)
    {
        var options = new VectorStoreOptions();
        configure?.Invoke(options);
        services.AddSingleton(options);

        services.AddSingleton<IVectorStore>(sp =>
        {
            // 如果用户提供了工厂，则直接使用
            if (options.ProviderFactory != null) return options.ProviderFactory(sp);

            if (string.IsNullOrEmpty(options.ProviderName)) throw new InvalidOperationException("未提供 ProviderFactory 时，必须设置 VectorStoreOption.ProviderName。\n请通过 ProviderName 指定要使用的提供者，或提供 ProviderFactory。");

            return VectorStoreFactory.Create(options.ProviderName, options.ProviderOptions, sp);
        });

        return services;
    }

    /// <summary>
    /// 注册一个接受应用级 IServiceProvider 的提供者工厂方法。当提供者实现需要其他服务时很有用。
    /// </summary>
    public static IServiceCollection AddVectorStoreProvider(this IServiceCollection services, string name, Func<IServiceProvider, IVectorStore> factory)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("必须指定名称", nameof(name));
        if (factory == null) throw new ArgumentNullException(nameof(factory));

        VectorStoreFactory.RegisterProvider(name, (sp, opts) => factory(sp ?? throw new InvalidOperationException("提供者工厂需要一个非空的 IServiceProvider。")));
        return services;
    }
}

public class VectorStoreOptions : IOptions<VectorStoreOptions>
{
    /// <summary>
    /// 在 VectorStoreFactory 中注册的提供者名称（例如："local"、"lockfree" 或外部提供者名称）。
    /// </summary>
    public string? ProviderName { get; set; }

    /// <summary>
    /// 任意的、提供者特定的选项，会传递给提供者工厂方法。
    /// </summary>
    public IDictionary<string, object?>? ProviderOptions { get; set; }

    /// <summary>
    /// 可选：接收 IServiceProvider 并返回已配置的 IVectorStore 的工厂方法。
    /// 如果设置了此项，则优先于 ProviderName/ProviderOptions。
    /// </summary>
    public Func<IServiceProvider, IVectorStore>? ProviderFactory { get; set; }

    public VectorStoreOptions Value => this;
}