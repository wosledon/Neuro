using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;
using Neuro.Storage;
using Neuro.Storage.Enums;
using Neuro.Storage.Abstractions;
using Xunit;

namespace Neuro.Storage.Sqlite.Tests
{
    public class ProviderOperationsTests
    {
        [Fact]
        public async Task Save_Copy_Move_Delete_List_Hash_Work()
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

                var provider = sp.GetRequiredService<IFileStorage>();
                var store = sp.GetRequiredService<IFileMetadataStore>();

                // Save
                var data = Encoding.UTF8.GetBytes("content-for-hash");
                await using (var ms = new MemoryStream(data))
                {
                    var key = await provider.SaveAsync(ms, "file.txt", StorageTypeEnum.Temporary);
                    Assert.False(string.IsNullOrWhiteSpace(key));

                    // metadata present
                    var initialMeta = await store.GetByKeyAsync(key);
                    Assert.NotNull(initialMeta);

                    // Hash
                    var fileHash = await provider.HashFileAsync(key);
                    Assert.False(string.IsNullOrWhiteSpace(fileHash));

                    // List
                    var list = await provider.ListAsync("Temporary");
                    Assert.Contains(list, x => Path.GetFileName(x) == "file.txt");

                    // GetFileSize uses metadata
                    var size = await provider.GetFileSizeAsync(key);
                    Assert.Equal(data.Length, size);

                    // Get updates AccessedAt
                    using (var s = await provider.GetAsync(key)) { /* read */ }
                    var metaAfterGet = await store.GetByKeyAsync(key);
                    Assert.NotNull(metaAfterGet);
                    Assert.True(metaAfterGet!.AccessedAt.HasValue);

                    // Copy
                    var copyKey = await provider.CopyAsync(key);
                    Assert.False(string.IsNullOrWhiteSpace(copyKey));
                    var copyMeta = await store.GetByKeyAsync(copyKey);
                    Assert.NotNull(copyMeta);

                    // Move
                    var movedKey = await provider.MoveAsync(copyKey);
                    Assert.False(string.IsNullOrWhiteSpace(movedKey));
                    var movedMeta = await store.GetByKeyAsync(movedKey);
                    Assert.NotNull(movedMeta);
                    var oldMeta = await store.GetByKeyAsync(copyKey);
                    Assert.Null(oldMeta);

                    // Delete
                    var deleted = await provider.DeleteAsync(movedKey);
                    Assert.True(deleted);
                    var afterDelete = await store.GetByKeyAsync(movedKey);
                    Assert.Null(afterDelete);
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