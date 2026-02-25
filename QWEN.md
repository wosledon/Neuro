# Neuro - AI 知识库与动态文档生成系统

## 项目概述

**Neuro** 是一个用于构建 AI 驱动知识库并自动生成项目文档的 .NET 多模块解决方案。项目采用模块化设计，包含向量化、分词、向量存储、RAG（检索增强生成）和文档转换等功能组件。

### 核心定位

- **AI 知识库基础设施**：提供可扩展的向量化与向量存储抽象，方便集成不同模型与存储后端
- **动态文档生成**：支持基于代码和知识库自动生成或更新项目文档
- **全栈架构**：包含 .NET 10 后端服务与 React + TypeScript 前端

### 技术栈

| 层级 | 技术 |
|------|------|
| **后端框架** | .NET 10 + ASP.NET Core 10 |
| **ORM** | Entity Framework Core 10 |
| **数据库** | SQLite（默认）、PostgreSQL（可选） |
| **AI/ML** | ONNX Runtime 1.17.0、Microsoft.ML.Tokenizers 2.0.0 |
| **文档处理** | ReverseMarkdown、HtmlAgilityPack、PdfPig、OpenXml SDK |
| **前端** | React 18 + TypeScript + Vite + Tailwind CSS |
| **API 文档** | OpenAPI + Scalar.AspNetCore |
| **认证** | JWT Bearer |

### 项目结构

```
Neuro/
├── src/                          # .NET 源代码模块
│   ├── Neuro.Abstractions/       # 抽象接口和实体基类
│   │   ├── IEntity, IAuditedEntity, ISoftDeleteEntity, ITenantEntity
│   │   └── services/
│   ├── Neuro.Api/                # ASP.NET Core Web API 示例
│   │   ├── Controllers/          # API 控制器
│   │   ├── Entity/               # 数据库实体（User, Permission, Menu）
│   │   ├── Services/             # 业务服务
│   │   ├── Hubs/                 # SignalR Hub（系统状态、聊天、文档生成）
│   │   └── Middlewares/          # 中间件（全局异常处理）
│   ├── Neuro.Document/           # 文档转换器（HTML/PDF/DOCX/RTF → Markdown）
│   ├── Neuro.EntityFrameworkCore/         # EF Core 基础设施
│   │   ├── NeuroDbContext        # 基础 DbContext（自动实体注册、审计规则）
│   │   ├── Extensions/           # 软删除、租户过滤等扩展
│   │   └── Migrations/           # 数据库迁移
│   ├── Neuro.EntityFrameworkCore.NpgSql/  # PostgreSQL 支持
│   ├── Neuro.EntityFrameworkCore.Sqlite/  # SQLite 支持
│   ├── Neuro.LLM/               # 大语言模型抽象（预留）
│   ├── Neuro.RAG/               # RAG（检索增强生成）服务
│   │   ├── Services/RagService.cs       # 检索、分块、问答
│   │   ├── Utils/TextChunker.cs         # 智能分块（代码/混合文本）
│   │   └── Options/                     # 配置选项
│   ├── Neuro.Shared/            # 共享 DTO 和分页模型
│   ├── Neuro.Storage/           # 文件存储抽象
│   │   ├── Abstractions/         # IFileStorage 接口
│   │   └── Providers/            # LocalFileStorage 实现
│   ├── Neuro.Storage.Sqlite/    # SQLite 文件元数据存储
│   ├── Neuro.Tokenizer/         # 分词器适配器（tiktoken 风格）
│   ├── Neuro.Vector/            # 向量存储抽象
│   │   ├── IVectorStore          # 向量存储接口
│   │   ├── Providers/VectorStoreFactory.cs  # 提供者工厂
│   │   └── Stores/               # LocalVectorStore、LockFreeVectorStore
│   └── Neuro.Vectorizer/        # ONNX 向量化器
│       └── OnnxVectorizer.cs     # 文本 embedding 生成
├── tests/                        # 单元测试项目
│   ├── Neuro.Api.Tests/
│   ├── Neuro.Document.Tests/
│   ├── Neuro.RAG.Tests/
│   ├── Neuro.Storage.Sqlite.Tests/
│   ├── Neuro.Tokenizer.Tests/
│   ├── Neuro.Vector.Tests/
│   └── Neuro.Vectorizer.Tests/
├── front/                        # React 前端
│   ├── src/
│   │   ├── components/           # UI 组件
│   │   ├── pages/                # 路由页面
│   │   ├── services/             # API 客户端封装
│   │   ├── hooks/                # 自定义 hooks
│   │   ├── utils/                # 工具函数
│   │   └── styles/               # Tailwind tokens 与全局样式
│   └── storybook/                # Storybook 组件展示
├── docs/                         # 设计文档
├── models/                       # ONNX 模型文件（Git LFS 管理）
├── tools/                        # 工具项目
│   ├── VocabExtractor/           # 词汇提取工具
│   └── VocabGenerator/           # 词汇生成工具
└── Neuro.slnx                  # Visual Studio 解决方案文件
```

