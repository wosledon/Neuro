using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;
using Neuro.Storage;
using Neuro.Storage.Enums;
using Neuro.Storage.Providers;
using Xunit;

namespace Neuro.Storage.Sqlite.Tests
{
    public class AsyncIndexingTests
    {
        [Fact]
        public async Task Provider_EnqueuesAndBackgroundIndexer_PopulatesFts()
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

                // Ensure DB and start hosted services
                SqliteExtensions.EnsureDatabaseCreated(sp);
                SqliteExtensions.EnsureFullTextIndex(sp);

                var provider = sp.GetRequiredService<IFileStorage>();
                var store = sp.GetRequiredService<IFileMetadataStore>();

                var data = Encoding.UTF8.GetBytes("async hello world");
                await using (var ms = new MemoryStream(data))
                {
                    var key = await provider.SaveAsync(ms, "async.txt", StorageTypeEnum.Temporary);

                    // metadata should be present
                    var meta = await store.GetByKeyAsync(key);
                    Assert.NotNull(meta);

                    // wait until fts returns result or timeout
                    var found = false;
                    var sw = System.Diagnostics.Stopwatch.StartNew();
                    while (sw.Elapsed < TimeSpan.FromSeconds(5))
                    {
                        var hits = await store.QueryByFullTextAsync("async");
                        if (hits.Any(h => h.Key == key)) { found = true; break; }
                        await Task.Delay(100);
                    }

                    Assert.True(found, "FTS did not index the content in time");
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