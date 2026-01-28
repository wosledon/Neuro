using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Neuro.Storage.Providers;
using Neuro.Storage.Indexing;
using Neuro.Storage.Options;
using Neuro.Storage.Abstractions;
using Neuro.Storage.Sync;

namespace Neuro.Storage;

public static class FileStorageExtensions
{
    public static IHostApplicationBuilder AddStorage(this IHostApplicationBuilder builder)
    {
        return builder;
    }

    /// <summary>
    /// Register a background file system indexer that will keep metadata in sync.
    /// </summary>
    public static IHostApplicationBuilder AddFileSystemIndexer(this IHostApplicationBuilder builder)
    {
        builder.Services.AddHostedService<FileSystemIndexer>();
        return builder;
    }

    /// <summary>
    /// Register a local file storage provider for simple filesystem-backed storage.
    /// </summary>
    public static IServiceCollection AddLocalFileStorage(this IServiceCollection services, Action<FileStorageOptions>? configure = null)
    {
        if (configure != null) services.Configure(configure);

        services.AddScoped<IFileStorage>(sp =>
        {
            var options = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<FileStorageOptions>>();
            var metadata = sp.GetService<IFileMetadataStore>();
            var queue = sp.GetService<IFileIndexingQueue>();
            return new LocalFileStorageProvider(options, metadata, queue);
        });

        return services;
    }
}