## 构建与运行

### 环境要求

- **.NET 10 SDK**（验证：`dotnet --version`）
- **Node.js 18+**（用于前端开发）
- **Git LFS**（用于下载 ONNX 模型文件）

### 初始化

```bash
# 拉取 Git LFS 文件（下载 ONNX 模型）
git lfs pull
```

### .NET 后端

```bash
# 构建整个解决方案
dotnet build Neuro.slnx

# 运行示例 API（使用 SQLite，默认路径 Data Source=neuro.db）
cd src/Neuro.Api
dotnet run

# 运行测试
dotnet test

# 运行特定测试项目
dotnet test tests/Neuro.Vector.Tests
dotnet test tests/Neuro.Vectorizer.Tests

# 运行单个测试
dotnet test --filter "FullyQualifiedName~VectorizerTests"
```

**API 访问：**

- API 端点：`http://localhost:5146`（默认端口）
- Swagger/OpenAPI UI：`http://localhost:5146/scalar/v1`
- SignalR Hubs：
  - `/hubs/system-status`（系统状态推送）
  - `/hubs/chat`（聊天）
  - `/hubs/project-doc`（文档生成）

**超管账号（首次运行自动创建）：**

- 账号：`admin`
- 密码：`admin`

### 前端

```bash
cd front

# 安装依赖
npm install

# 开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行测试
npm run test

# 代码检查
npm run lint

# 代码格式化
npm run format

# 生成 API 客户端（需后端服务运行）
npm run gen:api

# Storybook 组件开发
npm run storybook

# 构建 Storybook
npm run build-storybook
```

## 开发约定

### 代码风格

- **行长度**：120 字符（见 `.editorconfig`）
- **语言**：代码注释和异常消息使用**中文**（保持与现有代码一致）
- **XML 文档**：公共 API 应包含中文 XML 注释
- **命名规范**：使用 PascalCase（类、方法）、camelCase（字段、参数）
- **类型系统**：前端使用 TypeScript strict 模式

### .NET 架构模式

1. **依赖注入（DI）**
   - 位置：`src/*/Extensions/*.cs`
   - 命名约定：`AddVectorStore`、`AddVectorizer`、`AddTokenizer` 等
   - 示例：
     ```csharp
     builder.Services.AddVectorStore(options => { options.ProviderName = "local"; });
     builder.Services.AddVectorizer(options => { options.ModelPath = "path/to/model.onnx"; });
     ```

2. **提供者工厂模式**
   - 位置：`src/Neuro.Vector/Providers/VectorStoreFactory.cs`
   - 用途：注册和创建命名向量存储提供者
   - 内置提供者：`local`（基于并发字典）、`lockfree`（基于不可变字典）

3. **实体发现与自动注册**
   - 实体必须实现 `IEntity` 接口
   - 基类：`EntityBase`（包含审计字段：CreatedAt, CreatedById, UpdatedAt 等）
   - 可选接口：
     - `ISoftDeleteEntity`：启用软删除（默认过滤器）
     - `ITenantEntity`：启用租户隔离（默认过滤器）
     - `IReadOnlyEntity`：禁止修改（抛出异常）
   - 自动注册逻辑位于 `NeuroDbContext.OnModelCreating`

4. **审计规则**
   - 自动设置创建/更新时间戳和用户
   - 软删除转换：物理删除 → 设置 `IsDeleted = true`

