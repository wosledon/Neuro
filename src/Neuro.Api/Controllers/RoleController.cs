using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Neuro.Api.Entity;
using Neuro.EntityFrameworkCore.Extensions;
using Neuro.EntityFrameworkCore.Services;
using Neuro.Shared.Dtos;

namespace Neuro.Api.Controllers;

public class RoleController : ApiControllerBase
{
    private readonly IUnitOfWork _db;
    public RoleController(IUnitOfWork db) { _db = db; }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] RoleListRequest request)
    {
        request ??= new RoleListRequest();
        var q = _db.Q<Role>().AsNoTracking()
            .WhereNotNullOrWhiteSpace(request.Keyword, (src, k) => src.Where(r => EF.Functions.Like(r.Name, $"%{k}%") || EF.Functions.Like(r.Code, $"%{k}%")))
            .OrderByDescending(r => r.CreatedAt);

        var paged = await q.Select(r => new RoleDetail
        {
            Id = r.Id,
            Name = r.Name,
            Code = r.Code,
            Description = r.Description,
            IsEnabled = r.IsEnabled,
            IsPin = r.IsPin,
            ParentId = r.ParentId,
            TreePath = r.TreePath
        }).ToPagedListAsync(request.Page, request.PageSize);

        return Success(paged);
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] Guid id)
    {
        var r = await _db.Q<Role>().FirstOrDefaultAsync(x => x.Id == id);
        if (r is null) return Failure("Role not found.", 404);
        var dto = new RoleDetail { Id = r.Id, Name = r.Name, Code = r.Code, Description = r.Description, IsEnabled = r.IsEnabled, IsPin = r.IsPin, ParentId = r.ParentId, TreePath = r.TreePath };
        return Success(dto);
    }

    [HttpPost]
    public async Task<IActionResult> Upsert([FromBody] RoleUpsertRequest req)
    {
        if (req == null) return Failure("Invalid request.");
        if (req.Id.HasValue && req.Id != Guid.Empty)
        {
            var ent = await _db.Q<Role>().FirstOrDefaultAsync(x => x.Id == req.Id.Value);
            if (ent is null) return Failure("Role not found.", 404);
            if (!string.IsNullOrWhiteSpace(req.Name)) ent.Name = req.Name;
            if (!string.IsNullOrWhiteSpace(req.Code)) ent.Code = req.Code;
            if (!string.IsNullOrWhiteSpace(req.Description)) ent.Description = req.Description;
            if (req.IsEnabled.HasValue) ent.IsEnabled = req.IsEnabled.Value;
            if (req.IsPin.HasValue) ent.IsPin = req.IsPin.Value;
            if (req.ParentId.HasValue) ent.ParentId = req.ParentId;
            if (!string.IsNullOrWhiteSpace(req.TreePath)) ent.TreePath = req.TreePath;

            await _db.UpdateAsync(ent);
            await _db.SaveChangesAsync();
            return Success(new UpsertResponse { Id = ent.Id });
        }

        if (string.IsNullOrWhiteSpace(req.Name)) return Failure("Name required.");
        var nr = new Role { Name = req.Name!, Code = req.Code ?? string.Empty, Description = req.Description ?? string.Empty, IsEnabled = req.IsEnabled ?? true, IsPin = req.IsPin ?? false, ParentId = req.ParentId, TreePath = req.TreePath ?? string.Empty };
        await _db.AddAsync(nr);
        await _db.SaveChangesAsync();
        return Success(new UpsertResponse { Id = nr.Id });
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] BatchDeleteRequest ids)
    {
        if (ids == null || ids.Ids == null || ids.Ids.Length == 0) return Failure("No ids provided.");
        await _db.RemoveByIdsAsync<Role>(ids.Ids);
        await _db.SaveChangesAsync();
        return Success();
    }

    /// <summary>
    /// 获取角色的权限列表
    /// </summary>
    [HttpGet("{id:guid}/permissions")]
    public async Task<IActionResult> GetRolePermissions(Guid id)
    {
        var role = await _db.Q<Role>().FirstOrDefaultAsync(r => r.Id == id);
        if (role is null) return Failure("角色不存在。", 404);

        var permissions = await _db.Q<RolePermission>()
            .Where(rp => rp.RoleId == id)
            .Join(_db.Q<Permission>(), rp => rp.PermissionId, p => p.Id, (rp, p) => p)
            .Select(p => new { p.Id, p.Name, p.Code })
            .ToListAsync();

        return Success(permissions);
    }

    /// <summary>
    /// 获取角色的菜单列表
    /// </summary>
    [HttpGet("{id:guid}/menus")]
    public async Task<IActionResult> GetRoleMenus(Guid id)
    {
        var role = await _db.Q<Role>().FirstOrDefaultAsync(r => r.Id == id);
        if (role is null) return Failure("角色不存在。", 404);

        var menus = await _db.Q<RoleMenu>()
            .Where(rm => rm.RoleId == id)
            .Join(_db.Q<Menu>(), rm => rm.MenuId, m => m.Id, (rm, m) => m)
            .Select(m => new { m.Id, m.Name, m.Code, m.Url })
            .ToListAsync();

        return Success(menus);
    }

    /// <summary>
    /// 获取角色的用户列表
    /// </summary>
    [HttpGet("{id:guid}/users")]
    public async Task<IActionResult> GetRoleUsers(Guid id)
    {
        var role = await _db.Q<Role>().FirstOrDefaultAsync(r => r.Id == id);
        if (role is null) return Failure("角色不存在。", 404);

        var users = await _db.Q<UserRole>()
            .Where(ur => ur.RoleId == id)
            .Join(_db.Q<User>(), ur => ur.UserId, u => u.Id, (ur, u) => u)
            .Select(u => new { u.Id, u.Account, u.Name })
            .ToListAsync();

        return Success(users);
    }
}
