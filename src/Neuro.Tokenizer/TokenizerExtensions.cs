using Microsoft.Extensions.DependencyInjection;

namespace Neuro.Tokenizer;

/// <summary>
/// DI 扩展方法：将 ITokenizer 与其配置注册到服务容器中。
/// </summary>
public static class TokenizerExtensions
{
    public static IServiceCollection AddTokenizer(this IServiceCollection services, Action<TokenizerOptions>? configure = null)
    {
        var opts = new TokenizerOptions();
        configure?.Invoke(opts);
        services.AddSingleton(opts);
        services.AddSingleton<ITokenizer>(sp => new TiktokenTokenizerAdapter(sp.GetRequiredService<TokenizerOptions>()));
        return services;
    }
}