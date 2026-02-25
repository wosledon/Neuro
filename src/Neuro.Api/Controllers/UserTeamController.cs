using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Neuro.Api.Entity;
using Neuro.EntityFrameworkCore.Extensions;
using Neuro.EntityFrameworkCore.Services;
using Neuro.Shared.Dtos;

namespace Neuro.Api.Controllers;

public class UserTeamController : ApiControllerBase
{
    private readonly IUnitOfWork _db;
    public UserTeamController(IUnitOfWork db) { _db = db; }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] UserTeamListRequest request)
    {
        request ??= new UserTeamListRequest();
        var q = _db.Q<UserTeam>().AsNoTracking();

        if (request.UserId.HasValue)
            q = q.Where(ut => ut.UserId == request.UserId.Value);
        if (request.TeamId.HasValue)
            q = q.Where(ut => ut.TeamId == request.TeamId.Value);

        var paged = await q
            .Join(_db.Q<User>(), ut => ut.UserId, u => u.Id, (ut, u) => new { ut, u })
            .Join(_db.Q<Team>(), x => x.ut.TeamId, t => t.Id, (x, t) => new { x.ut, x.u, t })
            .Select(x => new UserTeamDetail
            {
                Id = x.ut.Id,
                UserId = x.u.Id,
                UserName = x.u.Name,
                TeamId = x.t.Id,
                TeamName = x.t.Name
            })
            .ToPagedListAsync(request.Page, request.PageSize);

        return Success(paged);
    }

    [HttpPost]
    public async Task<IActionResult> Assign([FromBody] UserTeamAssignRequest request)
    {
        if (request == null || request.TeamIds == null || request.TeamIds.Length == 0)
            return Failure("TeamIds 不能为空。");

        // 验证用户是否存在
        var user = await _db.Q<User>().FirstOrDefaultAsync(u => u.Id == request.UserId);
        if (user is null) return Failure("用户不存在。", 404);

        // 验证所有团队是否存在
        var existingTeamIds = await _db.Q<Team>()
            .Where(t => request.TeamIds.Contains(t.Id))
            .Select(t => t.Id)
            .ToListAsync();

        var invalidTeamIds = request.TeamIds.Except(existingTeamIds).ToArray();
        if (invalidTeamIds.Length > 0)
            return Failure($"以下团队不存在: {string.Join(", ", invalidTeamIds)}");

        // 获取用户当前已有的团队
        var existingUserTeams = await _db.Q<UserTeam>()
            .Where(ut => ut.UserId == request.UserId)
            .ToListAsync();

        var existingTeamIdSet = existingUserTeams.Select(ut => ut.TeamId).ToHashSet();
        var requestedTeamIdSet = request.TeamIds.ToHashSet();

        // 需要添加的团队
        var toAdd = request.TeamIds.Where(tid => !existingTeamIdSet.Contains(tid)).ToList();
        // 需要删除的团队
        var toRemove = existingUserTeams.Where(ut => !requestedTeamIdSet.Contains(ut.TeamId)).ToList();

        foreach (var teamId in toAdd)
        {
            await _db.AddAsync(new UserTeam { UserId = request.UserId, TeamId = teamId });
        }

        foreach (var ut in toRemove)
        {
            await _db.RemoveAsync(ut);
        }

        await _db.SaveChangesAsync();
        return Success(new { Added = toAdd.Count, Removed = toRemove.Count });
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] BatchDeleteRequest ids)
    {
        if (ids == null || ids.Ids == null || ids.Ids.Length == 0)
            return Failure("No ids provided.");

        await _db.RemoveByIdsAsync<UserTeam>(ids.Ids);
        await _db.SaveChangesAsync();
        return Success();
    }
}
