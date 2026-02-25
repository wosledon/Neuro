using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Neuro.Api.Entity;
using Neuro.EntityFrameworkCore.Extensions;
using Neuro.EntityFrameworkCore.Services;
using Neuro.Shared.Dtos;

namespace Neuro.Api.Controllers;

public class RoleMenuController : ApiControllerBase
{
    private readonly IUnitOfWork _db;
    public RoleMenuController(IUnitOfWork db) { _db = db; }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] RoleMenuListRequest request)
    {
        request ??= new RoleMenuListRequest();
        var q = _db.Q<RoleMenu>().AsNoTracking();

        if (request.RoleId.HasValue)
            q = q.Where(rm => rm.RoleId == request.RoleId.Value);
        if (request.MenuId.HasValue)
            q = q.Where(rm => rm.MenuId == request.MenuId.Value);

        var paged = await q
            .Join(_db.Q<Role>(), rm => rm.RoleId, r => r.Id, (rm, r) => new { rm, r })
            .Join(_db.Q<Menu>(), x => x.rm.MenuId, m => m.Id, (x, m) => new { x.rm, x.r, m })
            .Select(x => new RoleMenuDetail
            {
                Id = x.rm.Id,
                RoleId = x.r.Id,
                RoleName = x.r.Name,
                MenuId = x.m.Id,
                MenuName = x.m.Name,
                MenuCode = x.m.Code
            })
            .ToPagedListAsync(request.Page, request.PageSize);

        return Success(paged);
    }

    [HttpPost]
    public async Task<IActionResult> Assign([FromBody] RoleMenuAssignRequest request)
    {
        if (request == null || request.MenuIds == null || request.MenuIds.Length == 0)
            return Failure("MenuIds 不能为空。");

        // 验证角色是否存在
        var role = await _db.Q<Role>().FirstOrDefaultAsync(r => r.Id == request.RoleId);
        if (role is null) return Failure("角色不存在。", 404);

        // 验证所有菜单是否存在
        var existingMenuIds = await _db.Q<Menu>()
            .Where(m => request.MenuIds.Contains(m.Id))
            .Select(m => m.Id)
            .ToListAsync();

        var invalidMenuIds = request.MenuIds.Except(existingMenuIds).ToArray();
        if (invalidMenuIds.Length > 0)
            return Failure($"以下菜单不存在: {string.Join(", ", invalidMenuIds)}");

        // 获取角色当前已有的菜单
        var existingRoleMenus = await _db.Q<RoleMenu>()
            .Where(rm => rm.RoleId == request.RoleId)
            .ToListAsync();

        var existingMenuIdSet = existingRoleMenus.Select(rm => rm.MenuId).ToHashSet();
        var requestedMenuIdSet = request.MenuIds.ToHashSet();

        // 需要添加的菜单
        var toAdd = request.MenuIds.Where(mid => !existingMenuIdSet.Contains(mid)).ToList();
        // 需要删除的菜单
        var toRemove = existingRoleMenus.Where(rm => !requestedMenuIdSet.Contains(rm.MenuId)).ToList();

        foreach (var menuId in toAdd)
        {
            await _db.AddAsync(new RoleMenu { RoleId = request.RoleId, MenuId = menuId });
        }

        foreach (var rm in toRemove)
        {
            await _db.RemoveAsync(rm);
        }

        await _db.SaveChangesAsync();
        return Success(new { Added = toAdd.Count, Removed = toRemove.Count });
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] BatchDeleteRequest ids)
    {
        if (ids == null || ids.Ids == null || ids.Ids.Length == 0)
            return Failure("No ids provided.");

        await _db.RemoveByIdsAsync<RoleMenu>(ids.Ids);
        await _db.SaveChangesAsync();
        return Success();
    }
}
