using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Neuro.Storage;
using Neuro.Storage.Indexing;
using Neuro.Storage.Abstractions;
using Xunit;

namespace Neuro.Storage.Sqlite.Tests
{
    public class IndexingQueueTests
    {
        [Fact]
        public async Task Queue_RespectsCapacity_DropsOldest()
        {
            var services = new ServiceCollection();
            services.AddSqliteFileStore(o => o.ConnectionString = "Data Source=:memory:", idx => idx.ChannelCapacity = 2);
            var sp = services.BuildServiceProvider();

            var queue = sp.GetRequiredService<IFileIndexingQueue>();

            await queue.EnqueueAsync("k1", "v1");
            await queue.EnqueueAsync("k2", "v2");
            await queue.EnqueueAsync("k3", "v3"); // should drop oldest (k1)

            var reader = queue.Reader;
            var items = new System.Collections.Generic.List<(string, string?)>();

            while (reader.TryRead(out var item))
            {
                items.Add(item);
            }

            Assert.True(items.Count <= 2);
            Assert.DoesNotContain(items, i => i.Item1 == "k1");
        }
    }
}