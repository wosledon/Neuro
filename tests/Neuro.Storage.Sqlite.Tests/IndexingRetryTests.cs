using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Neuro.Storage;
using Neuro.Storage.Indexing;
using Neuro.Storage.Abstractions;
using Xunit;

namespace Neuro.Storage.Sqlite.Tests
{
    public class IndexingRetryTests
    {
        class FlakyIndexer : IFileContentIndexer
        {
            private readonly int _failures;
            public int Calls { get; private set; }

            public FlakyIndexer(int failures)
            {
                _failures = failures;
            }

            public Task IndexContentAsync(string key, string? content)
            {
                Calls++;
                if (Calls <= _failures) throw new Exception("fail");
                return Task.CompletedTask;
            }
        }

        [Fact]
        public async Task HostedService_Retries_OnFailure()
        {
            var queue = new FileIndexingQueue(10);
            var indexer = new FlakyIndexer(failures: 2);
            var opts = Microsoft.Extensions.Options.Options.Create(new IndexingOptions { RetryCount = 3, RetryDelayMs = 1 });
            var logger = NullLogger<FileIndexingHostedService>.Instance;
            var svc = new FileIndexingHostedService(queue, indexer, logger, opts);

            var cts = new CancellationTokenSource();
            var task = svc.StartAsync(cts.Token);

            await queue.EnqueueAsync("k1", "content");

            // wait until indexer succeeds or timeout
            var sw = System.Diagnostics.Stopwatch.StartNew();
            while (sw.Elapsed < TimeSpan.FromSeconds(2))
            {
                if (indexer.Calls > 2) break;
                await Task.Delay(10);
            }

            cts.Cancel();
            await svc.StopAsync(CancellationToken.None);

            Assert.True(indexer.Calls >= 3);
        }
    }
}