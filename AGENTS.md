# AI 代理使用说明（AGENTS）

本文档面向自动化编码代理（CI/AI 助手、Copilot 风格代理等），提供在本仓库中快速、安全、可复现地开展工作的要点与约定。

---

## 项目概述

Neuro 是一个用于构建 AI 驱动知识库并自动生成项目文档的 .NET 组件集合。项目采用模块化设计，每个功能模块为独立项目，通过扩展方法进行依赖注入（DI）注册。

### 核心功能模块

| 模块 | 路径 | 说明 |
|------|------|------|
| Neuro.Abstractions | `src/Neuro.Abstractions` | 实体基类和服务接口定义（IEntity、ICurrentUserService 等） |
| Neuro.Api | `src/Neuro.Api` | ASP.NET Core Web API 示例项目，演示组件集成 |
| Neuro.Document | `src/Neuro.Document` | 文档转换器（HTML、PDF、DOCX、RTF → Markdown） |
| Neuro.EntityFrameworkCore | `src/Neuro.EntityFrameworkCore` | EF Core 基类、软删除、审计、租户过滤 |
| Neuro.EntityFrameworkCore.NpgSql | `src/Neuro.EntityFrameworkCore.NpgSql` | PostgreSQL 数据库支持 |
| Neuro.EntityFrameworkCore.Sqlite | `src/Neuro.EntityFrameworkCore.Sqlite` | SQLite 数据库支持 |
| Neuro.LLM | `src/Neuro.LLM` | 大语言模型抽象（预留模块） |
| Neuro.RAG | `src/Neuro.RAG` | RAG（检索增强生成）服务：分块、索引、搜索、问答 |
| Neuro.Shared | `src/Neuro.Shared` | 共享 DTO 和分页模型 |
| Neuro.Storage | `src/Neuro.Storage` | 文件存储抽象（本地存储、元数据管理） |
| Neuro.Storage.Sqlite | `src/Neuro.Storage.Sqlite` | SQLite 实现的文件元数据存储 |
| Neuro.Tokenizer | `src/Neuro.Tokenizer` | 分词器适配器（基于 Microsoft.ML.Tokenizers） |
| Neuro.Vector | `src/Neuro.Vector` | 向量存储抽象与本地实现 |
| Neuro.Vectorizer | `src/Neuro.Vectorizer` | ONNX 向量化器实现 |

### 前端项目

| 模块 | 路径 | 说明 |
|------|------|------|
| neuro-front | `front/` | React + TypeScript + Vite + Tailwind CSS 前端 |

---

## 技术栈

- **目标框架**: .NET 10 (net10.0)
- **Web 框架**: ASP.NET Core 10
- **ORM**: Entity Framework Core 10
- **数据库**: SQLite（默认）、PostgreSQL（可选）
- **ONNX 推理**: Microsoft.ML.OnnxRuntime 1.17.0
- **分词器**: Microsoft.ML.Tokenizers 2.0.0
- **文档处理**: 
  - ReverseMarkdown 1.2.0 (HTML → MD)
  - HtmlAgilityPack 1.11.64
  - DocumentFormat.OpenXml 3.4.1 (DOCX)
  - UglyToad.PdfPig 1.7.0 (PDF)
  - RtfPipe 2.0.7677 (RTF)
- **API 文档**: OpenAPI + Scalar.AspNetCore
- **认证**: JWT Bearer
- **前端**: React 18 + TypeScript + Vite + Tailwind CSS + Storybook

---

## 构建与测试命令

### 环境要求

```bash
# 验证 .NET 版本（要求 .NET 10）
dotnet --version
```

### 构建

```bash
# 构建整个解决方案
dotnet build Neuro.slnx

# 或在仓库根目录直接运行
dotnet build
```

### 运行示例 API

```bash
cd src/Neuro.Api
dotnet run
```

- 默认监听地址可在 `Properties/launchSettings.json` 中配置
- 默认数据库：SQLite（`Data Source=neuro.db`）
- API 文档：开发模式下访问 `/scalar/v1` 查看 Scalar UI

### 运行测试

```bash
# 运行所有测试
dotnet test

# 运行特定测试项目
dotnet test tests/Neuro.Vector.Tests
dotnet test tests/Neuro.Vectorizer.Tests
dotnet test tests/Neuro.Tokenizer.Tests
dotnet test tests/Neuro.RAG.Tests

# 运行单个测试
dotnet test --filter "FullyQualifiedName~VectorizerTests"
```

### 模型依赖

向量化器测试依赖 ONNX 模型文件（Git LFS 管理）：

```bash
# 在运行 Vectorizer 相关测试前执行
git lfs pull
```

模型文件：`models/bert_Opset18.onnx`
- 如模型缺失，相关测试会自动跳过
- 不要直接将大型模型文件提交到仓库

### 前端构建

```bash
cd front

# 安装依赖
npm install

# 开发服务器
npm run dev

# 构建
npm run build

# 运行测试
npm run test

# 生成 API 客户端（需后端服务运行）
npm run gen:api
```

