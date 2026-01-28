using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Neuro.Storage.Sqlite
{
    public static class SqliteExtensions
    {
        public static IServiceCollection AddSqliteFileStore(this IServiceCollection services, Action<SqliteFileStoreOptions>? configure = null, Action<IndexingOptions>? configureIndexing = null)
        {
            var options = new SqliteFileStoreOptions();
            configure?.Invoke(options);

            services.TryAddSingleton(options);

            // indexing options
            var indexingOptions = new IndexingOptions();
            configureIndexing?.Invoke(indexingOptions);
            services.TryAddSingleton(indexingOptions);

            services.AddDbContext<FileStoreDbContext>(builder =>
            {
                builder.UseSqlite(options.ConnectionString);
            });

            services.AddScoped<IFileMetadataStore, SqliteFileMetadataStore>();

            // indexing queue + background service (capacity from options)
            services.AddSingleton<IFileIndexingQueue>(sp => new FileIndexingQueue(sp.GetRequiredService<IndexingOptions>().ChannelCapacity));
            services.AddSingleton<IFileContentIndexer, SqliteFileContentIndexer>();
            services.AddHostedService<FileIndexingHostedService>();

            return services;
        }

        public static void EnsureDatabaseCreated(IServiceProvider provider)
        {
            using var scope = provider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<FileStoreDbContext>();
            db.Database.EnsureCreated();
        }

        public static void ApplyMigrations(IServiceProvider provider)
        {
            using var scope = provider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<FileStoreDbContext>();
            db.Database.Migrate();
        }

        public static void EnsureFullTextIndex(IServiceProvider provider)
        {
            using var scope = provider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<FileStoreDbContext>();
            // simple FTS5 table: Key + ContentText
            db.Database.ExecuteSqlRaw("CREATE VIRTUAL TABLE IF NOT EXISTS FileContentFts USING fts5(Key, ContentText);");
        }
    }
}