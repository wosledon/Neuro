using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Neuro.Api.Entity;
using Neuro.Api.Services;
using Neuro.EntityFrameworkCore.Extensions;
using Neuro.EntityFrameworkCore.Services;
using Neuro.Shared;
using Neuro.Shared.Dtos;

namespace Neuro.Api.Controllers;

public class DocumentController : ApiControllerBase
{
    private readonly IUnitOfWork _db;
    public DocumentController(IUnitOfWork db) { _db = db; }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] DocumentListRequest request, [FromServices] IPermissionService permissionService)
    {
        request ??= new DocumentListRequest();

        // 获取用户可访问的文档ID列表
        var accessibleIds = await permissionService.GetAccessibleDocumentIdsAsync(UserId);
        if (accessibleIds.Count == 0)
            return Success(new PagedList<DocumentDetail>(new List<DocumentDetail>(), 0, request.Page, request.PageSize));

        var q = _db.Q<Document>().AsNoTracking()
            .Where(d => accessibleIds.Contains(d.Id))
            .WhereNotNullOrWhiteSpace(request.Keyword, (src, k) => src.Where(d => EF.Functions.Like(d.Title, $"%{k}%")))
            .OrderByDescending(d => d.CreatedAt);

        var paged = await q.Select(d => new DocumentDetail
        {
            Id = d.Id,
            ProjectId = d.ProjectId,
            Title = d.Title,
            Content = d.Content,
            ParentId = d.ParentId,
            TreePath = d.TreePath,
            Sort = d.Sort
        }).ToPagedListAsync(request.Page, request.PageSize);
        return Success(paged);
    }

    /// <summary>
    /// 获取文档树结构
    /// </summary>
    [HttpGet("tree")]
    public async Task<IActionResult> GetTree([FromQuery] Guid? projectId, [FromServices] IPermissionService permissionService)
    {
        // 获取用户可访问的文档ID列表
        var accessibleIds = await permissionService.GetAccessibleDocumentIdsAsync(UserId);
        if (accessibleIds.Count == 0)
            return Success(new List<DocumentTreeNode>());

        var query = _db.Q<Document>().AsNoTracking()
            .Where(d => accessibleIds.Contains(d.Id));

        if (projectId.HasValue)
            query = query.Where(d => d.ProjectId == projectId.Value);

        var documents = await query
            .OrderBy(d => d.TreePath)
            .ThenBy(d => d.Sort)
            .ThenBy(d => d.Title)
            .Select(d => new DocumentTreeNode
            {
                Id = d.Id,
                ProjectId = d.ProjectId,
                Title = d.Title,
                // 只取内容前100字符作为预览，减少数据传输
                Content = d.Content != null && d.Content.Length > 100 
                    ? d.Content.Substring(0, 100) + "..." 
                    : d.Content,
                ParentId = d.ParentId,
                TreePath = d.TreePath,
                Sort = d.Sort,
                HasChildren = _db.Q<Document>().Any(x => x.ParentId == d.Id),
                CreatedAt = d.CreatedAt,
                UpdatedAt = d.UpdatedAt ?? d.CreatedAt
            })
            .ToListAsync();

        // 构建树结构
        var tree = BuildDocumentTree(documents);
        return Success(tree);
    }

    /// <summary>
    /// 获取文档的完整路径（面包屑）
    /// </summary>
    [HttpGet("breadcrumb")]
    public async Task<IActionResult> GetBreadcrumb([FromQuery] Guid id)
    {
        var document = await _db.Q<Document>().AsNoTracking().FirstOrDefaultAsync(d => d.Id == id);
        if (document == null)
            return Failure("文档不存在", 404);

        var breadcrumb = new List<DocumentBreadcrumbItem>();
        
        // 添加当前文档
        breadcrumb.Add(new DocumentBreadcrumbItem
        {
            Id = document.Id,
            Title = document.Title,
            IsCurrent = true
        });

        // 递归获取父文档
        var currentId = document.ParentId;
        while (currentId.HasValue)
        {
            var parent = await _db.Q<Document>().AsNoTracking().FirstOrDefaultAsync(d => d.Id == currentId.Value);
            if (parent == null) break;

            breadcrumb.Insert(0, new DocumentBreadcrumbItem
            {
                Id = parent.Id,
                Title = parent.Title,
                IsCurrent = false
            });
            currentId = parent.ParentId;
        }

        return Success(breadcrumb);
    }

    /// <summary>
    /// 移动文档（拖拽排序/改变父节点）
    /// </summary>
    [HttpPost("move")]
    public async Task<IActionResult> Move([FromBody] DocumentMoveRequest request)
    {
        var document = await _db.Q<Document>().FirstOrDefaultAsync(d => d.Id == request.Id);
        if (document == null)
            return Failure("文档不存在", 404);

        // 检查循环引用
        if (request.NewParentId.HasValue)
        {
            if (request.NewParentId == request.Id)
                return Failure("不能将文档移动到自身下");

            // 检查目标是否是当前文档的子文档
            var isChild = await IsChildDocumentAsync(request.Id, request.NewParentId.Value);
            if (isChild)
                return Failure("不能将文档移动到其子文档下");
        }

        // 更新父节点
        document.ParentId = request.NewParentId;
        document.Sort = request.NewSort ?? document.Sort;

        // 更新树路径
        await UpdateTreePathAsync(document);

        await _db.UpdateAsync(document);
        await _db.SaveChangesAsync();

        return Success(new UpsertResponse { Id = document.Id });
    }

    /// <summary>
    /// 批量移动文档
    /// </summary>
    [HttpPost("batch-move")]
    public async Task<IActionResult> BatchMove([FromBody] DocumentBatchMoveRequest request)
    {
        if (request.DocumentIds == null || request.DocumentIds.Count == 0)
            return Failure("请选择要移动的文档");

        int sort = request.StartSort ?? 0;
        foreach (var docId in request.DocumentIds)
        {
            var document = await _db.Q<Document>().FirstOrDefaultAsync(d => d.Id == docId);
            if (document == null) continue;

            // 检查循环引用
            if (request.NewParentId.HasValue)
            {
                if (request.NewParentId == docId) continue;
                var isChild = await IsChildDocumentAsync(docId, request.NewParentId.Value);
                if (isChild) continue;
            }

            document.ParentId = request.NewParentId;
            document.Sort = sort++;
            await UpdateTreePathAsync(document);
            await _db.UpdateAsync(document);
        }

        await _db.SaveChangesAsync();
        return Success();
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] Guid id, [FromServices] IPermissionService permissionService)
    {
        // 检查用户是否有权访问该文档
        var canAccess = await permissionService.CanAccessDocumentAsync(UserId, id);
        if (!canAccess)
            return Failure("无权访问该文档。", 403);

        var d = await _db.Q<Document>().FirstOrDefaultAsync(x => x.Id == id);
        if (d is null) return Failure("Document not found.", 404);
        var dto = new DocumentDetail { Id = d.Id, ProjectId = d.ProjectId, Title = d.Title, Content = d.Content, ParentId = d.ParentId, TreePath = d.TreePath, Sort = d.Sort };
        return Success(dto);
    }

    [HttpPost]
    public async Task<IActionResult> Upsert([FromBody] DocumentUpsertRequest req)
    {
        if (req == null) return Failure("Invalid request.");
        if (req.Id.HasValue && req.Id != Guid.Empty)
        {
            var ent = await _db.Q<Document>().FirstOrDefaultAsync(x => x.Id == req.Id.Value);
            if (ent is null) return Failure("Document not found.", 404);
            if (req.ProjectId.HasValue) ent.ProjectId = req.ProjectId.Value;
            if (!string.IsNullOrWhiteSpace(req.Title)) ent.Title = req.Title;
            if (!string.IsNullOrWhiteSpace(req.Content)) ent.Content = req.Content;
            if (req.ParentId.HasValue) ent.ParentId = req.ParentId;
            if (!string.IsNullOrWhiteSpace(req.TreePath)) ent.TreePath = req.TreePath;
            if (req.Sort.HasValue) ent.Sort = req.Sort.Value;

            await _db.UpdateAsync(ent);
            await _db.SaveChangesAsync();
            return Success(new UpsertResponse { Id = ent.Id });
        }

        if (!req.ProjectId.HasValue || string.IsNullOrWhiteSpace(req.Title)) return Failure("ProjectId and Title required.");
        
        var nd = new Document 
        { 
            ProjectId = req.ProjectId.Value, 
            Title = req.Title!, 
            Content = req.Content ?? string.Empty, 
            ParentId = req.ParentId, 
            TreePath = req.TreePath ?? string.Empty, 
            Sort = req.Sort ?? 0 
        };

        // 设置初始树路径
        await UpdateTreePathAsync(nd);

        await _db.AddAsync(nd);
        await _db.SaveChangesAsync();
        return Success(new UpsertResponse { Id = nd.Id });
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] BatchDeleteRequest ids)
    {
        if (ids == null || ids.Ids == null || ids.Ids.Length == 0) return Failure("No ids provided.");

        // 递归获取所有子文档ID
        var allIds = new List<Guid>();
        foreach (var id in ids.Ids)
        {
            allIds.Add(id);
            await CollectChildIdsAsync(id, allIds);
        }

        await _db.RemoveByIdsAsync<Document>(allIds.Distinct().ToArray());
        await _db.SaveChangesAsync();
        return Success();
    }

    #region 私有辅助方法

    private List<DocumentTreeNode> BuildDocumentTree(List<DocumentTreeNode> documents)
    {
        var nodeMap = documents.ToDictionary(d => d.Id);
        var rootNodes = new List<DocumentTreeNode>();

        foreach (var node in documents)
        {
            if (node.ParentId.HasValue && nodeMap.ContainsKey(node.ParentId.Value))
            {
                var parent = nodeMap[node.ParentId.Value];
                parent.Children ??= new List<DocumentTreeNode>();
                parent.Children.Add(node);
            }
            else
            {
                rootNodes.Add(node);
            }
        }

        // 递归排序
        SortTreeNodes(rootNodes);
        return rootNodes;
    }

    private void SortTreeNodes(List<DocumentTreeNode> nodes)
    {
        nodes.Sort((a, b) =>
        {
            var sortCompare = a.Sort.CompareTo(b.Sort);
            return sortCompare != 0 ? sortCompare : string.Compare(a.Title, b.Title, StringComparison.Ordinal);
        });

        foreach (var node in nodes)
        {
            if (node.Children?.Count > 0)
            {
                SortTreeNodes(node.Children);
            }
        }
    }

    private async Task CollectChildIdsAsync(Guid parentId, List<Guid> result)
    {
        var children = await _db.Q<Document>().AsNoTracking()
            .Where(d => d.ParentId == parentId)
            .Select(d => d.Id)
            .ToListAsync();

        foreach (var childId in children)
        {
            result.Add(childId);
            await CollectChildIdsAsync(childId, result);
        }
    }

    private async Task<bool> IsChildDocumentAsync(Guid parentId, Guid potentialChildId)
    {
        var currentId = potentialChildId;
        while (true)
        {
            var doc = await _db.Q<Document>().AsNoTracking()
                .FirstOrDefaultAsync(d => d.Id == currentId);
            if (doc?.ParentId == null) return false;
            if (doc.ParentId == parentId) return true;
            currentId = doc.ParentId.Value;
        }
    }

    private async Task UpdateTreePathAsync(Document document)
    {
        if (!document.ParentId.HasValue)
        {
            document.TreePath = "/" + document.Id;
            return;
        }

        var parent = await _db.Q<Document>().AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == document.ParentId.Value);
        
        if (parent != null)
        {
            document.TreePath = parent.TreePath + "/" + document.Id;
        }
        else
        {
            document.TreePath = "/" + document.Id;
        }
    }

    #endregion
}

/// <summary>
/// 文档树节点
/// </summary>
public class DocumentTreeNode
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public Guid? ParentId { get; set; }
    public string TreePath { get; set; } = string.Empty;
    public int Sort { get; set; }
    public bool HasChildren { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<DocumentTreeNode>? Children { get; set; }
}

/// <summary>
/// 面包屑项
/// </summary>
public class DocumentBreadcrumbItem
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public bool IsCurrent { get; set; }
}

/// <summary>
/// 文档移动请求
/// </summary>
public class DocumentMoveRequest
{
    public Guid Id { get; set; }
    public Guid? NewParentId { get; set; }
    public int? NewSort { get; set; }
}

/// <summary>
/// 批量移动请求
/// </summary>
public class DocumentBatchMoveRequest
{
    public List<Guid> DocumentIds { get; set; } = new();
    public Guid? NewParentId { get; set; }
    public int? StartSort { get; set; }
}
