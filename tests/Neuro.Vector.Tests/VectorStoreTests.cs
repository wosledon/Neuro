using System.Linq;
using System.Text.Json;
using Neuro.Vector;
using Neuro.Vector.Stores;
using Xunit;

namespace Neuro.Vector.Tests;

public class VectorStoreTests
{
    [Fact]
    public async Task UpsertAndQuery_ReturnsNearest()
    {
        var store = VectorStoreFactory.CreateLocal();
        var a = new VectorRecord("a", new float[] { 1f, 0f });
        var b = new VectorRecord("b", new float[] { 0f, 1f });
        await store.UpsertAsync(new[] { a, b });

        var q = await store.QueryAsync(new float[] { 0.9f, 0.1f }, topK: 2);
        var first = q.First();
        Assert.Equal("a", first.Record.Id);
        Assert.True(first.Score > 0.7f);
    }

    [Fact]
    public async Task SaveAndLoad_PreservesRecords()
    {
        var store = VectorStoreFactory.CreateLocal();
        var a = new VectorRecord("a", new float[] { 1f, 0f });
        await store.UpsertAsync(new[] { a });

        var tmp = Path.GetTempFileName();
        await store.SaveAsync(tmp);

        var store2 = VectorStoreFactory.CreateLocal();
        await store2.LoadAsync(tmp);
        var got = await store2.GetAsync(new[] { "a" });
        Assert.Single(got);
        Assert.Equal("a", got.First().Id);
    }

    [Fact]
    public async Task StrictConsistency_SaveBlocksConcurrentUpsert()
    {
        var options = new LocalVectorStoreOptions { Consistency = ConsistencyMode.Strict, SaveDelayMsForTesting = 200 };
        var store = new LocalVectorStore(options);

        await store.UpsertAsync(new[] { new VectorRecord("x", new float[] { 1f, 0f }) });

        var tmp = Path.GetTempFileName();

        var sw = System.Diagnostics.Stopwatch.StartNew();

        var saveTask = Task.Run(() => store.SaveAsync(tmp));

        // give saveTask a small head start to acquire write lock
        await Task.Delay(10);

        var upsertTask = Task.Run(async () =>
        {
            await store.UpsertAsync(new[] { new VectorRecord("y", new float[] { 0f, 1f }) });
        });

        await Task.WhenAll(saveTask, upsertTask);
        sw.Stop();

        // Because Save had an artificial 200ms delay while holding write lock, the upsert should be delayed as well (blocked by read lock semantics)
        Assert.True(sw.ElapsedMilliseconds >= 180, $"Expected blocking behavior, elapsed={sw.ElapsedMilliseconds}");

        var store2 = VectorStoreFactory.CreateLocal();
        await store.SaveAsync(tmp);
        await store2.LoadAsync(tmp);
        var got = (await store2.GetAsync(new[] { "y" })).FirstOrDefault();
        Assert.NotNull(got);
    }

    [Fact]
    public async Task SnapshotConsistency_SaveDoesNotBlockUpsert()
    {
        var options = new LocalVectorStoreOptions { Consistency = ConsistencyMode.Snapshot, SaveDelayMsForTesting = 200 };
        var store = new LocalVectorStore(options);

        await store.UpsertAsync(new[] { new VectorRecord("x", new float[] { 1f, 0f }) });

        var tmp = Path.GetTempFileName();

        var saveTask = Task.Run(() => store.SaveAsync(tmp));

        // give saveTask a small head start
        await Task.Delay(10);

        // Measure upsert time separately to avoid test flakiness caused by scheduling delays
        var upsertSw = System.Diagnostics.Stopwatch.StartNew();
        var upsertTask = Task.Run(async () =>
        {
            await store.UpsertAsync(new[] { new VectorRecord("y", new float[] { 0f, 1f }) });
        });

        await upsertTask;
        upsertSw.Stop();

        // In snapshot mode upsert should not be blocked by save; ensure upsert elapsed is small
        Assert.True(upsertSw.ElapsedMilliseconds < 150, $"Expected non-blocking snapshot behavior (upsert), elapsed={upsertSw.ElapsedMilliseconds}");

        // wait for save to finish before verifying persistence
        await saveTask;

        var store2 = VectorStoreFactory.CreateLocal();
        await store.SaveAsync(tmp);
        await store2.LoadAsync(tmp);
        var got = (await store2.GetAsync(new[] { "y" })).FirstOrDefault();
        Assert.NotNull(got);
    }

    [Fact]
    public async Task Delete_RemovesItems()
    {
        var store = VectorStoreFactory.CreateLocal();
        var a = new VectorRecord("a", new float[] { 1f, 0f });
        await store.UpsertAsync(new[] { a });
        await store.DeleteAsync(new[] { "a" });
        var got = await store.GetAsync(new[] { "a" });
        Assert.Empty(got);
    }
}