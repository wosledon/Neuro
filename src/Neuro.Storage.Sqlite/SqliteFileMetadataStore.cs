using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Neuro.Storage;
using Neuro.Storage.Models;
using Neuro.Storage.Sqlite.Entities;

namespace Neuro.Storage.Sqlite
{
    public class SqliteFileMetadataStore : IFileMetadataStore
    {
        private readonly FileStoreDbContext _db;

        public SqliteFileMetadataStore(FileStoreDbContext db)
        {
            _db = db;
        }

        public async Task<FileMetadata> SaveAsync(FileMetadata metadata)
        {
            var existing = await _db.FileMetadatas.FirstOrDefaultAsync(f => f.Key == metadata.Key);
            if (existing is null)
            {
                var entity = ToEntity(metadata);
                _db.FileMetadatas.Add(entity);
                await _db.SaveChangesAsync();

                // update FTS
                await UpsertFtsAsync(entity.Key, entity.ContentText);

                return ToModel(entity);
            }

            // Update
            existing.FileName = metadata.FileName;
            existing.Path = metadata.Path;
            existing.Size = metadata.Size;
            existing.MimeType = metadata.MimeType;
            existing.UpdatedAt = metadata.UpdatedAt;
            existing.Hash = metadata.Hash;
            existing.TagsJson = metadata.TagsJson;
            existing.ContentText = metadata.ContentText;
            existing.AccessedAt = metadata.AccessedAt;

            await _db.SaveChangesAsync();

            await UpsertFtsAsync(existing.Key, existing.ContentText);

            return ToModel(existing);
        }

        public async Task<bool> DeleteAsync(string key)
        {
            var existing = await _db.FileMetadatas.FirstOrDefaultAsync(f => f.Key == key);
            if (existing is null) return false;
            _db.FileMetadatas.Remove(existing);
            await _db.SaveChangesAsync();

            // remove from fts (ignore if FTS table not present)
            try
            {
                await _db.Database.ExecuteSqlRawAsync("DELETE FROM FileContentFts WHERE Key = {0}", key);
            }
            catch
            {
                // ignore
            }

            return true;
        }

        public async Task<IEnumerable<FileMetadata>> QueryByFullTextAsync(string query)
        {
            // search in FTS table for keys
            var keys = new List<string>();
            var conn = _db.Database.GetDbConnection();
            await conn.OpenAsync();
            try
            {
                using var cmd = conn.CreateCommand();
                cmd.CommandText = "SELECT Key FROM FileContentFts WHERE FileContentFts MATCH $q";
                var p = cmd.CreateParameter();
                p.ParameterName = "$q";
                p.Value = query;
                cmd.Parameters.Add(p);

                using var r = await cmd.ExecuteReaderAsync();
                while (await r.ReadAsync())
                {
                    keys.Add(r.GetString(0));
                }
            }
            finally
            {
                await conn.CloseAsync();
            }

            if (!keys.Any()) return new List<FileMetadata>();

            var items = await _db.FileMetadatas.AsNoTracking().Where(f => keys.Contains(f.Key)).ToListAsync();
            return items.Select(ToModel);
        }

        private async Task UpsertFtsAsync(string key, string? content)
        {
            try
            {
                await _db.Database.ExecuteSqlRawAsync("DELETE FROM FileContentFts WHERE Key = {0}", key);
                if (!string.IsNullOrWhiteSpace(content))
                {
                    await _db.Database.ExecuteSqlRawAsync("INSERT INTO FileContentFts(Key, ContentText) VALUES({0}, {1})", key, content);
                }
            }
            catch
            {
                // ignore if FTS table not present or other FTS-related issues
            }
        }

        public async Task<FileMetadata?> GetByKeyAsync(string key)
        {
            var e = await _db.FileMetadatas.AsNoTracking().FirstOrDefaultAsync(f => f.Key == key);
            return e == null ? null : ToModel(e);
        }

        public async Task<bool> ExistsByHashAsync(string hash)
        {
            return await _db.FileMetadatas.AnyAsync(f => f.Hash == hash);
        }

        public async Task<IEnumerable<FileMetadata>> ListAsync(int limit = 100, int offset = 0)
        {
            var items = await _db.FileMetadatas.AsNoTracking().OrderByDescending(f => f.UpdatedAt).Skip(offset).Take(limit).ToListAsync();
            return items.Select(ToModel);
        }

        public async Task<IEnumerable<FileMetadata>> QueryByTagAsync(string tag)
        {
            var items = await _db.FileMetadatas.AsNoTracking().Where(f => f.TagsJson != null && EF.Functions.Like(f.TagsJson!, $"%\"{tag}\"%"))
                .ToListAsync();
            return items.Select(ToModel);
        }

        private static FileMetadataEntity ToEntity(FileMetadata m)
        {
            return new FileMetadataEntity
            {
                Id = m.Id,
                Key = m.Key,
                FileName = m.FileName,
                Path = m.Path,
                Size = m.Size,
                MimeType = m.MimeType,
                CreatedAt = m.CreatedAt,
                UpdatedAt = m.UpdatedAt,
                Hash = m.Hash,
                TagsJson = m.TagsJson,
                ContentText = m.ContentText,
                AccessedAt = m.AccessedAt
            };
        }

        private static FileMetadata ToModel(FileMetadataEntity e)
        {
            return new FileMetadata
            {
                Id = e.Id,
                Key = e.Key,
                FileName = e.FileName,
                Path = e.Path,
                Size = e.Size,
                MimeType = e.MimeType,
                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt,
                Hash = e.Hash,
                TagsJson = e.TagsJson,
                ContentText = e.ContentText,
                AccessedAt = e.AccessedAt
            };
        }
    }
}