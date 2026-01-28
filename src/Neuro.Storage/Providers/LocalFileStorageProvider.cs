using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.DependencyInjection;
using Neuro.Storage.Enums;

namespace Neuro.Storage.Providers;

public class LocalFileStorageProvider : IFileStorage
{
    private readonly FileStorageOptions _options;
    private readonly IFileMetadataStore? _metadataStore;
    private readonly IFileIndexingQueue? _indexingQueue;
    private readonly IServiceScopeFactory? _scopeFactory;

    private readonly IndexingOptions _indexingOptions;

    public LocalFileStorageProvider(IOptions<FileStorageOptions> options, IFileMetadataStore? metadataStore = null, IFileIndexingQueue? indexingQueue = null, IServiceScopeFactory? scopeFactory = null, IOptions<IndexingOptions>? indexingOptions = null)
    {
        _options = options.Value;
        _metadataStore = metadataStore;
        _indexingQueue = indexingQueue;
        _scopeFactory = scopeFactory;
        _indexingOptions = indexingOptions?.Value ?? new IndexingOptions();

        EnsureDirectoryExists(GetRootPath());
    }

    void EnsureDirectoryExists(string path)
    {
        if (!Directory.Exists(path))
        {
            Directory.CreateDirectory(path);
        }
    }

    string GetRootPath()
    {
        var basePath = _options.PathBase;
        return Path.IsPathRooted(basePath) ? basePath : Path.Combine(AppContext.BaseDirectory, basePath);
    }

    string GetFullPath(string key)
    {
        return Path.Combine(GetRootPath(), key);
    }

    string GetFullPath(StorageTypeEnum storageType)
    {
        var rootPath = GetRootPath();
        var typePath = storageType.ToString();

        var fullPath = Path.Combine(rootPath, typePath);
        EnsureDirectoryExists(fullPath);

        return fullPath;
    }

    public async Task<string> CopyAsync(string sourceKey)
    {
        var sourcePath = GetFullPath(sourceKey);
        if (!File.Exists(sourcePath)) throw new FileNotFoundException(sourceKey);

        var storageType = Path.GetDirectoryName(sourceKey) ?? string.Empty;
        var destFileName = Guid.NewGuid().ToString() + Path.GetExtension(sourcePath);
        var destDir = Path.Combine(GetRootPath(), storageType);
        EnsureDirectoryExists(destDir);
        var destPath = Path.Combine(destDir, destFileName);

        File.Copy(sourcePath, destPath);

        var key = Path.Combine(storageType, destFileName);

        if (_metadataStore != null)
        {
            using var fs = new FileStream(destPath, FileMode.Open, FileAccess.Read, FileShare.Read);
            var hash = await ComputeHashAsync(fs);
            var fi = new FileInfo(destPath);
            var meta = new Neuro.Storage.Models.FileMetadata
            {
                Key = key,
                FileName = Path.GetFileName(destPath),
                Path = destPath,
                Size = fi.Length,
                CreatedAt = fi.CreationTimeUtc,
                UpdatedAt = fi.LastWriteTimeUtc,
                Hash = hash,
                ContentText = TryReadTextPreview(destPath, _indexingOptions.MaxContentBytes)
            };

            await _metadataStore.SaveAsync(meta);

            if (_indexingQueue != null && meta.ContentText != null)
            {
                // enqueue for async indexing
                await _indexingQueue.EnqueueAsync(meta.Key, meta.ContentText);
            }
        }
        else if (_scopeFactory != null)
        {
            using var scope = _scopeFactory.CreateScope();
            var store = scope.ServiceProvider.GetService<IFileMetadataStore>();
            if (store != null)
            {
                using var fs = new FileStream(destPath, FileMode.Open, FileAccess.Read, FileShare.Read);
                var hash = await ComputeHashAsync(fs);
                var fi = new FileInfo(destPath);
                var meta = new Neuro.Storage.Models.FileMetadata
                {
                    Key = key,
                    FileName = Path.GetFileName(destPath),
                    Path = destPath,
                    Size = fi.Length,
                    CreatedAt = fi.CreationTimeUtc,
                    UpdatedAt = fi.LastWriteTimeUtc,
                    Hash = hash,
                    ContentText = TryReadTextPreview(destPath, _indexingOptions.MaxContentBytes)
                };

                await store.SaveAsync(meta);

                if (_indexingQueue != null && meta.ContentText != null)
                {
                    await _indexingQueue.EnqueueAsync(meta.Key, meta.ContentText);
                }
            }
        }

        return key;
    }

