using System.Collections.Concurrent;
using Neuro.RAG.Abstractions;
using Neuro.EntityFrameworkCore;
using Neuro.Api.Entity;
using DocumentEntity = Neuro.Api.Entity.MyDocument;
using Microsoft.EntityFrameworkCore;
using Neuro.Vector;

namespace Neuro.Api.Services;

/// <summary>
/// 文档向量化后台服务 - 自动将文档内容向量化并存储到向量数据库
/// </summary>
public class DocumentVectorizationService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DocumentVectorizationService> _logger;
    private readonly ConcurrentQueue<Guid> _pendingDocuments = new();
    private readonly SemaphoreSlim _signal = new(0);

    public DocumentVectorizationService(
        IServiceProvider serviceProvider,
        ILogger<DocumentVectorizationService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    /// <summary>
    /// 将文档加入向量化队列
    /// </summary>
    public void EnqueueDocument(Guid documentId)
    {
        _pendingDocuments.Enqueue(documentId);
        _signal.Release();
        _logger.LogInformation("文档 {DocumentId} 已加入向量化队列", documentId);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("文档向量化服务已启动（按需模式）");

        // 注意：启动时不再自动处理所有未向量化的文档
        // 向量化仅在以下情况触发：
        // 1. 通过 TriggerVectorization API 手动触发
        // 2. 文档保存时通过 EnqueueDocument 加入队列

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // 等待信号或超时检查
                await _signal.WaitAsync(TimeSpan.FromMinutes(1), stoppingToken);

                while (_pendingDocuments.TryDequeue(out var documentId))
                {
                    await VectorizeDocumentAsync(documentId, stoppingToken);
                }
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "文档向量化处理失败");
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }

        _logger.LogInformation("文档向量化服务已停止");
    }

    /// <summary>
    /// 处理启动时待向量化的文档
    /// </summary>
    private async Task ProcessPendingDocumentsAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<NeuroDbContext>();

            // 查找所有未向量化的文档
            var pendingDocs = await db.Set<DocumentEntity>()
                .Where(d => !d.IsDeleted && (d.VectorizedAt == null || d.UpdatedAt > d.VectorizedAt))
                .Select(d => d.Id)
                .ToListAsync(cancellationToken);

            foreach (var docId in pendingDocs)
            {
                _pendingDocuments.Enqueue(docId);
                _signal.Release();
            }

            if (pendingDocs.Count > 0)
            {
                _logger.LogInformation("启动时发现 {Count} 个待向量化文档", pendingDocs.Count);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "检查待向量化文档失败");
        }
    }

    /// <summary>
    /// 向量化单个文档
    /// </summary>
    private async Task VectorizeDocumentAsync(Guid documentId, CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<NeuroDbContext>();
        var ingestService = scope.ServiceProvider.GetRequiredService<IIngestService>();

        try
        {
            var document = await db.Set<DocumentEntity>()
                .FirstOrDefaultAsync(d => d.Id == documentId, cancellationToken);

            if (document == null || document.IsDeleted)
            {
                _logger.LogWarning("文档 {DocumentId} 不存在或已删除", documentId);
                return;
            }

            // 检查文档内容是否有变化
            if (document.VectorizedAt != null && document.UpdatedAt <= document.VectorizedAt)
            {
                _logger.LogInformation("文档 {DocumentId} 已是最新，跳过向量化", documentId);
                return;
            }

            _logger.LogInformation("开始向量化文档 {DocumentId}: {Title}", documentId, document.Title);

            // 先删除旧的向量记录
            await DeleteExistingVectorsAsync(documentId, cancellationToken);

            // 向量化文档内容
            var content = $"{document.Title}\n\n{document.Content}";
            var chunkIds = await ingestService.IndexTextAsync(content, documentId.ToString(), cancellationToken);

            // 更新文档的向量化时间
            document.VectorizedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("文档 {DocumentId} 向量化完成，生成 {Count} 个向量块", documentId, chunkIds.Count());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "文档 {DocumentId} 向量化失败", documentId);
            throw;
        }
    }

    /// <summary>
    /// 删除文档的现有向量记录
    /// </summary>
    private async Task DeleteExistingVectorsAsync(Guid documentId, CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var vectorStore = scope.ServiceProvider.GetRequiredService<IVectorStore>();

        try
        {
            var prefix = documentId.ToString() + ":";
            var ids = (await vectorStore.ListIdsByPrefixAsync(prefix, cancellationToken)).ToArray();
            if (ids.Length == 0)
            {
                _logger.LogDebug("文档 {DocumentId} 无旧向量记录可删除", documentId);
                return;
            }

            await vectorStore.DeleteAsync(ids, cancellationToken);
            _logger.LogInformation("文档 {DocumentId} 已删除 {Count} 条旧向量记录", documentId, ids.Length);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "删除文档 {DocumentId} 旧向量记录时出错", documentId);
        }
    }
}

/// <summary>
/// 文档向量化服务扩展方法
/// </summary>
public static class DocumentVectorizationExtensions
{
    private static DocumentVectorizationService? _service;

    public static void SetDocumentVectorizationService(DocumentVectorizationService service)
    {
        _service = service;
    }

    /// <summary>
    /// 触发文档向量化
    /// </summary>
    public static void TriggerVectorization(Guid documentId)
    {
        _service?.EnqueueDocument(documentId);
    }
}
