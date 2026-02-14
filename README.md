# Neuro

AI 知识库以及动态文档生成

简述:
Neuro 是一个用于构建 AI 驱动知识库并自动生成项目文档的 .NET 组件集合，包含向量化、分词、向量存储抽象与样例 API。

目标:
- 提供可扩展的向量化与向量存储接口，方便集成不同模型与存储后端
- 支持基于文档与向量检索的知识库构建
- 支持根据知识库和代码自动生成或更新项目文档

关键特性:
- ONNX 向量化器（Neuro.Vectorizer）：基于 ONNX 模型生成文本 embedding，内置输出选择启发式规则
- 分词器适配器（Neuro.Tokenizer）：封装 Microsoft.ML.Tokenizers 的 tiktoken 风格接口
- 向量存储提供者（Neuro.Vector）：支持通过工厂注册不同提供者并以 DI 方式注入
- EF Core 集成（Neuro.EntityFrameworkCore）：包含软删除、租户过滤与审计规则
- 示例 API（Neuro.Api）：演示如何启动服务、注入组件与初始化数据库
- 文档转换器（Neuro.Document）：将文档转换为 Markdown 以供索引与渲染

架构概览:
- 模块化设计：每个功能模块为独立项目，通过扩展方法进行 DI 注册（AddVectorStore、AddVectorizer 等）
- 提供者工厂模式：VectorStoreFactory 注册并创建命名提供者，支持灵活替换存储后端
- 向量化器策略：在加载 ONNX 模型后，优先选择 pooled 输出，次选 last_hidden 的均值池化，最后回退到任意 float 张量并展平

运行与开发:
- 要求：.NET 10 SDK
- 构建：dotnet build Neuro.slnx
- 运行示例 API：cd src\Neuro.Api && dotnet run（默认 SQLite，Data Source=neuro.db）
- 测试：dotnet test（某些向量化器测试依赖 ONNX 模型，需 git lfs pull 获取 models/bert_Opset18.onnx）
- 注意：向量化器模型与大文件使用 Git LFS 管理，避免将模型直接提交到仓库

扩展与二次开发指南:
- 添加向量存储提供者：实现 IVectorStore 并通过 VectorStoreFactory.RegisterProvider 注册，同时提供 services.AddVectorStoreProvider 的扩展
- 添加分词器/向量化器：实现 ITokenizer / IVectorizer 并在对应的 Extensions 中注册
- 文档自动生成：使用 Neuro.Document 提取、转换文档为 Markdown，结合向量索引与检索生成说明或更新 README

已知限制与设计决策:
- TiktokenTokenzierAdapter 仅支持通过 EncodingName 创建编码器，不支持本地编码文件路径（EncodingFilePath）
- AutoInitDatabase 使用 EnsureCreated()，默认不启用 EF Migrations
- ONNX embedding 输出采用启发式选择，新增模型可能需要调整选择策略

贡献与路线图:
- 短期：完善文档生成模板、增加 Markdown->知识片段的拆分器与注释提取器
- 中期：增加更多向量存储后端（Faiss、Milvus、Pinecone）、引入增量索引与同步任务
- 长期：集成 LLM 写作助手用于生成完整设计文档与变更日志