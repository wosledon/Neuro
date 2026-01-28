using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Neuro.Storage.Models;
using Xunit;

namespace Neuro.Storage.Sqlite.Tests
{
    public class FileMetadataStoreTests
    {
        [Fact]
        public async Task SaveAndGetByKey_Works()
        {
            var dbFile = Path.Combine(Path.GetTempPath(), $"test_filestore_{Guid.NewGuid()}.db");
            try
            {
                var services = new ServiceCollection();
                services.AddDbContext<FileStoreDbContext>(b => b.UseSqlite($"Data Source={dbFile}"));
                services.AddScoped<IFileMetadataStore, SqliteFileMetadataStore>();

                var sp = services.BuildServiceProvider();
                sp.GetRequiredService<FileStoreDbContext>().Database.EnsureCreated();

                var store = sp.GetRequiredService<IFileMetadataStore>();

                var meta = new FileMetadata
                {
                    Key = "test/key",
                    FileName = "file.txt",
                    Path = "/tmp/file.txt",
                    Size = 123,
                    Hash = "abc",
                    TagsJson = "[\"tag1\"]"
                };

                var saved = await store.SaveAsync(meta);
                Assert.NotNull(saved);

                var got = await store.GetByKeyAsync("test/key");
                Assert.NotNull(got);
                Assert.Equal("file.txt", got!.FileName);

                var exists = await store.ExistsByHashAsync("abc");
                Assert.True(exists);

                // Dispose the service provider so SQLite file is not locked when deleting
                if (sp is IDisposable d) d.Dispose();

                // force finalizers to release file handles used by Sqlite
                GC.Collect();
                GC.WaitForPendingFinalizers();
            }
            finally
            {
                try
                {
                    if (File.Exists(dbFile)) File.Delete(dbFile);
                }
                catch (IOException)
                {
                    // ignore cleanup failures - file may be locked on CI/Windows
                }
            }
        }
    }
}