    public async Task<bool> ExistsAsync(string key)
    {
        if (_metadataStore != null)
        {
            var meta = await _metadataStore.GetByKeyAsync(key);
            if (meta != null) return true;
        }
        else if (_scopeFactory != null)
        {
            using var scope = _scopeFactory.CreateScope();
            var store = scope.ServiceProvider.GetService<IFileMetadataStore>();
            if (store != null)
            {
                var meta = await store.GetByKeyAsync(key);
                if (meta != null) return true;
            }
        }

        var fullPath = GetFullPath(key);
        return File.Exists(fullPath);
    }

    public async Task<Stream> GetAsync(string key)
    {
        if (!await ExistsAsync(key))
        {
            throw new FileNotFoundException($"File with key '{key}' not found.");
        }

        var fullPath = GetFullPath(key);
        var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);

        if (_metadataStore != null)
        {
            var meta = await _metadataStore.GetByKeyAsync(key);
            if (meta != null)
            {
                meta.AccessedAt = DateTime.UtcNow;
                await _metadataStore.SaveAsync(meta);
            }
        }
        else if (_scopeFactory != null)
        {
            using var scope = _scopeFactory.CreateScope();
            var store = scope.ServiceProvider.GetService<IFileMetadataStore>();
            if (store != null)
            {
                var meta = await store.GetByKeyAsync(key);
                if (meta != null)
                {
                    meta.AccessedAt = DateTime.UtcNow;
                    await store.SaveAsync(meta);
                }
            }
        }