### 前端架构约定

1. **组件化**
   - 所有 UI 必须组件化，禁止在页面中写大量内联样式
   - 每个组件应控制在 200 行以内
   - 组件必须包含：
     - TypeScript 类型声明（props）
     - Storybook stories 或单元测试
     - 可访问性（aria-*）支持

2. **样式约定**
   - 优先使用 Tailwind 原子类
   - 使用 `clsx` 或 `classnames` 管理条件 class
   - 定义在 `src/styles/tokens.ts` 的 design tokens：
     - colors.primary: `#6366F1`
     - colors.primaryDark: `#4F46E5`
     - radii.md: `12`（卡片圆角）
     - spacing/md: `16`（主要内边距）
   - 支持暗色模式（Tailwind `dark:` 前缀）
   - 采用"现代简约 + 卡片化 + Material Design"风格

3. **状态管理**
   - 优先使用 React Context + hooks
   - 复杂场景可使用 Zustand 或 Redux Toolkit（需说明理由）

4. **API 交互**
   - 后端 OpenAPI schema 为单一真实来源
   - 使用 `openapi-generator-cli` 生成 TypeScript 客户端（`npm run gen:api`）
   - 手写一层服务封装处理错误、重试、分页与鉴权
   - 严格使用生成的接口类型，禁止 `any`

5. **组件库**
   - 图标库：Heroicons（`@heroicons/react`）
   - Toast 通知：使用 `useToast()` hook
   - 主题切换：统一入口在全局 header

6. **Git Commits**
   - 使用 Conventional Commits 规范

## 关键组件说明

### 1. 向量化器（Neuro.Vectorizer）

**功能**：基于 ONNX 模型生成文本 embedding

**模型选择策略**（按优先级）：
1. Pooled 输出（`pooler`、`pooled`、`cls`）
2. 最后一层 hidden 状态的均值池化
3. 任意 float 张量并展平

**配置**：
```csharp
builder.Services.AddVectorizer(options =>
{
    options.ModelPath = Path.Combine(AppContext.BaseDirectory, "models", "bert_Opset18.onnx");
});
```

**注意**：
- 模型文件位于 `models/bert_Opset18.onnx`（Git LFS 管理）
- 测试时会尝试多个路径查找模型，缺失时自动跳过

### 2. 分词器（Neuro.Tokenizer）

**功能**：封装 Microsoft.ML.Tokenizers 的 tiktoken 风格接口

**限制**：
- 仅支持通过 `EncodingName` 创建编码器
- **不支持**通过 `EncodingFilePath` 加载本地编码文件

### 3. 向量存储（Neuro.Vector）

**内置提供者**：

| 名称 | 实现 | 特点 |
|------|------|------|
| `local` | `LocalVectorStore` | 基于 `ConcurrentDictionary`，支持一致性模式配置 |
| `lockfree` | `LockFreeVectorStore` | 基于不可变字典，无锁实现 |

**使用方式**：

```csharp
// 方法一：通过 ProviderName 注册
builder.Services.AddVectorStore(options => { options.ProviderName = "lockfree"; });

// 方法二：直接提供工厂
builder.Services.AddVectorStore(options => { 
    options.ProviderFactory = sp => new LocalVectorStore(); 
});

// 方法三：注册自定义提供者
builder.Services.AddVectorStoreProvider("my-provider", sp => new MyProvider());
```

**控制器注入**：
```csharp
private readonly IVectorStore _store;

public async Task<IActionResult> Query(float[] queryEmbedding, int topK = 10)
{
    var results = await _store.QueryAsync(queryEmbedding, topK);
    return Ok(results);
}
```

### 4. RAG 服务（Neuro.RAG）

**核心功能**：
- `TextChunker`：智能分块（支持代码段与混合文本，可配置重叠）
- `RagService`：检索、查询、问答

**配置选项**：
```csharp
builder.Services.AddNeuroRAG(options =>
{
    // 基础检索参数
    options.TopK = 10;
    options.MinScore = 0.2f;
    options.MinKeywordScore = 0f;
    options.VectorizeBatchSize = 16;

    // 分块参数
    options.ChunkSize = 220;
    options.ChunkOverlap = 40;

    // 自适应分块
    options.EnableAdaptiveChunking = true;
    options.CodeChunkSizeRatio = 0.65f;      // 代码段更细
    options.MixedChunkSizeRatio = 0.85f;     // 混合文本折中

    // 词汇回退（ código 问答）
    options.EnableLexicalFallback = true;
    options.LexicalCandidateLimit = 400;
});
```

