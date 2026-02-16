using System.Collections.Generic;
using System.Threading.Tasks;
using Neuro.Vector;
using Xunit;

namespace Neuro.Vector.Tests;

public class ProviderRegistrationTests
{
    private class DummyStore : IVectorStore
    {
        public string Name { get; }
        public int Count => 0;

        public DummyStore(string name) => Name = name;
        public Task UpsertAsync(IEnumerable<VectorRecord> records, System.Threading.CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<IEnumerable<VectorRecord>> GetAsync(IEnumerable<string> ids, System.Threading.CancellationToken cancellationToken = default) => Task.FromResult((IEnumerable<VectorRecord>)new List<VectorRecord>());
        public Task DeleteAsync(IEnumerable<string> ids, System.Threading.CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<IEnumerable<(VectorRecord Record, float Score)>> QueryAsync(float[] queryEmbedding, int topK = 10, float minScore = -1f, System.Threading.CancellationToken cancellationToken = default) => Task.FromResult((IEnumerable<(VectorRecord, float)>)new List<(VectorRecord, float)>());
        public Task SaveAsync(string? path = null, System.Threading.CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task LoadAsync(string? path = null, System.Threading.CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    [Fact]
    public void RegisterAndCreateProvider_Works()
    {
        var providerName = "dummy-provider";
        VectorStoreFactory.RegisterProvider(providerName, opts => new DummyStore(providerName));
        Assert.True(VectorStoreFactory.IsProviderRegistered(providerName));

        var store = VectorStoreFactory.Create(providerName);
        Assert.IsType<DummyStore>(store);

        // cleanup
        VectorStoreFactory.UnregisterProvider(providerName);
        Assert.False(VectorStoreFactory.IsProviderRegistered(providerName));
    }
}
