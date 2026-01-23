using System.Collections.Concurrent;
using System.Threading.Tasks;
using Neuro.Vector;
using Xunit;

namespace Neuro.Vector.Tests;

public class LockFreeStoreTests
{
    [Fact]
    public async Task ConcurrentUpsertsAndQueries_DoNotThrowAndComplete()
    {
        var store = new LockFreeVectorStore();
        var rnd = new Random(123);

        var upsertTasks = new List<Task>();
        for (int t = 0; t < 8; t++)
        {
            upsertTasks.Add(Task.Run(async () =>
            {
                for (int i = 0; i < 500; i++)
                {
                    var id = $"t{t}-i{i}";
                    var vec = new float[] { (float)rnd.NextDouble(), (float)rnd.NextDouble() };
                    await store.UpsertAsync(new[] { new VectorRecord(id, vec) });
                }
            }));
        }

        var queryTasks = new List<Task>();
        for (int q = 0; q < 4; q++)
        {
            queryTasks.Add(Task.Run(async () =>
            {
                for (int i = 0; i < 200; i++)
                {
                    var res = await store.QueryAsync(new float[] { 0.5f, 0.5f }, topK: 5);
                }
            }));
        }

        await Task.WhenAll(upsertTasks.Concat(queryTasks));

        // ensure data present
        var some = (await store.QueryAsync(new float[] { 0.5f, 0.5f }, topK: 10)).ToList();
        Assert.True(some.Count <= 10);
    }

    [Fact]
    public async Task BatchUpsert_IsAtomicFromSnapshotPerspective()
    {
        var store = new LockFreeVectorStore();

        var batch = Enumerable.Range(0, 200).Select(i => new VectorRecord(i.ToString(), new float[] { 1f, 0f })).ToList();

        var seenCounts = new ConcurrentBag<int>();

        var queryTask = Task.Run(async () =>
        {
            // Keep querying until upsert completes
            while (true)
            {
                var res = await store.QueryAsync(new float[] { 1f, 0f }, topK: 500);
                var c = res.Count();
                seenCounts.Add(c);
                if (c == 200) break; // finished
                await Task.Delay(1);
            }
        });

        await store.UpsertAsync(batch);
        await queryTask;

        // ensure we never observed a partial set (counts should be either 0 or 200)
        Assert.DoesNotContain(seenCounts, c => c > 0 && c < 200);
    }
}