---

## 代码组织与架构

### 目录结构

```
Neuro/
├── src/                          # 源代码
│   ├── Neuro.Abstractions/       # 抽象接口和实体基类
│   ├── Neuro.Api/                # Web API 示例
│   │   ├── Controllers/          # API 控制器
│   │   ├── Entity/               # 实体定义
│   │   ├── Services/             # 服务实现
│   │   └── Middlewares/          # 中间件
│   ├── Neuro.Document/           # 文档转换
│   │   └── Converters/           # 各种格式转换器
│   ├── Neuro.EntityFrameworkCore/         # EF Core 基础
│   │   └── Extensions/           # 扩展方法
│   ├── Neuro.RAG/                # RAG 功能
│   │   ├── Abstractions/         # 接口定义
│   │   ├── Services/             # 服务实现
│   │   └── Models/               # 数据模型
│   ├── Neuro.Storage/            # 文件存储
│   │   ├── Abstractions/         # 接口定义
│   │   ├── Providers/            # 存储提供者
│   │   └── Indexing/             # 索引服务
│   ├── Neuro.Vector/             # 向量存储
│   │   ├── Abstractions/         # IVectorStore 接口
│   │   ├── Providers/            # VectorStoreFactory
│   │   ├── Stores/               # LocalVectorStore、LockFreeVectorStore
│   │   └── Extensions/           # DI 扩展
│   └── Neuro.Vectorizer/         # ONNX 向量化
│       └── OnnxVectorizer.cs     # 向量化器实现
├── tests/                        # 单元测试项目
├── front/                        # React 前端
├── docs/                         # 设计文档
├── models/                       # ONNX 模型文件（Git LFS）
└── Neuro.slnx                    # 解决方案文件
```

### 关键设计模式

1. **依赖注入（DI）通过扩展方法**
   - 位置：`src/*/Extensions/*.cs`
   - 命名约定：`AddVectorStore`、`AddVectorizer`、`AddTokenizer` 等

2. **提供者工厂模式**
   - 位置：`src/Neuro.Vector/Providers/VectorStoreFactory.cs`
   - 用途：注册和创建命名向量存储提供者
   - 内置提供者：`local`、`lockfree`

3. **实体发现与自动注册**
   - 位置：`DbContextExtensions.RegisterEntity`
   - 自动扫描实现 `IEntity` 的类并注册到 EF Core
   - 自动为 `ISoftDeleteEntity` 添加软删除过滤器
   - 自动为 `ITenantEntity` 添加租户隔离过滤器

4. **审计与软删除**
   - 位置：`NeuroDbContext.ApplyAuditingRules`
   - 自动设置创建/更新时间戳和用户
   - 将物理删除转换为软删除（设置 `IsDeleted = true`）
   - 阻止对 `IReadOnlyEntity` 的修改

---

## 开发约定

### 代码风格

- **行长度限制**: 120 字符（见 `.editorconfig`）
- **语言**: 代码中使用中文注释和异常消息以保持与现有代码一致
- **XML 文档**: 公共 API 应包含中文 XML 注释

### 实体基类

```csharp
// 实体必须实现 IEntity 接口才能被自动注册
public interface IEntity { }

// 完整功能实体应继承 EntityBase
public abstract class EntityBase : IEntity, IAuditedEntity, ISoftDeleteEntity, ITenantEntity

// 只读实体接口（修改会抛出异常）
public interface IReadOnlyEntity { }
```

### 关键文件索引

| 功能 | 文件路径 |
|------|----------|
| DI 注册入口 | `src/Neuro.Vector/Extensions/VectorStoreExtensions.cs` |
| 向量存储工厂 | `src/Neuro.Vector/Providers/VectorStoreFactory.cs` |
| ONNX 向量化器 | `src/Neuro.Vectorizer/OnnxVectorizer.cs` |
| 分词器适配器 | `src/Neuro.Tokenizer/TiktokenTokenizerAdapter.cs` |
| EF 扩展 | `src/Neuro.EntityFrameworkCore/Extensions/DbContextExtensions.cs` |
| EF 基类 | `src/Neuro.EntityFrameworkCore/NeuroDbContext.cs` |
| 文档转换器 | `src/Neuro.Document/NeuroConverter.cs` |
| RAG 服务 | `src/Neuro.RAG/Services/RagService.cs` |
| API 启动 | `src/Neuro.Api/Program.cs` |

---

## 常见任务指南

### 添加向量存储提供者

```csharp
// 1. 实现 IVectorStore 接口
public class MyVectorStore : IVectorStore { ... }

// 2. 注册到工厂
VectorStoreFactory.RegisterProvider("myprovider", (sp, opts) => new MyVectorStore(opts));

// 3. 提供 DI 扩展（可选但推荐）
public static IServiceCollection AddVectorStoreProvider(
    this IServiceCollection services, 
    string name, 
    Func<IServiceProvider, IVectorStore> factory)
{
    VectorStoreFactory.RegisterProvider(name, (sp, opts) => factory(sp));
    return services;
}
```

