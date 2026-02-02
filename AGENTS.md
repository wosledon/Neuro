# AI 代理使用说明（AGENTS）

本文档面向自动化编码代理（CI/AI 助手、Copilot 风格代理等），提供在本仓库中快速、安全、可复现地开展工作的要点与约定。

核心目标
- 让代理在修改代码前能快速定位：如何构建、运行单元测试、模型依赖、关键扩展点与常见坑。

快速启动（必须核验）
- 要求：.NET 10 SDK（项目目标 net10.0）。验证：`dotnet --version`
- 构建：`dotnet build Neuro.slnx`
- 运行示例 API：
  - `cd src/Neuro.Api && dotnet run`
  - 默认使用 SQLite（数据库文件：`neuro.db`）
- 测试：`dotnet test`（可指定单个测试项目）
- 模型依赖：向量化器使用的 ONNX 模型由 Git LFS 管理，运行相关测试或功能前请执行：

```bash
git lfs pull
```

重要模式与热点文件（代理优先阅读）
- 依赖注入 / 提供者：`src/Neuro.Vector/Extensions/VectorStoreExtensions.cs`、`src/Neuro.Vector/Providers/VectorStoreFactory.cs`
- ONNX 向量化器：`src/Neuro.Vectorizer/OnnxVectorizer.cs`（模型加载、输入/输出启发式规则）
- 分词器适配器：`src/Neuro.Tokenizer/TiktokenTokenizerAdapter.cs`（仅支持 `EncodingName`）
- EF 约定与审计：`src/Neuro.EntityFrameworkCore/Extensions/DbContextExtensions.cs`（实体注册、软删除、租户过滤）和 `src/Neuro.EntityFrameworkCore/NeuroDbContext.cs`（审计、软删行为）

常见任务与实现位置
- 新增向量存储提供者：
  - 在 `VectorStoreFactory.RegisterProvider` 注册提供者。
  - 提供 DI 辅助方法（`services.AddVectorStoreProvider("name", sp => new MyStore())`）。
- 新增分词器 / 向量化器：实现 `ITokenizer` / `IVectorizer`，并添加到相应的 `*Extensions` 注册点。
- 添加文档转换器：实现 `IDocumentConverter` 并确保 `NeuroConverter` 可发现或通过配置使用它。

项目约定与注意事项（务必遵守）
- 代码库已有中文注释/消息，新代码中在 XML 注释或异常消息使用中文是被接受且推荐的。
- `TiktokenTokenizerAdapter` 不支持通过 `EncodingFilePath` 加载本地编码，会抛出异常。
- `OnnxVectorizer` 会根据模型元数据选择 embedding 输出（优先 pooled，再尝试 last_hidden 的 mean pooling，最后取任意 float 张量并展平）。引入新模型时请参考该实现并添加必要的兼容逻辑。
- 数据库自动初始化使用 `EnsureCreated()`（`AutoInitDatabase<TDbContext>`），仓库默认未启用迁移流程；若需要迁移请使用 `SqliteExtensions.ApplyMigrations` 或显式添加迁移脚本。
- `NeuroDbContext.ApplyAuditingRules()` 会把删除转换为软删除并阻止对 `IReadOnlyEntity` 的修改，修改实体行为前请阅读该方法。

测试与 CI 建议
- 在修改 API、EF、或核心库前，先运行相关单元测试：

```bash
dotnet test tests/Neuro.Vector.Tests
dotnet test tests/Neuro.Vectorizer.Tests
```

- 向量化器测试可能因缺少模型而被跳过；确保在包含模型的环境下执行完整测试。

提交与 PR 指南（代理行为准则）
- 修改需保持对公共 API 的兼容性；若必须破坏兼容性，请：
  1) 在 PR 描述里明确列出破坏点与迁移建议；
  2) 更新/添加单元测试覆盖新行为。
- PR 必包含：变更说明、受影响模块、如何在本地验证（构建/运行/测试命令）。

安全与边界
- 不要在自动变更中替换或上传大型二进制模型文件；只在 PR 中引用模型来源并在 CI 中使用 `git lfs pull`。
- 不要假设数据库存在或包含生产数据；任何对 DB 的破坏性操作（EnsureDeleted、迁移回滚）必须在 PR 中显式标注并在隔离环境执行。

询问与迭代
- 对于模糊或高风险更改（例如更换 ONNX 模型、修改实体基类、调整审计/软删除规则），请在 PR 中请求人工 code review，并附上回归测试。