### 5. 文档转换（Neuro.Document）

**支持格式**：
- HTML → Markdown（ReverseMarkdown）
- PDF → Markdown（PdfPig）
- DOCX → Markdown（OpenXml SDK）
- RTF → Markdown（RtfPipe）

**使用**：
```csharp
var converter = NeuroConverter.GetConverterByExtension(".pdf");
var markdown = converter.Convert("file.pdf");
```

### 6. 文档生成后台服务

**已加载服务**（`Neuro.Api/Program.cs`）：
- `DocumentVectorizationService`：自动向量化新文档
- `ProjectDocGenerationService`：基于知识库生成项目文档

**手动触发**：
```csharp
// 通过控制器 API 触发
// POST /api/document-vectorization/trigger
// POST /api/project-doc/trigger
```

## 扩展指南

### 添加向量存储提供者

```csharp
// 1. 实现 IVectorStore 接口
public class MyVectorStore : IVectorStore
{
    public Task UpsertAsync(IEnumerable<VectorRecord> records) { ... }
    public Task DeleteAsync(IEnumerable<string> ids) { ... }
    public Task<IReadOnlyList<QueryResult>> QueryAsync(float[] query, int topK) { ... }
}

// 2. 注册到工厂
VectorStoreFactory.RegisterProvider("myprovider", (sp, opts) => new MyVectorStore(opts));

// 3. 提供 DI 扩展（可选）
public static IServiceCollection AddVectorStoreProvider(
    this IServiceCollection services,
    string name,
    Func<IServiceProvider, IVectorStore> factory)
{
    VectorStoreFactory.RegisterProvider(name, (sp, opts) => factory(sp));
    return services;
}
```

### 添加文档转换器

```csharp
// 实现 IDocumentConverter 接口
public class XmlToMarkdownConverter : IDocumentConverter
{
    public bool CanConvert(string extension) => extension == ".xml";
    public string Convert(Stream stream) => "...";
}

// 在 DocumentConverterFactory 中添加映射
public static IDocumentConverter GetConverterByExtension(string? extension)
{
    return extension switch
    {
        ".xml" => new XmlToMarkdownConverter(),
        // ... 其他映射
        _ => throw new NotSupportedException(...)
    };
}
```

## 已知限制与注意事项

### 1. TiktokenTokenizerAdapter

- **限制**：不支持通过 `EncodingFilePath` 加载本地编码文件
- **原因**：Microsoft.ML.Tokenizers 的 `EncodingFilePath` 未实现
- **影响**：测试文件可能会跳过相关测试

### 2. Database Initialization

- 当前使用 `EnsureCreated()`，**不运行 EF Migrations**
- 如需迁移，使用 `SqliteExtensions.ApplyMigrations` 或手动管理

### 3. ONNX 输出选择

- 新增 ONNX 模型可能需要调整输出选择策略（参见 `OnnxVectorizer.cs`）

### 4. Git LFS

- **重要**：不要将大型 ONNX 模型文件直接提交到 Git
- 模型文件位于 `models/` 目录，由 `.gitattributes` 管理

## 测试策略

### 测试项目组织

| 测试项目 | 覆盖范围 |
|----------|----------|
| `Neuro.Vector.Tests` | LocalVectorStore、LockFreeVectorStore、DI 注册 |
| `Neuro.Vectorizer.Tests` | OnnxVectorizer（需模型文件） |
| `Neuro.Tokenizer.Tests` | TiktokenTokenizerAdapter |
| `Neuro.RAG.Tests` | TextChunker、RagService |
| `Neuro.Document.Tests` | 各种文档转换器 |
| `Neuro.Storage.Sqlite.Tests` | SQLite 存储、索引、并发 |
| `Neuro.Api.Tests` | API 测试、PasswordHasher |

### 运行测试

