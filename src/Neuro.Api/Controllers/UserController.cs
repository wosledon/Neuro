using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Neuro.EntityFrameworkCore.Extensions;
using Neuro.Api.Entity;
using Neuro.Api.Services;
using Neuro.EntityFrameworkCore.Services;
using Neuro.Shared.Dtos;

namespace Neuro.Api.Controllers;

public class UserController : ApiControllerBase
{
    private readonly IUnitOfWork _db;
    public UserController(IUnitOfWork db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] UserListRequest request)
    {
        request ??= new UserListRequest();

        var q = _db.Q<User>()
            .AsNoTracking()
            .WhereNotNullOrWhiteSpace(request.Keyword, (src, k) => src.Where(u => EF.Functions.Like(u.Account, $"%{k}%") || EF.Functions.Like(u.Name, $"%{k}%")))
            .OrderByDescending(u => u.CreatedAt);

        var paged = await q.Select(u => new UserDetail
        {
            Id = u.Id,
            Account = u.Account,
            Name = u.Name,
            Email = u.Email,
            Phone = u.Phone,
            Avatar = u.Avatar,
            Description = u.Description,
            TenantId = u.TenantId
        }).ToPagedListAsync(request.Page, request.PageSize);

        return Success(paged);
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] Guid id)
    {
        var user = await _db.Q<User>()
            .Join(_db.Q<Tenant>(),
                u => u.TenantId,
                t => t.Id,
                (u, t) => new { u, t })
            .Where(ut => ut.u.Id == id)
            .Select(ut => new UserDetail
            {
                Id = ut.u.Id,
                Account = ut.u.Account,
                Name = ut.u.Name,
                Email = ut.u.Email,
                Phone = ut.u.Phone,
                Avatar = ut.u.Avatar,
                Description = ut.u.Description,
                TenantId = ut.t.Id,
                TenantName = ut.t.Name
            })
            .FirstOrDefaultAsync();

        if (user is null) return Failure("User not found.", 404);
        return Success(user);
    }

    [HttpPost]
    public async Task<IActionResult> Upsert([FromBody] UserUpsertRequest user)
    {
        if (user == null) return Failure("Invalid request.");

        if (user.Id.HasValue && user.Id != Guid.Empty)
        {
            var exist = await _db.Q<User>().FirstOrDefaultAsync(u => u.Id == user.Id.Value);
            if (exist is null) return Failure("User not found.", 404);

            if (!string.IsNullOrWhiteSpace(user.Account)) exist.Account = user.Account;
            if (!string.IsNullOrWhiteSpace(user.Name)) exist.Name = user.Name;
            if (!string.IsNullOrWhiteSpace(user.Email)) exist.Email = user.Email;
            if (!string.IsNullOrWhiteSpace(user.Phone)) exist.Phone = user.Phone;
            if (!string.IsNullOrWhiteSpace(user.Avatar)) exist.Avatar = user.Avatar;
            if (!string.IsNullOrWhiteSpace(user.Description)) exist.Description = user.Description;
            if (user.IsSuper.HasValue) exist.IsSuper = user.IsSuper.Value;
            if (user.TenantId.HasValue) exist.TenantId = user.TenantId.Value;

            if (!string.IsNullOrWhiteSpace(user.Password))
            {
                exist.Password = Neuro.Api.Services.PasswordHasher.Hash(user.Password);
            }

            await _db.UpdateAsync(exist);
            await _db.SaveChangesAsync();

            return Success(new UpsertResponse { Id = exist.Id });
        }

        // Create
        if (string.IsNullOrWhiteSpace(user.Account) || string.IsNullOrWhiteSpace(user.Password))
        {
            return Failure("Account and Password are required for creating a user.");
        }

        var exists = await _db.Q<User>().AnyAsync(u => u.Account == user.Account);
        if (exists) return Failure("Account already exists.");

        var nu = new User
        {
            Account = user.Account,
            Password = Neuro.Api.Services.PasswordHasher.Hash(user.Password),
            Name = user.Name ?? user.Account,
            Email = user.Email ?? string.Empty,
            Phone = user.Phone ?? string.Empty,
            Avatar = user.Avatar ?? string.Empty,
            Description = user.Description ?? string.Empty,
            IsSuper = user.IsSuper ?? false
        };

        await _db.AddAsync(nu);
        await _db.SaveChangesAsync();

        return Success(new UpsertResponse { Id = nu.Id });
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] BatchDeleteRequest ids)
    {
        if (ids == null || ids.Ids == null || ids.Ids.Length == 0) return Failure("No ids provided.");

        await _db.RemoveByIdsAsync<User>(ids.Ids);
        await _db.SaveChangesAsync();

        return Success();
    }

    [HttpGet]
    public async Task<IActionResult> Profile()
    {
        var currentUserId = UserId;

        var user = await _db.Q<User>()
            .Join(_db.Q<Tenant>(),
                 u => u.TenantId,
                 t => t.Id,
                 (u, t) => new { u, t })
            .Where(ut => ut.u.Id == currentUserId)
            .Select(ut => new UserDetail
            {
                Id = ut.u.Id,
                Account = ut.u.Account,
                Name = ut.u.Name,
                Email = ut.u.Email,
                Phone = ut.u.Phone,
                Avatar = ut.u.Avatar,
                Description = ut.u.Description,
                TenantId = ut.t.Id,
                TenantName = ut.t.Name
            })
            .FirstOrDefaultAsync();

        if (user is null)
        {
            return Failure("User not found.", 404);
        }

        return Success(user);
    }

    /// <summary>
    /// 获取指定用户的权限列表
    /// </summary>
    [HttpGet("{id:guid}/permissions")]
    public async Task<IActionResult> GetUserPermissions(Guid id, [FromServices] IPermissionService permissionService)
    {
        var user = await _db.Q<User>().FirstOrDefaultAsync(u => u.Id == id);
        if (user is null) return Failure("用户不存在。", 404);

        var permissions = await permissionService.GetUserPermissionsAsync(id);
        return Success(permissions);
    }

    /// <summary>
    /// 获取指定用户的菜单树
    /// </summary>
    [HttpGet("{id:guid}/menus")]
    public async Task<IActionResult> GetUserMenus(Guid id, [FromServices] IPermissionService permissionService)
    {
        var user = await _db.Q<User>().FirstOrDefaultAsync(u => u.Id == id);
        if (user is null) return Failure("用户不存在。", 404);

        var menus = await permissionService.GetUserMenusAsync(id);
        return Success(menus);
    }

    /// <summary>
    /// 获取指定用户的角色列表
    /// </summary>
    [HttpGet("{id:guid}/roles")]
    public async Task<IActionResult> GetUserRoles(Guid id)
    {
        var user = await _db.Q<User>().FirstOrDefaultAsync(u => u.Id == id);
        if (user is null) return Failure("用户不存在。", 404);

        var roles = await _db.Q<UserRole>()
            .Where(ur => ur.UserId == id)
            .Join(_db.Q<Role>(), ur => ur.RoleId, r => r.Id, (ur, r) => r)
            .Select(r => new { r.Id, r.Name, r.Code })
            .ToListAsync();

        return Success(roles);
    }

    /// <summary>
    /// 获取指定用户的团队列表
    /// </summary>
    [HttpGet("{id:guid}/teams")]
    public async Task<IActionResult> GetUserTeams(Guid id)
    {
        var user = await _db.Q<User>().FirstOrDefaultAsync(u => u.Id == id);
        if (user is null) return Failure("用户不存在。", 404);

        var teams = await _db.Q<UserTeam>()
            .Where(ut => ut.UserId == id)
            .Join(_db.Q<Team>(), ut => ut.TeamId, t => t.Id, (ut, t) => t)
            .Select(t => new { t.Id, t.Name, t.Code })
            .ToListAsync();

        return Success(teams);
    }
}
