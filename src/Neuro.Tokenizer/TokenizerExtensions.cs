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

        // 使用BertWordPieceTokenizer - 支持WordPiece子词切分和完整vocab.txt加载
        services.AddSingleton<ITokenizer>(sp => new BertWordPieceTokenizer(sp.GetRequiredService<TokenizerOptions>()));
        return services;
    }
}