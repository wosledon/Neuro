using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Neuro.Storage;
using Neuro.Storage.Enums;
using Neuro.Storage.Abstractions;
using Xunit;

namespace Neuro.Storage.Sqlite.Tests
{
    public class ProviderConcurrencyTests
    {
        [Fact]
        public async Task Concurrent_Saves_Create_All_Metadata()
        {
            var dbFile = Path.Combine(Path.GetTempPath(), $"test_filestore_{Guid.NewGuid()}.db");
            var storageDir = Path.Combine(Path.GetTempPath(), $"local_storage_{Guid.NewGuid()}");
            Directory.CreateDirectory(storageDir);

            try
            {
                var services = new ServiceCollection();
                services.AddSqliteFileStore(o => o.ConnectionString = $"Data Source={dbFile};Cache=Shared;Mode=ReadWriteCreate;Pooling=True;");
                services.AddLocalFileStorage(o => o.PathBase = storageDir);

                var sp = services.BuildServiceProvider();

                SqliteExtensions.EnsureDatabaseCreated(sp);

                var data = Encoding.UTF8.GetBytes("concurrent-content");

                var tasks = Enumerable.Range(0, 50).Select(async i =>
                {
                    await using var ms = new MemoryStream(data);
                    using var scope = sp.CreateScope();
                    var providerScoped = scope.ServiceProvider.GetRequiredService<IFileStorage>();
                    var key = await providerScoped.SaveAsync(ms, $"file_{i}.txt", StorageTypeEnum.Temporary);
                    return (key, scope);
                }).ToArray();

                var results = await Task.WhenAll(tasks);
                var keys = results.Select(r => r.key).ToArray();

                // ensure metadata exists for all keys
                using var verifyScope = sp.CreateScope();
                var store = verifyScope.ServiceProvider.GetRequiredService<IFileMetadataStore>();
                foreach (var k in keys)
                {
                    var m = await store.GetByKeyAsync(k);
                    Assert.NotNull(m);
                }
            }
            finally
            {
                try { Directory.Delete(storageDir, true); } catch { }
                try { if (File.Exists(dbFile)) File.Delete(dbFile); } catch { }
            }
        }
    }
}