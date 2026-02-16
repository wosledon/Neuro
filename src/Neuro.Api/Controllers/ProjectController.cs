using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Neuro.Api.Entity;
using Neuro.Api.Services;
using Neuro.EntityFrameworkCore.Extensions;
using Neuro.EntityFrameworkCore.Services;
using Neuro.Shared.Dtos;
using Neuro.Shared.Enums;

namespace Neuro.Api.Controllers;

public class ProjectController : ApiControllerBase
{
    private readonly IUnitOfWork _db;
    public ProjectController(IUnitOfWork db) { _db = db; }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] ProjectListRequest request)
    {
        request ??= new ProjectListRequest();
        var q = _db.Q<Project>().AsNoTracking()
            .WhereNotNullOrWhiteSpace(request.Keyword, (src, k) => src.Where(p => EF.Functions.Like(p.Name, $"%{k}%") || EF.Functions.Like(p.Code, $"%{k}%")))
            .OrderByDescending(p => p.CreatedAt);

        var paged = await q
            .GroupJoin(
                _db.Q<GitCredential>().AsNoTracking(),
                p => p.GitCredentialId,
                g => g.Id,
                (p, g) => new { p, g })
            .SelectMany(
                x => x.g.DefaultIfEmpty(),
                (x, g) => new { x.p, GitCredential = g })
            .GroupJoin(
                _db.Q<AISupport>().AsNoTracking(),
                x => x.p.AISupportId,
                a => a.Id,
                (x, a) => new { x.p, x.GitCredential, a })
            .SelectMany(
                x => x.a.DefaultIfEmpty(),
                (x, a) => new { x.p, x.GitCredential, AISupport = a })
            .Select(x => new ProjectDetail
            {
                Id = x.p.Id,
                Name = x.p.Name,
                Code = x.p.Code,
                Type = x.p.Type,
                Description = x.p.Description,
                IsEnabled = x.p.IsEnabled,
                Status = x.p.Status,
                IsPin = x.p.IsPin,
                ParentId = x.p.ParentId,
                TreePath = x.p.TreePath,
                RepositoryUrl = x.p.RepositoryUrl,
                HomepageUrl = x.p.HomepageUrl,
                DocsUrl = x.p.DocsUrl,
                Sort = x.p.Sort,
                GitCredentialId = x.p.GitCredentialId,
                GitCredentialName = x.GitCredential != null ? x.GitCredential.Name : null,
                AISupportId = x.p.AISupportId,
                AISupportName = x.AISupport != null ? x.AISupport.Name : null,
                EnableAIDocs = x.p.EnableAIDocs
            }).ToPagedListAsync(request.Page, request.PageSize);

        return Success(paged);
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] Guid id)
    {
        var p = await _db.Q<Project>().FirstOrDefaultAsync(x => x.Id == id);
        if (p is null) return Failure("Project not found.", 404);

        var gitCredentialName = await _db.Q<GitCredential>()
            .Where(g => g.Id == p.GitCredentialId)
            .Select(g => g.Name)
            .FirstOrDefaultAsync();

        var aiSupportName = await _db.Q<AISupport>()
            .Where(a => a.Id == p.AISupportId)
            .Select(a => a.Name)
            .FirstOrDefaultAsync();

        return Success(new ProjectDetail
        {
            Id = p.Id,
            Name = p.Name,
            Code = p.Code,
            Type = p.Type,
            Description = p.Description,
            IsEnabled = p.IsEnabled,
            Status = p.Status,
            IsPin = p.IsPin,
            ParentId = p.ParentId,
            TreePath = p.TreePath,
            RepositoryUrl = p.RepositoryUrl,
            HomepageUrl = p.HomepageUrl,
            DocsUrl = p.DocsUrl,
            Sort = p.Sort,
            GitCredentialId = p.GitCredentialId,
            GitCredentialName = gitCredentialName,
            AISupportId = p.AISupportId,
            AISupportName = aiSupportName,
            EnableAIDocs = p.EnableAIDocs
        });
    }

    [HttpPost]
    public async Task<IActionResult> Upsert([FromBody] ProjectUpsertRequest req)
    {
        if (req == null) return Failure("Invalid request.");
        if (req.Id.HasValue && req.Id != Guid.Empty)
        {
            var ent = await _db.Q<Project>().FirstOrDefaultAsync(x => x.Id == req.Id.Value);
            if (ent is null) return Failure("Project not found.", 404);
            if (!string.IsNullOrWhiteSpace(req.Name)) ent.Name = req.Name;
            if (!string.IsNullOrWhiteSpace(req.Code)) ent.Code = req.Code;
            if (req.Type.HasValue) ent.Type = req.Type.Value;
            if (!string.IsNullOrWhiteSpace(req.Description)) ent.Description = req.Description;
            if (req.IsEnabled.HasValue) ent.IsEnabled = req.IsEnabled.Value;
            if (req.Status.HasValue) ent.Status = req.Status.Value;
            if (req.IsPin.HasValue) ent.IsPin = req.IsPin.Value;
            if (req.ParentId.HasValue) ent.ParentId = req.ParentId;
            if (!string.IsNullOrWhiteSpace(req.TreePath)) ent.TreePath = req.TreePath;
            if (!string.IsNullOrWhiteSpace(req.RepositoryUrl)) ent.RepositoryUrl = req.RepositoryUrl;
            if (!string.IsNullOrWhiteSpace(req.HomepageUrl)) ent.HomepageUrl = req.HomepageUrl;
            if (!string.IsNullOrWhiteSpace(req.DocsUrl)) ent.DocsUrl = req.DocsUrl;
            if (req.Sort.HasValue) ent.Sort = req.Sort.Value;
            if (req.GitCredentialId.HasValue) ent.GitCredentialId = req.GitCredentialId;
            if (req.AISupportId.HasValue) ent.AISupportId = req.AISupportId;
            if (req.EnableAIDocs.HasValue) ent.EnableAIDocs = req.EnableAIDocs.Value;

            await _db.UpdateAsync(ent);
            await _db.SaveChangesAsync();
            return Success(new UpsertResponse { Id = ent.Id });
        }

        if (string.IsNullOrWhiteSpace(req.Name)) return Failure("Name required.");

        var np = new Project
        {
            Name = req.Name!,
            Code = req.Code ?? string.Empty,
            Type = req.Type ?? ProjectTypeEnum.Document,
            Description = req.Description ?? string.Empty,
            IsEnabled = req.IsEnabled ?? true,
            Status = req.Status ?? ProjectStatusEnum.Active,
            IsPin = req.IsPin ?? false,
            ParentId = req.ParentId,
            TreePath = req.TreePath ?? string.Empty,
            RepositoryUrl = req.RepositoryUrl ?? string.Empty,
            HomepageUrl = req.HomepageUrl ?? string.Empty,
            DocsUrl = req.DocsUrl ?? string.Empty,
            Sort = req.Sort ?? 0,
            GitCredentialId = req.GitCredentialId,
            AISupportId = req.AISupportId,
            EnableAIDocs = req.EnableAIDocs ?? false
        };

        await _db.AddAsync(np);
        await _db.SaveChangesAsync();
        return Success(new UpsertResponse { Id = np.Id });
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] BatchDeleteRequest ids)
    {
        if (ids == null || ids.Ids == null || ids.Ids.Length == 0) return Failure("No ids provided.");
        await _db.RemoveByIdsAsync<Project>(ids.Ids);
        await _db.SaveChangesAsync();
        return Success();
    }

    /// <summary>
    /// 触发项目文档生成
    /// </summary>
    [HttpPost("generate-docs")]
    public async Task<IActionResult> GenerateDocs([FromQuery] Guid id)
    {
        var project = await _db.Q<Project>().FirstOrDefaultAsync(p => p.Id == id);
        if (project == null) return Failure("Project not found.", 404);

        // 检查项目是否有仓库地址或是文档类型
        if (project.Type != ProjectTypeEnum.Document && string.IsNullOrWhiteSpace(project.RepositoryUrl))
        {
            return Failure("项目没有配置仓库地址");
        }

        // 更新状态为待处理
        project.DocGenStatus = ProjectDocGenStatus.Pending;
        await _db.SaveChangesAsync();

        // 触发文档生成
        ProjectDocGenerationExtensions.TriggerDocGeneration(id);

        return Success(new { message = "文档生成已触发", projectId = id });
    }
}
