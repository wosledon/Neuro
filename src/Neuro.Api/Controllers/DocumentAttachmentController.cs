using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Neuro.Api.Entity;
using DocumentEntity = Neuro.Api.Entity.MyDocument;
using Neuro.EntityFrameworkCore.Services;
using Neuro.Storage.Abstractions;
using Neuro.Storage.Enums;
using Neuro.Shared.Dtos;

namespace Neuro.Api.Controllers;

/// <summary>
/// 文档附件管理控制器
/// </summary>
[Route("api/[controller]")]
public class DocumentAttachmentController : ApiControllerBase
{
    private readonly IUnitOfWork _db;
    private readonly IFileStorage _fileStorage;

    public DocumentAttachmentController(IUnitOfWork db, IFileStorage fileStorage)
    {
        _db = db;
        _fileStorage = fileStorage;
    }

    /// <summary>
    /// 获取文档的附件列表
    /// </summary>
    [HttpGet("list")]
    public async Task<IActionResult> List([FromQuery] Guid documentId)
    {
        var attachments = await _db.Q<DocumentAttachment>()
            .AsNoTracking()
            .Where(a => a.DocumentId == documentId)
            .OrderBy(a => a.Sort)
            .ThenBy(a => a.CreatedAt)
            .Select(a => new DocumentAttachmentDetail
            {
                Id = a.Id,
                DocumentId = a.DocumentId,
                FileName = a.FileName,
                StorageKey = a.StorageKey,
                FileSize = a.FileSize,
                MimeType = a.MimeType,
                FileHash = a.FileHash,
                IsInline = a.IsInline,
                Sort = a.Sort,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync();

        return Success(attachments);
    }

    /// <summary>
    /// 上传文件并关联到文档
    /// </summary>
    [HttpPost("upload")]
    [RequestSizeLimit(100 * 1024 * 1024)] // 100MB
    public async Task<IActionResult> Upload([FromForm] DocumentAttachmentUploadRequest request)
    {
        if (request.File == null || request.File.Length == 0)
            return Failure("请选择要上传的文件");

        // 检查文档是否存在
        var documentExists = await _db.Q<DocumentEntity>().AnyAsync(d => d.Id == request.DocumentId);
        if (!documentExists)
            return Failure("文档不存在", 404);

        // 保存文件到存储
        string storageKey;
        await using (var stream = request.File.OpenReadStream())
        {
            storageKey = await _fileStorage.SaveAsync(stream, request.File.FileName, StorageTypeEnum.Permanent);
        }

        // 创建附件记录
        var attachment = new DocumentAttachment
        {
            DocumentId = request.DocumentId,
            FileName = request.File.FileName,
            StorageKey = storageKey,
            FileSize = request.File.Length,
            MimeType = request.File.ContentType,
            IsInline = request.IsInline,
            Sort = request.Sort ?? 0
        };

        await _db.AddAsync(attachment);
        await _db.SaveChangesAsync();

        return Success(new DocumentAttachmentDetail
        {
            Id = attachment.Id,
            DocumentId = attachment.DocumentId,
            FileName = attachment.FileName,
            StorageKey = attachment.StorageKey,
            FileSize = attachment.FileSize,
            MimeType = attachment.MimeType,
            IsInline = attachment.IsInline,
            Sort = attachment.Sort,
            CreatedAt = attachment.CreatedAt
        });
    }

    /// <summary>
    /// 批量上传文件
    /// </summary>
    [HttpPost("batch-upload")]
    [RequestSizeLimit(200 * 1024 * 1024)] // 200MB
    public async Task<IActionResult> BatchUpload([FromForm] DocumentAttachmentBatchUploadRequest request)
    {
        if (request.Files == null || request.Files.Count == 0)
            return Failure("请选择要上传的文件");

        // 检查文档是否存在
        var documentExists = await _db.Q<DocumentEntity>().AnyAsync(d => d.Id == request.DocumentId);
        if (!documentExists)
            return Failure("文档不存在", 404);

        var results = new List<DocumentAttachmentDetail>();
        int sortOrder = request.StartSort ?? 0;

        foreach (var file in request.Files)
        {
            if (file.Length == 0) continue;

            // 保存文件
            string storageKey;
            await using (var stream = file.OpenReadStream())
            {
                storageKey = await _fileStorage.SaveAsync(stream, file.FileName, StorageTypeEnum.Permanent);
            }

            // 判断是否为内联类型
            bool isInline = IsInlineMimeType(file.ContentType);

            // 创建附件记录
            var attachment = new DocumentAttachment
            {
                DocumentId = request.DocumentId,
                FileName = file.FileName,
                StorageKey = storageKey,
                FileSize = file.Length,
                MimeType = file.ContentType,
                IsInline = isInline,
                Sort = sortOrder++
            };

            await _db.AddAsync(attachment);
            results.Add(new DocumentAttachmentDetail
            {
                Id = attachment.Id,
                DocumentId = attachment.DocumentId,
                FileName = attachment.FileName,
                StorageKey = attachment.StorageKey,
                FileSize = attachment.FileSize,
                MimeType = attachment.MimeType,
                IsInline = attachment.IsInline,
                Sort = attachment.Sort,
                CreatedAt = attachment.CreatedAt
            });
        }

        await _db.SaveChangesAsync();
        return Success(results);
    }

    /// <summary>
    /// 下载附件
    /// </summary>
    [HttpGet("download")]
    public async Task<IActionResult> Download([FromQuery] Guid id)
    {
        var attachment = await _db.Q<DocumentAttachment>().FirstOrDefaultAsync(a => a.Id == id);
        if (attachment == null)
            return Failure("附件不存在", 404);

        var stream = await _fileStorage.GetAsync(attachment.StorageKey);
        return File(stream, attachment.MimeType ?? "application/octet-stream", attachment.FileName);
    }

    /// <summary>
    /// 获取文件内容（用于图片预览等）
    /// </summary>
    [HttpGet("content")]
    public async Task<IActionResult> Content([FromQuery] Guid id)
    {
        var attachment = await _db.Q<DocumentAttachment>().FirstOrDefaultAsync(a => a.Id == id);
        if (attachment == null)
            return Failure("附件不存在", 404);

        var stream = await _fileStorage.GetAsync(attachment.StorageKey);
        return File(stream, attachment.MimeType ?? "application/octet-stream");
    }

    /// <summary>
    /// 更新附件信息
    /// </summary>
    [HttpPost("update")]
    public async Task<IActionResult> Update([FromBody] DocumentAttachmentUpdateRequest request)
    {
        var attachment = await _db.Q<DocumentAttachment>().FirstOrDefaultAsync(a => a.Id == request.Id);
        if (attachment == null)
            return Failure("附件不存在", 404);

        if (!string.IsNullOrWhiteSpace(request.FileName))
            attachment.FileName = request.FileName;
        if (request.IsInline.HasValue)
            attachment.IsInline = request.IsInline.Value;
        if (request.Sort.HasValue)
            attachment.Sort = request.Sort.Value;

        await _db.UpdateAsync(attachment);
        await _db.SaveChangesAsync();

        return Success(new UpsertResponse { Id = attachment.Id });
    }

    /// <summary>
    /// 删除附件
    /// </summary>
    [HttpPost("delete")]
    public async Task<IActionResult> Delete([FromBody] BatchDeleteRequest request)
    {
        if (request?.Ids == null || request.Ids.Length == 0)
            return Failure("请选择要删除的附件");

        foreach (var id in request.Ids)
        {
            var attachment = await _db.Q<DocumentAttachment>().FirstOrDefaultAsync(a => a.Id == id);
            if (attachment != null)
            {
                // 删除存储的文件
                try
                {
                    await _fileStorage.DeleteAsync(attachment.StorageKey);
                }
                catch
                {
                    // 忽略存储删除错误，继续删除数据库记录
                }

                await _db.RemoveAsync(attachment);
            }
        }

        await _db.SaveChangesAsync();
        return Success();
    }

    /// <summary>
    /// 获取Markdown格式的文件引用
    /// </summary>
    [HttpGet("markdown-link")]
    public async Task<IActionResult> GetMarkdownLink([FromQuery] Guid id)
    {
        var attachment = await _db.Q<DocumentAttachment>().FirstOrDefaultAsync(a => a.Id == id);
        if (attachment == null)
            return Failure("附件不存在", 404);

        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        var link = attachment.IsInline && IsImageMimeType(attachment.MimeType)
            ? $"![{attachment.FileName}]({baseUrl}/api/documentattachment/content?id={id})"
            : $"[{attachment.FileName}]({baseUrl}/api/documentattachment/download?id={id})";

        return Success(new { markdown = link, html = $"<a href=\"{baseUrl}/api/documentattachment/download?id={id}\">{attachment.FileName}</a>" });
    }

    private static bool IsInlineMimeType(string? mimeType)
    {
        if (string.IsNullOrEmpty(mimeType)) return false;
        return mimeType.StartsWith("image/") ||
               mimeType.StartsWith("video/") ||
               mimeType.StartsWith("audio/");
    }

    private static bool IsImageMimeType(string? mimeType)
    {
        if (string.IsNullOrEmpty(mimeType)) return false;
        return mimeType.StartsWith("image/");
    }
}

/// <summary>
/// 文档附件详情DTO
/// </summary>
public class DocumentAttachmentDetail
{
    public Guid Id { get; set; }
    public Guid DocumentId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string StorageKey { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string? MimeType { get; set; }
    public string? FileHash { get; set; }
    public bool IsInline { get; set; }
    public int Sort { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// 单文件上传请求
/// </summary>
public class DocumentAttachmentUploadRequest
{
    public Guid DocumentId { get; set; }
    public IFormFile File { get; set; } = null!;
    public bool IsInline { get; set; } = false;
    public int? Sort { get; set; }
}

/// <summary>
/// 批量上传请求
/// </summary>
public class DocumentAttachmentBatchUploadRequest
{
    public Guid DocumentId { get; set; }
    public List<IFormFile> Files { get; set; } = new();
    public int? StartSort { get; set; }
}

/// <summary>
/// 附件更新请求
/// </summary>
public class DocumentAttachmentUpdateRequest
{
    public Guid Id { get; set; }
    public string? FileName { get; set; }
    public bool? IsInline { get; set; }
    public int? Sort { get; set; }
}
