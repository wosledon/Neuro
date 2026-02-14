using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Neuro.Api.Entity;
using Neuro.EntityFrameworkCore.Extensions;
using Neuro.EntityFrameworkCore.Services;
using Neuro.Shared.Dtos;

namespace Neuro.Api.Controllers;

public class UserRoleController : ApiControllerBase
{
    private readonly IUnitOfWork _db;
    public UserRoleController(IUnitOfWork db) { _db = db; }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] UserRoleListRequest request)
    {
        request ??= new UserRoleListRequest();
        var q = _db.Q<UserRole>().AsNoTracking();

        if (request.UserId.HasValue)
            q = q.Where(ur => ur.UserId == request.UserId.Value);
        if (request.RoleId.HasValue)
            q = q.Where(ur => ur.RoleId == request.RoleId.Value);

        var paged = await q
            .Join(_db.Q<User>(), ur => ur.UserId, u => u.Id, (ur, u) => new { ur, u })
            .Join(_db.Q<Role>(), x => x.ur.RoleId, r => r.Id, (x, r) => new { x.ur, x.u, r })
            .Select(x => new UserRoleDetail
            {
                Id = x.ur.Id,
                UserId = x.u.Id,
                UserName = x.u.Name,
                RoleId = x.r.Id,
                RoleName = x.r.Name
            })
            .ToPagedListAsync(request.Page, request.PageSize);

        return Success(paged);
    }

    [HttpPost]
    public async Task<IActionResult> Assign([FromBody] UserRoleAssignRequest request)
    {
        if (request == null || request.RoleIds == null || request.RoleIds.Length == 0)
            return Failure("RoleIds 不能为空。");

        // 验证用户是否存在
        var user = await _db.Q<User>().FirstOrDefaultAsync(u => u.Id == request.UserId);
        if (user is null) return Failure("用户不存在。", 404);

        // 验证所有角色是否存在
        var existingRoleIds = await _db.Q<Role>()
            .Where(r => request.RoleIds.Contains(r.Id))
            .Select(r => r.Id)
            .ToListAsync();

        var invalidRoleIds = request.RoleIds.Except(existingRoleIds).ToArray();
        if (invalidRoleIds.Length > 0)
            return Failure($"以下角色不存在: {string.Join(", ", invalidRoleIds)}");

        // 获取用户当前已有的角色
        var existingUserRoles = await _db.Q<UserRole>()
            .Where(ur => ur.UserId == request.UserId)
            .ToListAsync();

        var existingRoleIdSet = existingUserRoles.Select(ur => ur.RoleId).ToHashSet();
        var requestedRoleIdSet = request.RoleIds.ToHashSet();

        // 需要添加的角色
        var toAdd = request.RoleIds.Where(rid => !existingRoleIdSet.Contains(rid)).ToList();
        // 需要删除的角色
        var toRemove = existingUserRoles.Where(ur => !requestedRoleIdSet.Contains(ur.RoleId)).ToList();

        foreach (var roleId in toAdd)
        {
            await _db.AddAsync(new UserRole { UserId = request.UserId, RoleId = roleId });
        }

        foreach (var ur in toRemove)
        {
            await _db.RemoveAsync(ur);
        }

        await _db.SaveChangesAsync();
        return Success(new { Added = toAdd.Count, Removed = toRemove.Count });
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] BatchDeleteRequest ids)
    {
        if (ids == null || ids.Ids == null || ids.Ids.Length == 0)
            return Failure("No ids provided.");

        await _db.RemoveByIdsAsync<UserRole>(ids.Ids);
        await _db.SaveChangesAsync();
        return Success();
    }
}
