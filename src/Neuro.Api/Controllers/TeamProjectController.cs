using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Neuro.Api.Entity;
using Neuro.EntityFrameworkCore.Extensions;
using Neuro.EntityFrameworkCore.Services;
using Neuro.Shared.Dtos;

namespace Neuro.Api.Controllers;

public class TeamProjectController : ApiControllerBase
{
    private readonly IUnitOfWork _db;
    public TeamProjectController(IUnitOfWork db) { _db = db; }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] TeamProjectListRequest request)
    {
        request ??= new TeamProjectListRequest();
        var q = _db.Q<TeamProject>().AsNoTracking();

        if (request.TeamId.HasValue)
            q = q.Where(tp => tp.TeamId == request.TeamId.Value);
        if (request.ProjectId.HasValue)
            q = q.Where(tp => tp.ProjectId == request.ProjectId.Value);

        var paged = await q
            .Join(_db.Q<Team>(), tp => tp.TeamId, t => t.Id, (tp, t) => new { tp, t })
            .Join(_db.Q<Project>(), x => x.tp.ProjectId, p => p.Id, (x, p) => new { x.tp, x.t, p })
            .Select(x => new TeamProjectDetail
            {
                Id = x.tp.Id,
                TeamId = x.t.Id,
                TeamName = x.t.Name,
                ProjectId = x.p.Id,
                ProjectName = x.p.Name
            })
            .ToPagedListAsync(request.Page, request.PageSize);

        return Success(paged);
    }

    [HttpPost]
    public async Task<IActionResult> Assign([FromBody] TeamProjectAssignRequest request)
    {
        if (request == null || request.ProjectIds == null || request.ProjectIds.Length == 0)
            return Failure("ProjectIds 不能为空。");

        // 验证团队是否存在
        var team = await _db.Q<Team>().FirstOrDefaultAsync(t => t.Id == request.TeamId);
        if (team is null) return Failure("团队不存在。", 404);

        // 验证所有项目是否存在
        var existingProjectIds = await _db.Q<Project>()
            .Where(p => request.ProjectIds.Contains(p.Id))
            .Select(p => p.Id)
            .ToListAsync();

        var invalidProjectIds = request.ProjectIds.Except(existingProjectIds).ToArray();
        if (invalidProjectIds.Length > 0)
            return Failure($"以下项目不存在: {string.Join(", ", invalidProjectIds)}");

        // 获取团队当前已有的项目
        var existingTeamProjects = await _db.Q<TeamProject>()
            .Where(tp => tp.TeamId == request.TeamId)
            .ToListAsync();

        var existingProjectIdSet = existingTeamProjects.Select(tp => tp.ProjectId).ToHashSet();
        var requestedProjectIdSet = request.ProjectIds.ToHashSet();

        // 需要添加的项目
        var toAdd = request.ProjectIds.Where(pid => !existingProjectIdSet.Contains(pid)).ToList();
        // 需要删除的项目
        var toRemove = existingTeamProjects.Where(tp => !requestedProjectIdSet.Contains(tp.ProjectId)).ToList();

        foreach (var projectId in toAdd)
        {
            await _db.AddAsync(new TeamProject { TeamId = request.TeamId, ProjectId = projectId });
        }

        foreach (var tp in toRemove)
        {
            await _db.RemoveAsync(tp);
        }

        await _db.SaveChangesAsync();
        return Success(new { Added = toAdd.Count, Removed = toRemove.Count });
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] BatchDeleteRequest ids)
    {
        if (ids == null || ids.Ids == null || ids.Ids.Length == 0)
            return Failure("No ids provided.");

        await _db.RemoveByIdsAsync<TeamProject>(ids.Ids);
        await _db.SaveChangesAsync();
        return Success();
    }
}
