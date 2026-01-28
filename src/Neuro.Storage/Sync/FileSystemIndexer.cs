using System;
using System.IO;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Neuro.Storage.Models;
using Neuro.Storage.Abstractions;
using Neuro.Storage.Options;

namespace Neuro.Storage.Sync
{
    public class FileSystemIndexer : BackgroundService
    {
        private readonly IFileMetadataStore _store;
        private readonly FileStorageOptions _options;
        private readonly IFileStorage _storage;
        private readonly ILogger<FileSystemIndexer> _logger;
        private FileSystemWatcher? _watcher;

        public FileSystemIndexer(IFileMetadataStore store, IOptions<FileStorageOptions> options, IFileStorage storage, ILogger<FileSystemIndexer> logger)
        {
            _store = store;
            _options = options.Value;
            _storage = storage;
            _logger = logger;
        }

        private string GetRootPath()
        {
            var p = _options.PathBase;
            return Path.IsPathRooted(p) ? p : Path.Combine(AppContext.BaseDirectory, p);
        }

        protected override Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var root = GetRootPath();
            _logger.LogInformation("Starting FileSystemIndexer for {root}", root);

            if (!Directory.Exists(root)) Directory.CreateDirectory(root);

            // initial scan - best-effort
            Task.Run(() => InitialScan(root), stoppingToken);

            _watcher = new FileSystemWatcher(root)
            {
                IncludeSubdirectories = true,
                EnableRaisingEvents = true,
            };

            _watcher.Created += async (_, e) => await HandleCreatedOrChanged(e.FullPath);
            _watcher.Changed += async (_, e) => await HandleCreatedOrChanged(e.FullPath);
            _watcher.Deleted += async (_, e) => await HandleDeleted(e.FullPath);

            return Task.CompletedTask;
        }

        private async Task InitialScan(string root)
        {
            try
            {
                foreach (var file in Directory.EnumerateFiles(root, "*", SearchOption.AllDirectories))
                {
                    await HandleCreatedOrChanged(file);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Initial scan failed");
            }
        }

        private string KeyFromPath(string fullPath)
        {
            var root = GetRootPath();
            var rel = Path.GetRelativePath(root, fullPath);
            return rel.Replace(Path.DirectorySeparatorChar, Path.DirectorySeparatorChar);
        }

        private async Task HandleCreatedOrChanged(string fullPath)
        {
            try
            {
                if (!File.Exists(fullPath)) return;

                var fi = new FileInfo(fullPath);
                using var fs = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);

                var contentText = ExtractTextPreview(fs);
                fs.Position = 0;
                var hash = await ComputeHashAsync(fs);

                var key = KeyFromPath(fullPath);

                var meta = new FileMetadata
                {
                    Key = key,
                    FileName = Path.GetFileName(fullPath),
                    Path = fullPath,
                    Size = fi.Length,
                    CreatedAt = fi.CreationTimeUtc,
                    UpdatedAt = fi.LastWriteTimeUtc,
                    Hash = hash,
                    ContentText = contentText
                };

                await _store.SaveAsync(meta);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to index file {path}", fullPath);
            }
        }

        private async Task HandleDeleted(string fullPath)
        {
            try
            {
                var key = KeyFromPath(fullPath);
                await _store.DeleteAsync(key);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to remove index for {path}", fullPath);
            }
        }

        private string? ExtractTextPreview(Stream s, int maxBytes = 64 * 1024)
        {
            try
            {
                s.Position = 0;
                using var ms = new MemoryStream();
                var buffer = new byte[8192];
                var total = 0;
                int read;
                while ((read = s.Read(buffer, 0, buffer.Length)) > 0 && total < maxBytes)
                {
                    ms.Write(buffer, 0, read);
                    total += read;
                }

                var bytes = ms.ToArray();
                // quick heuristic: try utf8
                var text = Encoding.UTF8.GetString(bytes);
                return text;
            }
            catch
            {
                return null;
            }
        }

        private static async Task<string> ComputeHashAsync(Stream s)
        {
            s.Position = 0;
            using var sha = System.Security.Cryptography.SHA256.Create();
            var hash = await sha.ComputeHashAsync(s);
            return Convert.ToHexString(hash).ToLowerInvariant();
        }
    }
}