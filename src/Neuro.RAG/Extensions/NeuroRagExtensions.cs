using System;
using System.Linq;
using Microsoft.Extensions.DependencyInjection;
using Neuro.RAG.Abstractions;
using Neuro.RAG.Models;
using Neuro.RAG.Services;
using Neuro.RAG.Utils;

namespace Microsoft.Extensions.DependencyInjection;

public static class NeuroRagExtensions
{
    /// <summary>
    /// 注册 RAG 所需的服务并提供合理默认实现：
    /// - 如果未注册 ITokenizer，则默认注册基于 Tiktoken 的实现；
    /// - 如果未注册 IVectorStore，则默认注册 <see cref="Neuro.Vector.Stores.LockFreeVectorStore"/>；
    /// - 允许通过 <paramref name="configure"/> 配置 <see cref="Neuro.RAG.Models.RagOptions"/>。
    /// </summary>
    public static IServiceCollection AddNeuroRAG(this IServiceCollection services, Action<RagOptions>? configure = null)
    {
        // 配置 RagOptions（允许调用者传入自定义选项）
        if (configure != null)
        {
            services.Configure(configure);
        }

        // 如果宿主未注册 ITokenizer，则提供一个基于 Tiktoken 的默认实现（便于快速开始）
        if (!services.Any(sd => sd.ServiceType == typeof(Neuro.Tokenizer.ITokenizer)))
        {
            services.AddSingleton<Neuro.Tokenizer.TokenizerOptions>();
            services.AddSingleton<Neuro.Tokenizer.ITokenizer>(sp => new Neuro.Tokenizer.TiktokenTokenizerAdapter(sp.GetRequiredService<Neuro.Tokenizer.TokenizerOptions>()));
        }

        // 如果宿主未注册 IVectorStore，则将 LockFreeVectorStore 作为默认实现注册
        if (!services.Any(sd => sd.ServiceType == typeof(Neuro.Vector.IVectorStore)))
        {
            services.AddSingleton<Neuro.Vector.IVectorStore, Neuro.Vector.Stores.LockFreeVectorStore>();
        }

        // TextChunker 使用 DI 注入的 ITokenizer（若存在）并作为单例注册
        services.AddSingleton<TextChunker>(sp =>
        {
            var tokenizer = sp.GetService<Neuro.Tokenizer.ITokenizer>();
            return new TextChunker(tokenizer);
        });

        services.AddScoped<IIngestService, IngestService>();
        services.AddScoped<ISearchService, SearchService>();
        services.AddScoped<IRagService, RagService>();
        return services;
    }
}
