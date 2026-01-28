using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Neuro.Storage;
using Neuro.Storage.Indexing;
using Neuro.Storage.Abstractions;
using Xunit;

namespace Neuro.Storage.Sqlite.Tests
{
    public class IndexingConcurrentTests
    {
        class CountingIndexer : IFileContentIndexer
        {
            private int _count;
            public int Count => _count;

            public Task IndexContentAsync(string key, string? content)
            {
                Interlocked.Increment(ref _count);
                // simulate some work
                return Task.Delay(5);
            }
        }

        [Fact]
        public async Task HostedService_Processes_All_Enqueued_Items_From_Concurrent_Producers()
        {
            var services = new ServiceCollection();
            var db = "Data Source=:memory:";
            services.AddSqliteFileStore(o => o.ConnectionString = db, idx => idx.ChannelCapacity = 1000);

            var sp = services.BuildServiceProvider();
            var queue = sp.GetRequiredService<IFileIndexingQueue>();
            var indexer = new CountingIndexer();
            var logger = NullLogger<FileIndexingHostedService>.Instance;
            var opts = Microsoft.Extensions.Options.Options.Create(new IndexingOptions { RetryCount = 1, RetryDelayMs = 1 });
            var svc = new FileIndexingHostedService(queue, indexer, logger, opts);

            var cts = new CancellationTokenSource();
            await svc.StartAsync(cts.Token);

            var tasks = new List<Task>();
            var total = 200;
            for (int p = 0; p < 10; p++)
            {
                tasks.Add(Task.Run(async () =>
                {
                    for (int i = 0; i < total / 10; i++)
                    {
                        await queue.EnqueueAsync(Guid.NewGuid().ToString(), "data");
                    }
                }));
            }

            await Task.WhenAll(tasks);

            // wait until processed
            var sw = System.Diagnostics.Stopwatch.StartNew();
            while (indexer.Count < total && sw.Elapsed < TimeSpan.FromSeconds(5))
            {
                await Task.Delay(20);
            }

            cts.Cancel();
            await svc.StopAsync(CancellationToken.None);

            Assert.Equal(total, indexer.Count);
        }
    }
}