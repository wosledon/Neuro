# Neuro.Vector

一个小型的本地向量存储，提供清晰且易于扩展的接口，便于在本地或后续接入远程向量数据库。

主要特性：
- 基于内存的向量存储，使用暴力余弦相似度检索（Brute-force cosine similarity）
- 简单的 JSON 持久化（保存/加载）
- 可扩展的 `IVectorStore` 抽象，方便集成第三方或远程向量数据库适配器
- 使用 `VectorStoreFactory` 管理提供者（Provider），支持自定义注册

使用示例：
```csharp
using Neuro.Vector;

var store = VectorStoreFactory.CreateLocal();
await store.UpsertAsync(new[] { new VectorRecord("id1", new float[] { 0.1f, 0.2f }) });
var results = await store.QueryAsync(new float[] { 0.1f, 0.2f }, topK: 5);
```

说明：
- 内置实现包括 `LocalVectorStore`（基于并发字典）和 `LockFreeVectorStore`（基于不可变字典的无锁实现）。
- `LocalVectorStore` 提供一致性模式配置（`Snapshot`/`Strict`）以平衡并发和保存时的排他性。
- 若需接入自定义提供者，请使用 `VectorStoreFactory.RegisterProvider` 或在依赖注入中调用 `AddVectorStoreProvider`。

ASP.NET Core 使用：

- 通过依赖注入注册（Program.cs 示例）：

```csharp
var builder = WebApplication.CreateBuilder(args);

// 方式一：通过 ProviderName 使用内置提供者（内置了 "local" 与 "lockfree"）
builder.Services.AddVectorStore(o => { o.ProviderName = "local"; });

// 方式二：直接提供工厂，便于使用其它服务来配置提供者
// builder.Services.AddVectorStore(o => { o.ProviderFactory = sp => new LocalVectorStore(); });

// 方式三：注册自定义提供者供后续按名称使用
// builder.Services.AddVectorStoreProvider("my-provider", sp => new MyProvider(sp.GetRequiredService<IMyDependency>()));

var app = builder.Build();
app.MapControllers();
app.Run();
```

- 在控制器中注入并使用 `IVectorStore`：

```csharp
[ApiController]
[Route("api/[controller]")]
public class VectorsController : ControllerBase
{
    private readonly IVectorStore _store;

    public VectorsController(IVectorStore store)
    {
        _store = store;
    }

    [HttpPost("upsert")]
    public async Task<IActionResult> Upsert([FromBody] IEnumerable<VectorRecord> records)
    {
        await _store.UpsertAsync(records);
        return Ok();
    }

    [HttpPost("query")]
    public async Task<IActionResult> Query([FromBody] float[] queryEmbedding, [FromQuery] int topK = 10)
    {
        var res = await _store.QueryAsync(queryEmbedding, topK);
        return Ok(res);
    }
}
```

- 配置来自 appsettings.json（示例）：

```json
{
  "VectorStore": {
    "ProviderName": "local"
  }
}
```

可以在 `Program.cs` 中读取配置并设置：

```csharp
builder.Services.AddVectorStore(o => { o.ProviderName = builder.Configuration["VectorStore:ProviderName"]; });
```

开发与贡献：
- 仓库中的注释与异常信息均为中文，便于国内团队阅读与维护。
- 建议按功能将代码组织成 `Abstractions`、`Providers`、`Stores`、`Extensions` 等子目录以方便扩展。
- 详细的目录规范见 `docs/STRUCTURE.md`。
