using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Neuro.Api.Entity;
using Neuro.EntityFrameworkCore.Extensions;
using Neuro.EntityFrameworkCore.Services;
using Neuro.Shared.Dtos;

namespace Neuro.Api.Controllers;

public class TeamController : ApiControllerBase
{
    private readonly IUnitOfWork _db;
    public TeamController(IUnitOfWork db) { _db = db; }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] TeamListRequest request)
    {
        request ??= new TeamListRequest();
        var q = _db.Q<Team>().AsNoTracking()
            .WhereNotNullOrWhiteSpace(request.Keyword, (src, k) => src.Where(t => EF.Functions.Like(t.Name, $"%{k}%") || EF.Functions.Like(t.Code, $"%{k}%")))
            .OrderByDescending(t => t.CreatedAt);

        var paged = await q.Select(t => new TeamDetail
        {
            Id = t.Id,
            Name = t.Name,
            Code = t.Code,
            Description = t.Description,
            IsEnabled = t.IsEnabled,
            IsPin = t.IsPin,
            ParentId = t.ParentId,
            TreePath = t.TreePath,
            Sort = t.Sort,
            LeaderId = t.LeaderId
        }).ToPagedListAsync(request.Page, request.PageSize);

        return Success(paged);
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] Guid id)
    {
        var t = await _db.Q<Team>().FirstOrDefaultAsync(x => x.Id == id);
        if (t is null) return Failure("Team not found.", 404);
        var dto = new TeamDetail { Id = t.Id, Name = t.Name, Code = t.Code, Description = t.Description, IsEnabled = t.IsEnabled, IsPin = t.IsPin, ParentId = t.ParentId, TreePath = t.TreePath, Sort = t.Sort, LeaderId = t.LeaderId };
        return Success(dto);
    }

    [HttpPost]
    public async Task<IActionResult> Upsert([FromBody] TeamUpsertRequest req)
    {
        if (req == null) return Failure("Invalid request.");
        if (req.Id.HasValue && req.Id != Guid.Empty)
        {
            var ent = await _db.Q<Team>().FirstOrDefaultAsync(x => x.Id == req.Id.Value);
            if (ent is null) return Failure("Team not found.", 404);
            if (!string.IsNullOrWhiteSpace(req.Name)) ent.Name = req.Name;
            if (!string.IsNullOrWhiteSpace(req.Code)) ent.Code = req.Code;
            if (!string.IsNullOrWhiteSpace(req.Description)) ent.Description = req.Description;
            if (req.IsEnabled.HasValue) ent.IsEnabled = req.IsEnabled.Value;
            if (req.IsPin.HasValue) ent.IsPin = req.IsPin.Value;
            if (req.ParentId.HasValue) ent.ParentId = req.ParentId;
            if (!string.IsNullOrWhiteSpace(req.TreePath)) ent.TreePath = req.TreePath;
            if (req.Sort.HasValue) ent.Sort = req.Sort.Value;
            if (req.LeaderId.HasValue) ent.LeaderId = req.LeaderId;

            await _db.UpdateAsync(ent);
            await _db.SaveChangesAsync();
            return Success(new UpsertResponse { Id = ent.Id });
        }

        if (string.IsNullOrWhiteSpace(req.Name)) return Failure("Name required.");
        var nt = new Team { Name = req.Name!, Code = req.Code ?? string.Empty, Description = req.Description ?? string.Empty, IsEnabled = req.IsEnabled ?? true, IsPin = req.IsPin ?? false, ParentId = req.ParentId, TreePath = req.TreePath ?? string.Empty, Sort = req.Sort ?? 0, LeaderId = req.LeaderId };
        await _db.AddAsync(nt);
        await _db.SaveChangesAsync();
        return Success(new UpsertResponse { Id = nt.Id });
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] BatchDeleteRequest ids)
    {
        if (ids == null || ids.Ids == null || ids.Ids.Length == 0) return Failure("No ids provided.");
        await _db.RemoveByIdsAsync<Team>(ids.Ids);
        await _db.SaveChangesAsync();
        return Success();
    }

    /// <summary>
    /// 获取团队的成员列表
    /// </summary>
    [HttpGet("{id:guid}/users")]
    public async Task<IActionResult> GetTeamUsers(Guid id)
    {
        var team = await _db.Q<Team>().FirstOrDefaultAsync(t => t.Id == id);
        if (team is null) return Failure("团队不存在。", 404);

        var users = await _db.Q<UserTeam>()
            .Where(ut => ut.TeamId == id)
            .Join(_db.Q<User>(), ut => ut.UserId, u => u.Id, (ut, u) => u)
            .Select(u => new { u.Id, u.Account, u.Name })
            .ToListAsync();

        return Success(users);
    }

    /// <summary>
    /// 获取团队的项目列表
    /// </summary>
    [HttpGet("{id:guid}/projects")]
    public async Task<IActionResult> GetTeamProjects(Guid id)
    {
        var team = await _db.Q<Team>().FirstOrDefaultAsync(t => t.Id == id);
        if (team is null) return Failure("团队不存在。", 404);

        var projects = await _db.Q<TeamProject>()
            .Where(tp => tp.TeamId == id)
            .Join(_db.Q<Project>(), tp => tp.ProjectId, p => p.Id, (tp, p) => p)
            .Select(p => new { p.Id, p.Name, p.Code, p.Type })
            .ToListAsync();

        return Success(projects);
    }

    /// <summary>
    /// 为团队分配成员
    /// </summary>
    [HttpPost("assign-users")]
    public async Task<IActionResult> AssignUsers([FromBody] TeamUserAssignRequest request)
    {
        if (request == null) return Failure("Invalid request.");
        
        var team = await _db.Q<Team>().FirstOrDefaultAsync(t => t.Id == request.TeamId);
        if (team is null) return Failure("团队不存在。", 404);

        // 移除现有成员
        var existing = await _db.Q<UserTeam>().Where(ut => ut.TeamId == request.TeamId).ToListAsync();
        foreach (var ut in existing)
        {
            await _db.RemoveAsync(ut);
        }

        // 添加新成员
        foreach (var userId in request.UserIds)
        {
            var user = await _db.Q<User>().FirstOrDefaultAsync(u => u.Id == userId);
            if (user != null)
            {
                await _db.AddAsync(new UserTeam { UserId = userId, TeamId = request.TeamId });
            }
        }

        await _db.SaveChangesAsync();
        return Success();
    }
}
