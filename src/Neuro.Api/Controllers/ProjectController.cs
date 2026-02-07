using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Neuro.Api.Entity;
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

        var paged = await q.Select(p => new ProjectDetail
        {
            Id = p.Id,
            Name = p.Name,
            Code = p.Code,
            Type = p.Type,
            Description = p.Description,
            IsEnabled = p.IsEnabled,
            IsPin = p.IsPin,
            ParentId = p.ParentId,
            TreePath = p.TreePath,
            RepositoryUrl = p.RepositoryUrl,
            HomepageUrl = p.HomepageUrl,
            DocsUrl = p.DocsUrl,
            Sort = p.Sort
        }).ToPagedListAsync(request.Page, request.PageSize);

        return Success(paged);
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] Guid id)
    {
        var p = await _db.Q<Project>().FirstOrDefaultAsync(x => x.Id == id);
        if (p is null) return Failure("Project not found.", 404);
        return Success(new ProjectDetail
        {
            Id = p.Id,
            Name = p.Name,
            Code = p.Code,
            Type = p.Type,
            Description = p.Description,
            IsEnabled = p.IsEnabled,
            IsPin = p.IsPin,
            ParentId = p.ParentId,
            TreePath = p.TreePath,
            RepositoryUrl = p.RepositoryUrl,
            HomepageUrl = p.HomepageUrl,
            DocsUrl = p.DocsUrl,
            Sort = p.Sort
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
            if (req.IsPin.HasValue) ent.IsPin = req.IsPin.Value;
            if (req.ParentId.HasValue) ent.ParentId = req.ParentId;
            if (!string.IsNullOrWhiteSpace(req.TreePath)) ent.TreePath = req.TreePath;
            if (!string.IsNullOrWhiteSpace(req.RepositoryUrl)) ent.RepositoryUrl = req.RepositoryUrl;
            if (!string.IsNullOrWhiteSpace(req.HomepageUrl)) ent.HomepageUrl = req.HomepageUrl;
            if (!string.IsNullOrWhiteSpace(req.DocsUrl)) ent.DocsUrl = req.DocsUrl;
            if (req.Sort.HasValue) ent.Sort = req.Sort.Value;

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
            IsPin = req.IsPin ?? false,
            ParentId = req.ParentId,
            TreePath = req.TreePath ?? string.Empty,
            RepositoryUrl = req.RepositoryUrl ?? string.Empty,
            HomepageUrl = req.HomepageUrl ?? string.Empty,
            DocsUrl = req.DocsUrl ?? string.Empty,
            Sort = req.Sort ?? 0
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
}
