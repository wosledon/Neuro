# Neuro.Storage

核心的文件存储与抽象。此仓库新增了一个可选的 SQLite/EF Core 实现 `Neuro.Storage.Sqlite`，它实现了 `IFileMetadataStore`，用于存储文件索引与元数据。

使用方式示例：

```csharp
services.AddSqliteFileStore(options => {
    options.ConnectionString = "Data Source=filestore.db;Cache=Shared;Mode=ReadWriteCreate;Pooling=True;";
});

// 可在应用启动时显式创建数据库：
SqliteExtensions.EnsureDatabaseCreated(app.ApplicationServices);
```
