using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Neuro.Vector;
using Xunit;

namespace Neuro.Vector.Tests;

public class DIRegistrationTests
{
    private class DummyStore : IVectorStore
    {
        public int Count => 0;

        public Task UpsertAsync(IEnumerable<VectorRecord> records, System.Threading.CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<IEnumerable<VectorRecord>> GetAsync(IEnumerable<string> ids, System.Threading.CancellationToken cancellationToken = default) => Task.FromResult((IEnumerable<VectorRecord>)new List<VectorRecord>());
        public Task DeleteAsync(IEnumerable<string> ids, System.Threading.CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<IEnumerable<(VectorRecord Record, float Score)>> QueryAsync(float[] queryEmbedding, int topK = 10, float minScore = -1f, System.Threading.CancellationToken cancellationToken = default) => Task.FromResult((IEnumerable<(VectorRecord, float)>)new List<(VectorRecord, float)>());
        public Task SaveAsync(string? path = null, System.Threading.CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task LoadAsync(string? path = null, System.Threading.CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    [Fact]
    public void AddVectorStore_RegistersStoreFromRegisteredProvider()
    {
        var services = new ServiceCollection();
        services.AddVectorStoreProvider("dummy", sp => new DummyStore());
        services.AddVectorStore(o => { o.ProviderName = "dummy"; });

        var sp = services.BuildServiceProvider();
        var store = sp.GetRequiredService<IVectorStore>();
        Assert.IsType<DummyStore>(store);
    }

    [Fact]
    public void AddVectorStore_RegistersStoreFromFactoryOption()
    {
        var services = new ServiceCollection();
        services.AddVectorStore(o => { o.ProviderFactory = sp => new DummyStore(); });
        var sp = services.BuildServiceProvider();
        var store = sp.GetRequiredService<IVectorStore>();
        Assert.IsType<DummyStore>(store);
    }

    [Fact]
    public void HostBuilder_AddVectorStore_Works()
    {
        var hostBuilder = Host.CreateApplicationBuilder();
        hostBuilder.Services.AddVectorStoreProvider("dummy", sp => new DummyStore());
        hostBuilder.AddVectorStore(o => { o.ProviderName = "dummy"; });
        var host = hostBuilder.Build();
        var store = host.Services.GetRequiredService<IVectorStore>();
        Assert.IsType<DummyStore>(store);
    }
}