        return stream;
    }

    public async Task<long> GetFileSizeAsync(string key)
    {
        if (_metadataStore != null)
        {
            var meta = await _metadataStore.GetByKeyAsync(key);
            if (meta != null) return meta.Size;
        }
        else if (_scopeFactory != null)
        {
            using var scope = _scopeFactory.CreateScope();
            var store = scope.ServiceProvider.GetService<IFileMetadataStore>();
            if (store != null)
            {
                var meta = await store.GetByKeyAsync(key);
                if (meta != null) return meta.Size;
            }
        }

        var fullPath = GetFullPath(key);
        if (!File.Exists(fullPath)) throw new FileNotFoundException($"File with key '{key}' not found.");

        var fileInfo = new FileInfo(fullPath);
        return fileInfo.Length;
    }

    public async Task<string> HashFileAsync(string key)
    {
        if (_metadataStore != null)
        {
            var meta = await _metadataStore.GetByKeyAsync(key);
            if (meta != null && !string.IsNullOrWhiteSpace(meta.Hash)) return meta.Hash;
        }
        else if (_scopeFactory != null)
        {
            using var scope = _scopeFactory.CreateScope();
            var store = scope.ServiceProvider.GetService<IFileMetadataStore>();
            if (store != null)
            {
                var meta = await store.GetByKeyAsync(key);
                if (meta != null && !string.IsNullOrWhiteSpace(meta.Hash)) return meta.Hash;
            }
        }

        var fullPath = GetFullPath(key);
        if (!File.Exists(fullPath)) throw new FileNotFoundException(key);

        using var fs = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        var hash = await ComputeHashAsync(fs);

        if (_metadataStore != null)
        {
            var meta = await _metadataStore.GetByKeyAsync(key);
            if (meta != null)
            {
                meta.Hash = hash;
                await _metadataStore.SaveAsync(meta);
            }
        }
        else if (_scopeFactory != null)
        {
            using var scope = _scopeFactory.CreateScope();
            var store = scope.ServiceProvider.GetService<IFileMetadataStore>();
            if (store != null)
            {
                var meta = await store.GetByKeyAsync(key);
                if (meta != null)
                {
                    meta.Hash = hash;
                    await store.SaveAsync(meta);
                }
            }
        }

        return hash;
    }

    public async Task<bool> DeleteAsync(string key)
    {
        var fullPath = GetFullPath(key);
        if (!File.Exists(fullPath)) return false;

        File.Delete(fullPath);

        if (_metadataStore != null)
        {
            await _metadataStore.DeleteAsync(key);
        }

        if (_indexingQueue != null)
        {
            // enqueue a null content to remove from FTS
            await _indexingQueue.EnqueueAsync(key, null);
        }

        return true;
    }

    public Task<IEnumerable<string>> ListAsync(string directoryKey)
    {
        var dirPath = Path.Combine(GetRootPath(), directoryKey);
        if (!Directory.Exists(dirPath)) return Task.FromResult(Enumerable.Empty<string>());

        var files = Directory.EnumerateFiles(dirPath, "*", SearchOption.TopDirectoryOnly)
            .Select(f => Path.GetRelativePath(GetRootPath(), f));

        return Task.FromResult(files);
    }

    public async Task<string> MoveAsync(string sourceKey)
    {
        var sourcePath = GetFullPath(sourceKey);
        if (!File.Exists(sourcePath)) throw new FileNotFoundException(sourceKey);

        var storageType = Path.GetDirectoryName(sourceKey) ?? string.Empty;
        var destFileName = Guid.NewGuid().ToString() + Path.GetExtension(sourcePath);
        var destDir = Path.Combine(GetRootPath(), storageType);
        EnsureDirectoryExists(destDir);
        var destPath = Path.Combine(destDir, destFileName);

        File.Move(sourcePath, destPath);

        var newKey = Path.Combine(storageType, destFileName);

        if (_metadataStore != null)
        {
            using var fs = new FileStream(destPath, FileMode.Open, FileAccess.Read, FileShare.Read);
            var hash = await ComputeHashAsync(fs);
            var fi = new FileInfo(destPath);
            var meta = new Neuro.Storage.Models.FileMetadata
            {
                Key = newKey,
                FileName = Path.GetFileName(destPath),
                Path = destPath,
                Size = fi.Length,
                CreatedAt = fi.CreationTimeUtc,
                UpdatedAt = fi.LastWriteTimeUtc,
                Hash = hash,
                ContentText = TryReadTextPreview(destPath, _indexingOptions.MaxContentBytes)
            };

            await _metadataStore.SaveAsync(meta);
            // remove old metadata
            await _metadataStore.DeleteAsync(sourceKey);
        }

        return newKey;
    }

    public async Task<string> SaveAsync(Stream content, string? fileName = null, StorageTypeEnum storageType = StorageTypeEnum.Temporary)
    {
        var typePath = GetFullPath(storageType);
        fileName ??= Guid.NewGuid().ToString();
        var fullPath = Path.Combine(typePath, fileName);
        using (var fileStream = new FileStream(fullPath, FileMode.Create, FileAccess.Write))
        {
            await content.CopyToAsync(fileStream);
        }

        var key = Path.Combine(storageType.ToString(), fileName);

        if (_metadataStore != null)
        {
            using var fs = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
            var hash = await ComputeHashAsync(fs);
            var fi = new FileInfo(fullPath);
            var meta = new Neuro.Storage.Models.FileMetadata
            {
                Key = key,
                FileName = fileName,
                Path = fullPath,
                Size = fi.Length,
                CreatedAt = fi.CreationTimeUtc,
                UpdatedAt = fi.LastWriteTimeUtc,
                Hash = hash,
                ContentText = TryReadTextPreview(fullPath, _indexingOptions.MaxContentBytes)
            };

            await _metadataStore.SaveAsync(meta);

            if (_indexingQueue != null && meta.ContentText != null)
            {
                await _indexingQueue.EnqueueAsync(meta.Key, meta.ContentText);
            }
        }
        else if (_scopeFactory != null)
        {
            using var scope = _scopeFactory.CreateScope();
            var store = scope.ServiceProvider.GetService<IFileMetadataStore>();
            if (store != null)
            {
                using var fs = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
                var hash = await ComputeHashAsync(fs);
                var fi = new FileInfo(fullPath);
                var meta = new Neuro.Storage.Models.FileMetadata
                {
                    Key = key,
                    FileName = fileName,
                    Path = fullPath,
                    Size = fi.Length,
                    CreatedAt = fi.CreationTimeUtc,
                    UpdatedAt = fi.LastWriteTimeUtc,
                    Hash = hash,
                    ContentText = TryReadTextPreview(fullPath, _indexingOptions.MaxContentBytes)
                };

                await store.SaveAsync(meta);

                if (_indexingQueue != null && meta.ContentText != null)
                {
                    await _indexingQueue.EnqueueAsync(meta.Key, meta.ContentText);
                }
            }
        }

        return key;
    }

    private static async Task<string> ComputeHashAsync(Stream s)
    {
        s.Position = 0;
        using var sha = SHA256.Create();
        var hash = await sha.ComputeHashAsync(s);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private string? TryReadTextPreview(string fullPath, int maxBytes)
    {
        try
        {
            var ext = Path.GetExtension(fullPath).ToLowerInvariant();
            // naive text file check
            var textExt = new[] { ".txt", ".md", ".csv", ".json", ".xml", ".html", ".htm" };
            if (!textExt.Contains(ext)) return null;

            var content = File.ReadAllText(fullPath, Encoding.UTF8);
            if (content.Length > maxBytes) return content.Substring(0, maxBytes);
            return content;
        }
        catch
        {
            return null;
        }
    }

    // Explicit interface implementations to satisfy compiler in all resolution cases
    Task<Stream> IFileStorage.GetAsync(string key) => GetAsync(key);
    Task<bool> IFileStorage.ExistsAsync(string key) => ExistsAsync(key);
    Task<long> IFileStorage.GetFileSizeAsync(string key) => GetFileSizeAsync(key);
}
