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
    public class IndexingGiveUpTests
    {
        class AlwaysFailIndexer : IFileContentIndexer
        {
            private int _calls;
            public int Calls => _calls;
            public Task IndexContentAsync(string key, string? content)
            {
                Interlocked.Increment(ref _calls);
                throw new Exception("fail");
            }
        }

        [Fact]
        public async Task HostedService_GivesUp_After_RetryCount()
        {
            var queue = new FileIndexingQueue(10);
            var indexer = new AlwaysFailIndexer();
            var opts = Microsoft.Extensions.Options.Options.Create(new IndexingOptions { RetryCount = 2, RetryDelayMs = 1 });
            var logger = NullLogger<FileIndexingHostedService>.Instance;
            var svc = new FileIndexingHostedService(queue, indexer, logger, opts);

            var cts = new CancellationTokenSource();
            await svc.StartAsync(cts.Token);

            await queue.EnqueueAsync("k1", "content");

            // wait until processing attempts done or timeout
            var sw = System.Diagnostics.Stopwatch.StartNew();
            while (indexer.Calls < 2 && sw.Elapsed < TimeSpan.FromSeconds(2))
            {
                await Task.Delay(10);
            }

            cts.Cancel();
            await svc.StopAsync(CancellationToken.None);

            Assert.Equal(2, indexer.Calls);
        }
    }
}