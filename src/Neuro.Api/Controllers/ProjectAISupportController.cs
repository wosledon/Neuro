using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Neuro.Api.Entity;
using Neuro.EntityFrameworkCore.Extensions;
using Neuro.EntityFrameworkCore.Services;
using Neuro.Shared.Dtos;

namespace Neuro.Api.Controllers;

public class ProjectAISupportController : ApiControllerBase
{
    private readonly IUnitOfWork _db;
    public ProjectAISupportController(IUnitOfWork db) { _db = db; }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] KeywordListRequest request)
    {
        request ??= new KeywordListRequest();
        var q = _db.Q<ProjectAISupport>().AsNoTracking();

        var paged = await q
            .Join(_db.Q<Project>(), pa => pa.ProjectId, p => p.Id, (pa, p) => new { pa, p })
            .Join(_db.Q<AISupport>(), x => x.pa.AISupportId, a => a.Id, (x, a) => new { x.pa, x.p, a })
            .Select(x => new ProjectAISupportDetail
            {
                Id = x.pa.Id,
                ProjectId = x.p.Id,
                ProjectName = x.p.Name,
                AISupportId = x.a.Id,
                AISupportName = x.a.Name
            })
            .ToPagedListAsync(request.Page, request.PageSize);

        return Success(paged);
    }

    [HttpPost]
    public async Task<IActionResult> Assign([FromBody] ProjectAISupportAssignRequest request)
    {
        if (request == null || request.AISupportIds == null || request.AISupportIds.Length == 0)
            return Failure("AISupportIds 不能为空。");

        // 验证项目是否存在
        var project = await _db.Q<Project>().FirstOrDefaultAsync(p => p.Id == request.ProjectId);
        if (project is null) return Failure("项目不存在。", 404);

        // 验证所有 AI Support 是否存在
        var existingIds = await _db.Q<AISupport>()
            .Where(a => request.AISupportIds.Contains(a.Id))
            .Select(a => a.Id)
            .ToListAsync();

        var invalidIds = request.AISupportIds.Except(existingIds).ToArray();
        if (invalidIds.Length > 0)
            return Failure($"以下 AI Support 不存在: {string.Join(", ", invalidIds)}");

        // 获取项目当前已有的 AI Support
        var existing = await _db.Q<ProjectAISupport>()
            .Where(pa => pa.ProjectId == request.ProjectId)
            .ToListAsync();

        var existingIdSet = existing.Select(pa => pa.AISupportId).ToHashSet();
        var requestedIdSet = request.AISupportIds.ToHashSet();

        // 需要添加的
        var toAdd = request.AISupportIds.Where(id => !existingIdSet.Contains(id)).ToList();
        // 需要删除的
        var toRemove = existing.Where(pa => !requestedIdSet.Contains(pa.AISupportId)).ToList();

        foreach (var id in toAdd)
        {
            await _db.AddAsync(new ProjectAISupport { ProjectId = request.ProjectId, AISupportId = id });
        }

        foreach (var pa in toRemove)
        {
            await _db.RemoveAsync(pa);
        }

        await _db.SaveChangesAsync();
        return Success(new { Added = toAdd.Count, Removed = toRemove.Count });
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] BatchDeleteRequest ids)
    {
        if (ids == null || ids.Ids == null || ids.Ids.Length == 0)
            return Failure("No ids provided.");

        await _db.RemoveByIdsAsync<ProjectAISupport>(ids.Ids);
        await _db.SaveChangesAsync();
        return Success();
    }
}
