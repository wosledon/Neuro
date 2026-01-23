using Microsoft.Extensions.DependencyInjection;

namespace Neuro.Vectorizer;

public static class VectorizerExtensions
{
    public static IServiceCollection AddVectorizer(this IServiceCollection services, Action<VectorizerOptions>? configure = null)
    {
        var opts = new VectorizerOptions();
        configure?.Invoke(opts);
        services.AddSingleton(opts);
        services.AddSingleton<IVectorizer>(sp => new OnnxVectorizer(sp.GetRequiredService<VectorizerOptions>()));
        return services;
    }
}
