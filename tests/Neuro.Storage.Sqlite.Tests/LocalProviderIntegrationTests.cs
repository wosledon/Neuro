using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;
using Neuro.Storage;
using Neuro.Storage.Enums;
using Neuro.Storage.Providers;
using Neuro.Storage.Abstractions;
using Neuro.Storage.Options;
using Xunit;

namespace Neuro.Storage.Sqlite.Tests
{
    public class LocalProviderIntegrationTests
    {
        [Fact]
        public async Task SaveViaProvider_UpdatesMetadataAndFts()
        {
            var dbFile = Path.Combine(Path.GetTempPath(), $"test_filestore_{Guid.NewGuid()}.db");
            var storageDir = Path.Combine(Path.GetTempPath(), $"local_storage_{Guid.NewGuid()}");
            Directory.CreateDirectory(storageDir);

            try
            {
                var services = new ServiceCollection();
                services.AddSqliteFileStore(o => o.ConnectionString = $"Data Source={dbFile};Cache=Shared;Mode=ReadWriteCreate;Pooling=True;");
                services.Configure<FileStorageOptions>(o => o.PathBase = storageDir);
                services.AddScoped<IFileStorage, LocalFileStorageProvider>();

                var sp = services.BuildServiceProvider();

                // Ensure DB and FTS
                SqliteExtensions.EnsureDatabaseCreated(sp);
                SqliteExtensions.EnsureFullTextIndex(sp);

                var provider = sp.GetRequiredService<IFileStorage>();
                var store = sp.GetRequiredService<IFileMetadataStore>();

                var data = Encoding.UTF8.GetBytes("hello world from test");
                await using (var ms = new MemoryStream(data))
                {
                    var key = await provider.SaveAsync(ms, "greeting.txt", StorageTypeEnum.Temporary);
                    Assert.False(string.IsNullOrWhiteSpace(key));

                    // metadata
                    var meta = await store.GetByKeyAsync(key);
                    Assert.NotNull(meta);
                    Assert.Equal("greeting.txt", meta!.FileName);

                    // fts search
                    var hits = await store.QueryByFullTextAsync("hello");
                    Assert.NotEmpty(hits);
                }

                if (sp is IDisposable d) d.Dispose();
            }
            finally
            {
                try { Directory.Delete(storageDir, true); } catch { }
                try { if (File.Exists(dbFile)) File.Delete(dbFile); } catch { }
            }
        }
    }
}