### 添加分词器

```csharp
// 实现 ITokenizer 接口
public class MyTokenizer : ITokenizer { ... }

// 在 TokenizerExtensions 中添加注册方法
public static IServiceCollection AddMyTokenizer(this IServiceCollection services)
{
    services.AddSingleton<ITokenizer, MyTokenizer>();
    return services;
}
```

### 添加文档转换器

```csharp
// 实现 IDocumentConverter 接口
public class XmlToMarkdownConverter : IDocumentConverter { ... }

// 在 DocumentConverterFactory 中添加扩展名映射
public static IDocumentConverter GetConverterByExtension(string? extension)
{
    return extension switch
    {
        // ... 现有映射 ...
        ".xml" => new XmlToMarkdownConverter(),  // 新增
        _ => throw new NotSupportedException(...)
    };
}
```

### 数据库初始化

```csharp
// 使用 EnsureCreated()（默认不使用 EF Migrations）
app.AutoInitDatabase<NeuroDbContext>(reset: false);

// 或使用迁移（需要显式管理）
// 见 SqliteExtensions.ApplyMigrations
```

---

## 测试策略

### 测试项目组织

- 每个 src 项目对应一个测试项目：`tests/{ProjectName}.Tests`
- 测试框架：xUnit
- 断言库：内置 Assert

### 测试类型

| 测试项目 | 覆盖范围 |
|----------|----------|
| Neuro.Vector.Tests | LocalVectorStore、LockFreeVectorStore、DI 注册 |
| Neuro.Vectorizer.Tests | OnnxVectorizer（需模型文件） |
| Neuro.Tokenizer.Tests | TiktokenTokenizerAdapter |
| Neuro.RAG.Tests | TextChunker、RagService |
| Neuro.Document.Tests | 各种文档转换器 |
| Neuro.Storage.Sqlite.Tests | SQLite 存储、索引、并发 |
| Neuro.Api.Tests | API 测试、PasswordHasher |

### 向量化器测试注意事项

向量化器测试会尝试在多个候选路径查找模型：
- `models/bert_Opset18.onnx`
- `../../models/bert_Opset18.onnx`
- `../../../models/bert_Opset18.onnx`

如模型不存在，测试会自动跳过并记录警告信息。

---

## 已知限制与注意事项

### TiktokenTokenizerAdapter

- 仅支持通过 `EncodingName` 创建编码器
- **不支持**通过 `EncodingFilePath` 加载本地编码文件（会抛出 `NotSupportedException`）
- 文件：`src/Neuro.Tokenizer/TiktokenTokenizerAdapter.cs`

### OnnxVectorizer

- 默认模型路径：`models/bert_Opset18.onnx`
- Embedding 输出选择策略（按优先级）：
  1. Pooled 输出（`pooler`、`pooled`、`cls`）
  2. 最后一层 hidden 状态的均值池化
  3. 任意 float 张量并展平
- 引入新 ONNX 模型时可能需要调整选择策略

### 数据库

- `AutoInitDatabase` 使用 `EnsureCreated()`，不运行 EF Migrations
- 如需迁移，使用 `SqliteExtensions.ApplyMigrations` 或手动管理

### RAG 分块

- `TextChunker` 实现基于 token 数量的智能分块
- 支持重叠（overlap）以保留上下文

---

## 安全注意事项

1. **JWT 密钥**: 开发环境使用默认密钥，生产环境必须通过配置替换
2. **CORS**: 默认配置允许所有来源，生产环境应收紧
3. **文件上传**: 确保对上传文件类型和大小进行限制
4. **模型文件**: 不要将大型 ONNX 模型直接提交到 Git，使用 Git LFS

---

## CI/CD 建议

```yaml
# 示例 CI 步骤
steps:
  - name: 检出代码
    uses: actions/checkout@v4
    with:
      lfs: true  # 拉取 Git LFS 文件

  - name: 设置 .NET
    uses: actions/setup-dotnet@v4
    with:
      dotnet-version: '10.0.x'

  - name: 构建
    run: dotnet build Neuro.slnx

  - name: 测试（不含模型依赖的测试）
    run: dotnet test --filter "FullyQualifiedName!~VectorizerTests"
```

---

## 提交与 PR 指南

- 保持对公共 API 的兼容性
- 破坏性变更需在 PR 描述中明确列出并提供迁移建议
- 新功能需包含单元测试
- 更新相关 XML 文档注释
- 中文注释和异常消息与现有代码保持一致

---

## 问题排查

### 构建失败

```bash
# 清理并重建
dotnet clean
dotnet build --no-restore
```

### 测试失败

```bash
# 详细输出
dotnet test --verbosity normal

# 特定测试项目
dotnet test tests/Neuro.Vector.Tests --verbosity normal
```

### 模型文件缺失

```bash
# 确保已安装 Git LFS
git lfs install

# 拉取 LFS 文件
git lfs pull
```