```bash
# 运行所有测试
dotnet test

# 排除向量化器测试（避免模型依赖）
dotnet test --filter "FullyQualifiedName!~VectorizerTests"
```

### 模型文件缺失处理

向量化器测试会自动跳过缺失模型的测试，并记录警告信息：
```
Test is skipped: ONNX model not found at models/bert_Opset18.onnx
```

## CI/CD 建议

```yaml
# GitHub Actions 示例
steps:
  - name: 检出代码（含 LFS）
    uses: actions/checkout@v4
    with:
      lfs: true

  - name: 设置 .NET
    uses: actions/setup-dotnet@v4
    with:
      dotnet-version: '10.0.x'

  - name: 构建
    run: dotnet build Neuro.slnx

  - name: 测试（排除模型依赖）
    run: dotnet test --filter "FullyQualifiedName!~VectorizerTests"
```

## 安全注意事项

1. **JWT 密钥**：开发环境使用默认密钥，生产环境必须通过配置替换
2. **CORS**：默认允许所有来源，生产环境应收紧
3. **文件上传**：对上传文件类型和大小进行限制
4. **敏感信息**：不要在代码中硬编码密钥或凭证

## 路线图

### 短期

- 完善文档生成模板
- 增加 Markdown → 知识片段的拆分器与注释提取器
- 优化前端组件库

### 中期

- 增加更多向量存储后端（Faiss、Milvus、Pinecone）
- 引入增量索引与同步任务
- 完善 RAG 混合检索（关键词 + 向量）

### 长期

- 集成 LLM 写作助手用于生成完整设计文档与变更日志
- 增加知识库版本控制
- 支持多模态文档（图片、表格）

## 常见任务速查

### 1. 初始化数据库（开发）

```bash
cd src/Neuro.Api
dotnet run
# 超管账号自动创建（admin/admin）
```

### 2. 添加新实体

```csharp
// 1. 实体类实现 IEntity
public class MyEntity : EntityBase
{
    public string Name { get; set; }
}

// 2. 添加 DbSet 到 DbContext
public DbSet<MyEntity> MyEntities { get; set; }

// 3. 自动注册（通过 OnModelCreating 扫描）
```

### 3. 添加新 API 端点

```csharp
[ApiController]
[Route("api/[controller]")]
public class MyController : ControllerBase
{
    private readonly IVectorStore _store;
    
    public MyController(IVectorStore store)
    {
        _store = store;
    }
    
    [HttpPost("query")]
    public async Task<IActionResult> Query(QueryRequest request)
    {
        var results = await _store.QueryAsync(request.Embedding, request.TopK);
        return Ok(results);
    }
}
```

### 4. 新增前端页面

```bash
# 创建页面组件
mkdir -p front/src/pages/MyPage
touch front/src/pages/MyPage/index.tsx

# 添加路由（在 App.tsx 或 Layout.tsx 中）
<Route path="/my-page" element={<MyPage />} />
```

## 模型与数据文件

### ONNX 模型

- **文件**：`models/bert_Opset18.onnx`
- **用途**：文本向量化（生成 embedding）
- **管理**：Git LFS
- **下载**：`git lfs pull`

### 数据库文件（开发）

- **位置**：`src/Neuro.Api/neuro.db`
- **类型**：SQLite
- **模式**：自动创建（`EnsureCreated()`）

## 已知问题排查

### 1. 构建失败

```bash
# 清理并重建
dotnet clean
dotnet build --no-restore
```

### 2. 测试失败（向量化器相关）

```bash
# 确保已拉取 Git LFS 文件
git lfs pull

# 验证模型文件存在
dir models\bert_Opset18.onnx
```

### 3. 前端依赖安装失败

```bash
# 清理 npm
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 4. 数据库连接失败

- 检查 `src/Neuro.Api/appsettings.json` 中的连接字符串
- 确保 `neuro.db` 文件所在目录存在且可写

## 相关文档

- `README.md`：项目 overview
- `AGENTS.md`：.NET 后端 AI 助手使用指南
- `front/AGENTS.md`：React 前端 AI 助手使用指南
- `RAG_DIAGNOSIS_AND_SOLUTIONS.md`：RAG 系统诊断指南
- `docs/`：设计文档（architecture、API 设计等）

---

**最后更新**：2026年2月25日
