# Copilot / AI 代理 使用指南 — Neuro ✅

目的：为 AI 编码代理提供简洁、可直接执行的指导，帮助快速在此仓库中开展工作。

## 速查表（精简） ⚡

快速参考：需要 **.NET 10 SDK**；构建 `dotnet build Neuro.slnx`；运行 API `cd src/Neuro.Api && dotnet run`（默认 SQLite `Data Source=neuro.db`）；运行测试 `dotnet test`，向量化器模型需先 `git lfs pull` 获取 `models/bert_Opset18.onnx`（缺失时相关测试会跳过）；关键实现文件：`src/Neuro.Vectorizer/OnnxVectorizer.cs`、`src/Neuro.Tokenizer/TiktokenTokenizerAdapter.cs`、`src/Neuro.EntityFrameworkCore/NeuroDbContext.cs`、`src/Neuro.Vector/Providers/VectorStoreFactory.cs`。

## 总览 🔧

- Neuro 是一组小而专注的 .NET 库（C#），设计为可组合的模块：
  - `Neuro.Api` — 示例的 ASP.NET Core 主机 / API（入口：`Program.cs`，控制器在 `Controllers/` 下）。
  - `Neuro.Vector` — 向量存储抽象与提供者（见 `Abstractions/`、`Providers/`、`Stores/`、`Extensions/`）。
  - `Neuro.Vectorizer` — 基于 ONNX 的向量化器（实现：`OnnxVectorizer`，默认模型 `models/bert_Opset18.onnx`）。
  - `Neuro.Tokenizer` — 包装 `Microsoft.ML.Tokenizers` 的分词器适配器（`TiktokenTokenizerAdapter`）。
  - `Neuro.Document` — 文档到 Markdown 的转换器（`IDocumentConverter`、`NeuroConverter`）。

## 关键设计模式与约定 🧭

- 通过小型扩展方法进行依赖注入（DI），例如 `AddVectorStore`、`AddVectorStoreProvider`、`TokenizerExtensions`、`VectorizerExtensions`（查看 `src/*/Extensions`）。
- 提供者工厂模式：使用 `VectorStoreFactory.RegisterProvider` 注册提供者，用 `VectorStoreFactory.Create(...)` 构建（参考 `src/Neuro.Vector/Providers/VectorStoreFactory.cs`）。示例：
  - 注册提供者：`VectorStoreFactory.RegisterProvider("my", (sp, opts) => new MyStore(opts));`
  - 通过 DI 辅助注册：`services.AddVectorStoreProvider("my", sp => new MyStore());`
- 实体发现与过滤：`DbContextExtensions.RegisterEntity` 会扫描程序集并为实现 `ISoftDeleteEntity` 的实体自动添加 **软删除** 查询过滤器，为实现 `ITenantEntity` 的实体添加租户过滤器（查看 `src/Neuro.EntityFrameworkCore/Extensions/DbContextExtensions.cs`）。
- 审计与软删除：`NeuroDbContext.ApplyAuditingRules()` 在 `SaveChanges` 时设置创建/更新元数据，并将删除转换为软删除；同时会阻止对 `IReadOnlyEntity` 的修改（查看 `src/Neuro.EntityFrameworkCore/NeuroDbContext.cs`）。
- 自动初始化数据库：`AutoInitDatabase<TDbContext>(reset = false)` 使用 `EnsureCreated()`（默认不使用 EF Migrations）。该扩展方法可在应用启动时调用，示例在 `Program.cs` 中被注释掉以示谨慎。
- 代码库中包含中文注释/消息：新代码在 XML 注释或异常消息中使用中文是被接受并推荐的，以保持一致性。

## 构建、运行与测试 ⚙️

