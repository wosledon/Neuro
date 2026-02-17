using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Neuro.Api.Entity;
using DocumentEntity = Neuro.Api.Entity.MyDocument;
using Neuro.Api.Services;
using Neuro.EntityFrameworkCore.Extensions;
using Neuro.EntityFrameworkCore.Services;
using Neuro.Shared;
using Neuro.Shared.Dtos;

namespace Neuro.Api.Controllers;

/// <summary>
/// 文档管理控制器
/// </summary>
public class DocumentController : ApiControllerBase
{
    private readonly IUnitOfWork _db;
    public DocumentController(IUnitOfWork db) { _db = db; }

    /// <summary>
    /// 获取文档列表（分页）
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] DocumentListRequest request, [FromServices] IPermissionService permissionService)
    {
        request ??= new DocumentListRequest();

        // 获取用户可访问的文档ID列表
        var accessibleIds = await permissionService.GetAccessibleDocumentIdsAsync(UserId);
        if (accessibleIds.Count == 0)
            return Success(new PagedList<DocumentDetail>(new List<DocumentDetail>(), 0, request.Page, request.PageSize));

        var q = _db.Q<Entity.MyDocument>().AsNoTracking()
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
            Sort = d.Sort,
            IsFolder = d.IsFolder,
            CreatedAt = d.CreatedAt,
            UpdatedAt = d.UpdatedAt ?? d.CreatedAt
        }).ToPagedListAsync(request.Page, request.PageSize);

        return Success(paged);
    }

    /// <summary>
    /// 获取文档详情
    /// </summary>
    [HttpGet("detail")]
    public async Task<IActionResult> Get([FromQuery(Name = "id")] Guid id, [FromServices] IPermissionService permissionService)
    {
        // 检查用户是否有权访问该文档
        var canAccess = await permissionService.CanAccessDocumentAsync(UserId, id);
        if (!canAccess)
            return Failure("无权访问该文档。", 403);

        var d = await _db.Q<Entity.MyDocument>().FirstOrDefaultAsync(x => x.Id == id);
        if (d is null) return Failure("Document not found.", 404);
        
        var dto = new DocumentDetail 
        { 
            Id = d.Id, 
            ProjectId = d.ProjectId, 
            Title = d.Title, 
            Content = d.Content, 
            ParentId = d.ParentId, 
            TreePath = d.TreePath, 
            Sort = d.Sort,
            IsFolder = d.IsFolder,
            CreatedAt = d.CreatedAt,
            UpdatedAt = d.UpdatedAt ?? d.CreatedAt
        };
        return Success(dto);
    }

    /// <summary>
    /// 获取文档树结构（按需加载模式）
    /// 如果指定了 parentId，只加载该父节点下的子节点
    /// 如果指定了 projectId 但未指定 parentId，加载项目根文档下的子节点（不包含根文档本身）
    /// 如果都未指定，加载所有根节点（ParentId 为 null）
    /// </summary>
    [HttpGet("tree")]
    public async Task<IActionResult> GetTree(
        [FromQuery(Name = "projectId")] Guid? projectId, 
        [FromQuery(Name = "parentId")] Guid? parentId,
        [FromServices] IPermissionService permissionService)
    {
        // 获取用户可访问的文档ID列表
        var accessibleIds = await permissionService.GetAccessibleDocumentIdsAsync(UserId);
        if (accessibleIds.Count == 0)
            return Success(new List<DocumentTreeNode>());

        var query = _db.Q<Entity.MyDocument>().AsNoTracking()
            .Where(d => accessibleIds.Contains(d.Id));

        if (projectId.HasValue)
            query = query.Where(d => d.ProjectId == projectId.Value);

        // 按需加载逻辑
        if (parentId.HasValue)
        {
            // 如果指定了 parentId，只加载该父节点下的子节点
            query = query.Where(d => d.ParentId == parentId.Value);
        }
        else if (projectId.HasValue)
        {
            // 如果指定了 projectId 但未指定 parentId，加载项目根文档下的子节点
            // 先找到项目根文档
            var rootDocId = await _db.Q<Entity.MyDocument>().AsNoTracking()
                .Where(d => d.ProjectId == projectId.Value && d.ParentId == null)
                .Select(d => d.Id)
                .FirstOrDefaultAsync();
            
            // 加载根文档下的子节点
            query = query.Where(d => d.ParentId == rootDocId);
        }
        else
        {
            // 如果都未指定，加载所有根节点（ParentId 为 null）
            query = query.Where(d => d.ParentId == null);
        }

        // 先获取文档列表
        var docList = await query
            .OrderBy(d => d.IsFolder ? 0 : 1)
            .ThenBy(d => d.Sort)
            .ThenBy(d => d.Title)
            .ToListAsync();
        
        // 获取所有有子文档的文档ID（在可访问范围内）
        var docIds = docList.Select(d => d.Id).ToList();
        var docsWithChildren = await _db.Q<Entity.MyDocument>().AsNoTracking()
            .Where(d => accessibleIds.Contains(d.Id) && d.ParentId != null && docIds.Contains(d.ParentId.Value))
            .Select(d => d.ParentId!.Value)
            .Distinct()
            .ToListAsync();
        
        var documents = docList.Select(d => new DocumentTreeNode
        {
            Id = d.Id,
            ProjectId = d.ProjectId,
            Title = d.Title,
            Content = string.Empty,
            ParentId = d.ParentId,
            TreePath = d.TreePath,
            Sort = d.Sort,
            IsFolder = d.IsFolder,
            HasChildren = docsWithChildren.Contains(d.Id),
            CreatedAt = d.CreatedAt,
            UpdatedAt = d.UpdatedAt ?? d.CreatedAt
        }).ToList();

        return Success(documents);
    }

    /// <summary>
    /// 获取以项目为主节点的完整文档树
    /// 返回项目列表，每个项目下挂载该项目的文档树结构（不包含项目根文档本身）
    /// </summary>
    [HttpGet("tree-by-projects")]
    public async Task<IActionResult> GetTreeByProjects(
        [FromServices] IPermissionService permissionService)
    {
        // 获取用户可访问的项目ID列表
        var accessibleProjectIds = await permissionService.GetAccessibleProjectIdsAsync(UserId);
        if (accessibleProjectIds.Count == 0)
            return Success(new List<ProjectDocumentTreeNode>());

        // 获取所有可访问的项目
        var projects = await _db.Q<Project>().AsNoTracking()
            .Where(p => accessibleProjectIds.Contains(p.Id))
            .OrderBy(p => p.Name)
            .Select(p => new ProjectDocumentTreeNode
            {
                Id = p.Id,
                Name = p.Name,
                Code = p.Code,
                Description = p.Description,
                Documents = new List<DocumentTreeNode>()
            })
            .ToListAsync();

        // 获取用户可访问的文档ID列表
        var accessibleIds = await permissionService.GetAccessibleDocumentIdsAsync(UserId);
        if (accessibleIds.Count == 0)
            return Success(projects);

        // 为每个项目构建文档树
        foreach (var project in projects)
        {
            // 获取项目根文档ID
            var rootDocId = await _db.Q<Entity.MyDocument>().AsNoTracking()
                .Where(d => d.ProjectId == project.Id && d.ParentId == null)
                .Select(d => d.Id)
                .FirstOrDefaultAsync();

            // 只获取项目根文档下的子文档（排除根文档本身）
            var projectDocs = await _db.Q<Entity.MyDocument>().AsNoTracking()
                .Where(d => accessibleIds.Contains(d.Id) && d.ProjectId == project.Id && d.ParentId != null)
                .OrderBy(d => d.Sort)
                .ThenBy(d => d.Title)
                .Select(d => new DocumentTreeNode
                {
                    Id = d.Id,
                    ProjectId = d.ProjectId,
                    Title = d.Title,
                    Content = string.Empty,
                    ParentId = d.ParentId,
                    TreePath = d.TreePath,
                    Sort = d.Sort,
                    IsFolder = d.IsFolder,
                    HasChildren = false, // 稍后计算
                    CreatedAt = d.CreatedAt,
                    UpdatedAt = d.UpdatedAt ?? d.CreatedAt
                })
                .ToListAsync();

            // 构建树结构（以项目根文档的子文档作为根节点）
            var rootNodes = projectDocs.Where(d => d.ParentId == rootDocId).ToList();
            foreach (var node in rootNodes)
            {
                node.Children = BuildDocumentTreeRecursive(node, projectDocs);
            }
            
            // 排序根节点
            rootNodes = rootNodes
                .OrderBy(d => d.IsFolder ? 0 : 1)
                .ThenBy(d => d.Sort)
                .ThenBy(d => d.Title)
                .ToList();
            
            project.Documents = rootNodes;
            
            // 设置 HasChildren
            var docIds = projectDocs.Select(d => d.Id).ToHashSet();
            foreach (var doc in projectDocs)
            {
                doc.HasChildren = projectDocs.Any(d => d.ParentId == doc.Id);
            }
        }

        return Success(projects);
    }

    /// <summary>
    /// 递归构建文档树
    /// </summary>
    private List<DocumentTreeNode> BuildDocumentTreeRecursive(DocumentTreeNode parent, List<DocumentTreeNode> allNodes)
    {
        var children = allNodes.Where(d => d.ParentId == parent.Id).ToList();
        foreach (var child in children)
        {
            child.Children = BuildDocumentTreeRecursive(child, allNodes);
        }
        
        // 排序：文件夹在前，然后按 Sort，最后按 Title
        return children
            .OrderBy(d => d.IsFolder ? 0 : 1)
            .ThenBy(d => d.Sort)
            .ThenBy(d => d.Title)
            .ToList();
    }

    /// <summary>
    /// 获取指定文档的子节点（用于树形结构按需加载）
    /// </summary>
    [HttpGet("children")]
    public async Task<IActionResult> GetChildren(
        [FromQuery(Name = "parentId")] Guid parentId,
        [FromServices] IPermissionService permissionService)
    {
        // 获取用户可访问的文档ID列表
        var accessibleIds = await permissionService.GetAccessibleDocumentIdsAsync(UserId);
        if (accessibleIds.Count == 0)
            return Success(new List<DocumentTreeNode>());

        // 先获取子文档列表
        var docList = await _db.Q<Entity.MyDocument>().AsNoTracking()
            .Where(d => d.ParentId == parentId && accessibleIds.Contains(d.Id))
            .OrderBy(d => d.Sort)
            .ThenBy(d => d.Title)
            .ToListAsync();
        
        // 获取所有有子文档的文档ID（在可访问范围内）
        var docIds = docList.Select(d => d.Id).ToList();
        var docsWithChildren = await _db.Q<Entity.MyDocument>().AsNoTracking()
            .Where(d => accessibleIds.Contains(d.Id) && d.ParentId != null && docIds.Contains(d.ParentId.Value))
            .Select(d => d.ParentId!.Value)
            .Distinct()
            .ToListAsync();
        
        var documents = docList.Select(d => new DocumentTreeNode
        {
            Id = d.Id,
            ProjectId = d.ProjectId,
            Title = d.Title,
            Content = string.Empty,
            ParentId = d.ParentId,
            TreePath = d.TreePath,
            Sort = d.Sort,
            IsFolder = d.IsFolder,
            HasChildren = docsWithChildren.Contains(d.Id),
            CreatedAt = d.CreatedAt,
            UpdatedAt = d.UpdatedAt ?? d.CreatedAt
        }).ToList();

        return Success(documents);
    }

    /// <summary>
    /// 获取文档的完整路径（面包屑）
    /// </summary>
    [HttpGet("breadcrumb")]
    public async Task<IActionResult> GetBreadcrumb([FromQuery(Name = "id")] Guid id)
    {
        var document = await _db.Q<Entity.MyDocument>().AsNoTracking().FirstOrDefaultAsync(d => d.Id == id);
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
            var parent = await _db.Q<Entity.MyDocument>().AsNoTracking().FirstOrDefaultAsync(d => d.Id == currentId.Value);
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
        var document = await _db.Q<Entity.MyDocument>().FirstOrDefaultAsync(d => d.Id == request.Id);
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
            var document = await _db.Q<Entity.MyDocument>().FirstOrDefaultAsync(d => d.Id == docId);
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

    /// <summary>
    /// 创建或更新文档
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Upsert([FromBody] DocumentUpsertRequest req, [FromServices] DocumentVectorizationService vectorizationService)
    {
        if (req == null) return Failure("Invalid request.");
        
        if (req.Id.HasValue && req.Id != Guid.Empty)
        {
            // 更新
            var ent = await _db.Q<Entity.MyDocument>().FirstOrDefaultAsync(x => x.Id == req.Id.Value);
            if (ent is null) return Failure("Document not found.", 404);
            
            if (req.ProjectId.HasValue) ent.ProjectId = req.ProjectId.Value;
            if (!string.IsNullOrWhiteSpace(req.Title)) ent.Title = req.Title;
            if (!string.IsNullOrWhiteSpace(req.Content)) ent.Content = req.Content;
            if (req.ParentId.HasValue) ent.ParentId = req.ParentId;
            if (!string.IsNullOrWhiteSpace(req.TreePath)) ent.TreePath = req.TreePath;
            if (req.Sort.HasValue) ent.Sort = req.Sort.Value;
            if (req.IsFolder.HasValue) ent.IsFolder = req.IsFolder.Value;

            await _db.UpdateAsync(ent);
            await _db.SaveChangesAsync();

            // 触发文档向量化
            if (!ent.IsFolder)
            {
                vectorizationService.EnqueueDocument(ent.Id);
            }

            return Success(new UpsertResponse { Id = ent.Id });
        }

        // 创建
        if (!req.ProjectId.HasValue || string.IsNullOrWhiteSpace(req.Title)) 
            return Failure("ProjectId and Title required.");

        var nd = new DocumentEntity
        {
            Id = Guid.NewGuid(),
            ProjectId = req.ProjectId.Value,
            Title = req.Title!,
            Content = req.Content ?? string.Empty,
            ParentId = req.ParentId,
            TreePath = req.TreePath ?? string.Empty,
            Sort = req.Sort ?? 0,
            IsFolder = req.IsFolder ?? false
        };

        // 设置初始树路径
        await UpdateTreePathAsync(nd);

        await _db.AddAsync(nd);
        await _db.SaveChangesAsync();

        // 触发文档向量化（文件夹不需要向量化）
        if (!nd.IsFolder)
        {
            vectorizationService.EnqueueDocument(nd.Id);
        }

        return Success(new UpsertResponse { Id = nd.Id });
    }

    /// <summary>
    /// 删除文档（递归删除子文档）
    /// </summary>
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

        await _db.RemoveByIdsAsync<DocumentEntity>(allIds.Distinct().ToArray());
        await _db.SaveChangesAsync();
        return Success();
    }

    /// <summary>
    /// 手动触发文档向量化
    /// </summary>
    [HttpPost("vectorize")]
    public async Task<IActionResult> TriggerVectorization(
        [FromQuery] Guid id, 
        [FromServices] DocumentVectorizationService vectorizationService,
        [FromServices] IPermissionService permissionService)
    {
        // 检查用户是否有权访问该文档
        var canAccess = await permissionService.CanAccessDocumentAsync(UserId, id);
        if (!canAccess)
            return Failure("无权访问该文档。", 403);

        var document = await _db.Q<Entity.MyDocument>().FirstOrDefaultAsync(d => d.Id == id);
        if (document == null)
            return Failure("文档不存在", 404);

        // 文件夹不需要向量化
        if (document.IsFolder)
            return Failure("文件夹不需要向量化", 400);

        // 重置向量化时间，强制重新向量化
        document.VectorizedAt = null;
        await _db.UpdateAsync(document);
        await _db.SaveChangesAsync();

        // 触发向量化
        vectorizationService.EnqueueDocument(id);

        return Success(new { message = "文档向量化已触发", documentId = id });
    }

    /// <summary>
    /// 批量触发项目下所有文档的向量化
    /// </summary>
    [HttpPost("vectorize-project")]
    public async Task<IActionResult> TriggerProjectVectorization(
        [FromQuery] Guid projectId,
        [FromServices] DocumentVectorizationService vectorizationService,
        [FromServices] IPermissionService permissionService)
    {
        // 获取用户可访问的文档ID列表
        var accessibleIds = await permissionService.GetAccessibleDocumentIdsAsync(UserId);
        if (accessibleIds.Count == 0)
            return Success(new { message = "没有可向量化的文档", count = 0 });

        // 获取项目下所有非文件夹文档
        var documents = await _db.Q<Entity.MyDocument>()
            .Where(d => d.ProjectId == projectId && !d.IsFolder && accessibleIds.Contains(d.Id))
            .Select(d => d.Id)
            .ToListAsync();

        int count = 0;
        foreach (var docId in documents)
        {
            vectorizationService.EnqueueDocument(docId);
            count++;
        }

        return Success(new { message = $"项目文档向量化已触发，共 {count} 个文档", count });
    }

    #region 私有辅助方法

    /// <summary>
    /// 构建文档树结构
    /// </summary>
    private List<DocumentTreeNode> BuildDocumentTree(List<DocumentTreeNode> documents)
    {
        var nodeMap = documents.ToDictionary(d => d.Id);
        var rootNodes = new List<DocumentTreeNode>();

        foreach (var node in documents)
        {
            if (node.ParentId.HasValue && nodeMap.TryGetValue(node.ParentId.Value, out var parent))
            {
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

    /// <summary>
    /// 递归排序树节点
    /// </summary>
    private void SortTreeNodes(List<DocumentTreeNode> nodes)
    {
        nodes.Sort((a, b) =>
        {
            // 文件夹排在前面
            if (a.IsFolder != b.IsFolder)
                return a.IsFolder ? -1 : 1;
            
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

    /// <summary>
    /// 递归收集子文档ID
    /// </summary>
    private async Task CollectChildIdsAsync(Guid parentId, List<Guid> result)
    {
        var children = await _db.Q<Entity.MyDocument>().AsNoTracking()
            .Where(d => d.ParentId == parentId)
            .Select(d => d.Id)
            .ToListAsync();

        foreach (var childId in children)
        {
            result.Add(childId);
            await CollectChildIdsAsync(childId, result);
        }
    }

    /// <summary>
    /// 检查 potentialChildId 是否是 parentId 的子文档
    /// </summary>
    private async Task<bool> IsChildDocumentAsync(Guid parentId, Guid potentialChildId)
    {
        var currentId = potentialChildId;
        while (true)
        {
            var doc = await _db.Q<Entity.MyDocument>().AsNoTracking()
                .FirstOrDefaultAsync(d => d.Id == currentId);
            if (doc?.ParentId == null) return false;
            if (doc.ParentId == parentId) return true;
            currentId = doc.ParentId.Value;
        }
    }

    /// <summary>
    /// 更新文档的树路径
    /// </summary>
    private async Task UpdateTreePathAsync(Entity.MyDocument document)
    {
        if (!document.ParentId.HasValue)
        {
            document.TreePath = "/" + document.Id;
            return;
        }

        var parent = await _db.Q<Entity.MyDocument>().AsNoTracking()
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
    public bool IsFolder { get; set; }
    public bool HasChildren { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<DocumentTreeNode>? Children { get; set; }
}

/// <summary>
/// 项目文档树节点（用于文档管理页面，以项目为主节点）
/// </summary>
public class ProjectDocumentTreeNode
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<DocumentTreeNode> Documents { get; set; } = new();
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
