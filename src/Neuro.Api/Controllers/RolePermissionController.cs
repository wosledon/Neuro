using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Neuro.Api.Entity;
using Neuro.EntityFrameworkCore.Extensions;
using Neuro.EntityFrameworkCore.Services;
using Neuro.Shared.Dtos;

namespace Neuro.Api.Controllers;

public class RolePermissionController : ApiControllerBase
{
    private readonly IUnitOfWork _db;
    public RolePermissionController(IUnitOfWork db) { _db = db; }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] RolePermissionListRequest request)
    {
        request ??= new RolePermissionListRequest();
        var q = _db.Q<RolePermission>().AsNoTracking();

        if (request.RoleId.HasValue)
            q = q.Where(rp => rp.RoleId == request.RoleId.Value);
        if (request.PermissionId.HasValue)
            q = q.Where(rp => rp.PermissionId == request.PermissionId.Value);

        var paged = await q
            .Join(_db.Q<Role>(), rp => rp.RoleId, r => r.Id, (rp, r) => new { rp, r })
            .Join(_db.Q<Permission>(), x => x.rp.PermissionId, p => p.Id, (x, p) => new { x.rp, x.r, p })
            .Select(x => new RolePermissionDetail
            {
                Id = x.rp.Id,
                RoleId = x.r.Id,
                RoleName = x.r.Name,
                PermissionId = x.p.Id,
                PermissionName = x.p.Name,
                PermissionCode = x.p.Code
            })
            .ToPagedListAsync(request.Page, request.PageSize);

        return Success(paged);
    }

    [HttpPost]
    public async Task<IActionResult> Assign([FromBody] RolePermissionAssignRequest request)
    {
        if (request == null || request.PermissionIds == null || request.PermissionIds.Length == 0)
            return Failure("PermissionIds 不能为空。");

        // 验证角色是否存在
        var role = await _db.Q<Role>().FirstOrDefaultAsync(r => r.Id == request.RoleId);
        if (role is null) return Failure("角色不存在。", 404);

        // 验证所有权限是否存在
        var existingPermissionIds = await _db.Q<Permission>()
            .Where(p => request.PermissionIds.Contains(p.Id))
            .Select(p => p.Id)
            .ToListAsync();

        var invalidPermissionIds = request.PermissionIds.Except(existingPermissionIds).ToArray();
        if (invalidPermissionIds.Length > 0)
            return Failure($"以下权限不存在: {string.Join(", ", invalidPermissionIds)}");

        // 获取角色当前已有的权限
        var existingRolePermissions = await _db.Q<RolePermission>()
            .Where(rp => rp.RoleId == request.RoleId)
            .ToListAsync();

        var existingPermissionIdSet = existingRolePermissions.Select(rp => rp.PermissionId).ToHashSet();
        var requestedPermissionIdSet = request.PermissionIds.ToHashSet();

        // 需要添加的权限
        var toAdd = request.PermissionIds.Where(pid => !existingPermissionIdSet.Contains(pid)).ToList();
        // 需要删除的权限
        var toRemove = existingRolePermissions.Where(rp => !requestedPermissionIdSet.Contains(rp.PermissionId)).ToList();

        foreach (var permissionId in toAdd)
        {
            await _db.AddAsync(new RolePermission { RoleId = request.RoleId, PermissionId = permissionId });
        }

        foreach (var rp in toRemove)
        {
            await _db.RemoveAsync(rp);
        }

        await _db.SaveChangesAsync();
        return Success(new { Added = toAdd.Count, Removed = toRemove.Count });
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] BatchDeleteRequest ids)
    {
        if (ids == null || ids.Ids == null || ids.Ids.Length == 0)
            return Failure("No ids provided.");

        await _db.RemoveByIdsAsync<RolePermission>(ids.Ids);
        await _db.SaveChangesAsync();
        return Success();
    }
}