- 要求：**.NET 10 SDK**（项目目标 `net10.0`）。可通过 `dotnet --version` 验证。
- 构建：`dotnet build Neuro.slnx`（或在仓库根目录直接运行 `dotnet build`）。
- 运行示例 API：
  - `cd src/Neuro.Api && dotnet run`
  - 默认数据库为 SQLite（`Data Source=neuro.db`），在 `Program.cs` 中通过 `builder.AddSqlite<NeuroDbContext>("Data Source=neuro.db")` 配置。
  - 鉴权：JWT 配置读取 `Jwt` 配置节，缺省时会回退到开发用的默认密钥。
- 测试：在仓库根目录运行 `dotnet test`，也可指定单个测试项目（例如 `dotnet test tests/Neuro.Vector.Tests`）。
  - 向量化器测试依赖较大的 ONNX 模型文件（由 Git LFS 管理）。在运行 `tests/Neuro.Vectorizer.Tests` 前请执行 `git lfs pull` 获取模型，否则相关测试会被静默跳过（测试会尝试多个候选路径）。
  - 运行单个测试示例：`dotnet test --filter "FullyQualifiedName~VectorizerTests.Embed_Returns_NonEmpty_WhenModelPresent"`

## 项目特定注意事项 ⚠️

- 分词器：`TiktokenTokenizerAdapter` 使用 `EncodingName` 创建编码器，**不支持**通过 `EncodingFilePath` 指定本地编码文件（若设置会抛出异常）。参见 `src/Neuro.Tokenizer/TiktokenTokenizerAdapter.cs`。
- 向量化器（`OnnxVectorizer`）：默认 `ModelPath = "models/bert_Opset18.onnx"`。实现会读取模型的输入/输出元数据并使用一套启发式规则来选取 embedding（优先 pooled 输出 → 最后一层 hidden 的均值池化 → 任意 float 张量并展平）。在引入新模型时请参考 `src/Neuro.Vectorizer/OnnxVectorizer.cs`。
- 向量存储的 DI 支持两种模式：**命名提供者**（`ProviderName` + `ProviderOptions`）或 **ProviderFactory**（注入 `Func<IServiceProvider, IVectorStore>`）。参见 `src/Neuro.Vector/Extensions/VectorStoreExtensions.cs`。
- 数据库初始化：`AutoInitDatabase` 使用 `EnsureCreated()`（不会运行迁移）。若需要迁移机制，请使用 `SqliteExtensions.ApplyMigrations` 或手动管理迁移（查看 `src/Neuro.Storage.Sqlite/SqliteExtensions.cs`）。

## 如何修改 / 添加功能 ✍️

- 添加向量存储：实现提供者并通过 `VectorStoreFactory.RegisterProvider` 注册，同时提供 `AddVectorStoreProvider(...)` 的 DI 辅助方法。
- 添加分词器 / 向量化器：实现接口 `ITokenizer` / `IVectorizer`，并在相应的 `*Extensions` 中添加注册方法（记得添加单元测试到 `tests/`）。
- 添加文档转换器：实现 `IDocumentConverter` 并确保 `NeuroConverter` 能发现或通过配置使用该实现。

## 关键文件索引 📁

- DI 与提供者模式：`src/Neuro.Vector/Extensions/VectorStoreExtensions.cs`、`src/Neuro.Vector/Providers/VectorStoreFactory.cs`
- ONNX 向量化器实现：`src/Neuro.Vectorizer/OnnxVectorizer.cs`
- 分词器适配器：`src/Neuro.Tokenizer/TiktokenTokenizerAdapter.cs`
- EF 约定与过滤器：`src/Neuro.EntityFrameworkCore/Extensions/DbContextExtensions.cs`、`src/Neuro.EntityFrameworkCore/NeuroDbContext.cs`
- 示例 API 启动：`src/Neuro.Api/Program.cs`

---

如果需要，我可以额外提交一个示例 PR：包含（1）新增向量存储提供者的单元测试骨架，和（2）在 DI 中注册该提供者的 CodeAction。是否需要我继续准备该 PR？ 💡
