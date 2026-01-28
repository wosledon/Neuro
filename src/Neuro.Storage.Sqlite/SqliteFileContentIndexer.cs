using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Neuro.Storage.Sqlite
{
    public class SqliteFileContentIndexer : IFileContentIndexer
    {
        private readonly FileStoreDbContext _db;
        private readonly IndexingOptions _options;

        public SqliteFileContentIndexer(FileStoreDbContext db, IOptions<IndexingOptions> options)
        {
            _db = db;
            _options = options.Value;
        }

        public async Task IndexContentAsync(string key, string? content)
        {
            try
            {
                // Ensure FTS table exists
                await _db.Database.ExecuteSqlRawAsync("CREATE VIRTUAL TABLE IF NOT EXISTS FileContentFts USING fts5(Key, ContentText);");

                await _db.Database.ExecuteSqlRawAsync("DELETE FROM FileContentFts WHERE Key = {0}", key);

                if (!string.IsNullOrWhiteSpace(content))
                {
                    var c = content.Length > _options.MaxContentBytes ? content.Substring(0, _options.MaxContentBytes) : content;
                    await _db.Database.ExecuteSqlRawAsync("INSERT INTO FileContentFts(Key, ContentText) VALUES({0}, {1})", key, c);
                }
            }
            catch
            {
                // swallow errors to avoid crashing the background service
            }
        }
    }
}