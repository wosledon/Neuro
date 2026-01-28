using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Neuro.Storage
{
    public class FileIndexingHostedService : BackgroundService
    {
        private readonly IFileIndexingQueue _queue;
        private readonly IFileContentIndexer _indexer;
        private readonly ILogger<FileIndexingHostedService> _logger;
        private readonly IndexingOptions _options;

        public FileIndexingHostedService(IFileIndexingQueue queue, IFileContentIndexer indexer, ILogger<FileIndexingHostedService> logger, IOptions<IndexingOptions> options)
        {
            _queue = queue;
            _indexer = indexer;
            _logger = logger;
            _options = options.Value;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("FileIndexingHostedService started");

            await foreach (var item in _queue.Reader.ReadAllAsync(stoppingToken))
            {
                var attempt = 0;
                while (true)
                {
                    try
                    {
                        attempt++;
                        await _indexer.IndexContentAsync(item.key, item.content);
                        break; // success
                    }
                    catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                    {
                        break;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Indexing failed for {key}, attempt {attempt}", item.key, attempt);
                        if (attempt >= Math.Max(1, _options.RetryCount))
                        {
                            _logger.LogWarning("Giving up indexing {key} after {attempt} attempts", item.key, attempt);
                            break;
                        }

                        await Task.Delay(_options.RetryDelayMs * attempt, stoppingToken);
                    }
                }
            }

            _logger.LogInformation("FileIndexingHostedService stopping");
        }
    }
}