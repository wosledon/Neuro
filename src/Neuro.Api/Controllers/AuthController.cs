using System;
using Microsoft.AspNetCore.Mvc;
using Neuro.Api.Entity;
using Neuro.Api.Services;
using Neuro.EntityFrameworkCore.Services;
using Neuro.Shared.Dtos;
using Microsoft.EntityFrameworkCore;

namespace Neuro.Api.Controllers;

public class AuthController : ApiControllerBase
{
    private readonly IUnitOfWork _db;
    private readonly IJwtService _jwt;

    public AuthController(IUnitOfWork db, IJwtService jwt)
    {
        _db = db;
        _jwt = jwt;
    }


    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(request.Account);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.Password);

        var exists = await _db.Q<User>().AnyAsync(u => u.Account == request.Account);
        if (exists) return Failure("Account already exists.");

        var user = new User
        {
            Account = request.Account,
            Password = PasswordHasher.Hash(request.Password),
            Name = request.Name ?? request.Account,
            Email = request.Email ?? string.Empty
        };

        await _db.AddAsync(user);
        await _db.SaveChangesAsync();

        return Success();
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(request.Account);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.Password);

        var user = await _db.Q<User>()
            .FirstOrDefaultAsync(u => u.Account == request.Account);

        if (user is null || !PasswordHasher.Verify(request.Password, user.Password))
        {
            return Failure("Invalid account or password.");
        }

        var accessToken = _jwt.GenerateAccessToken(user);
        var (refreshToken, expiresAt) = _jwt.GenerateRefreshToken();

        var rt = new UserRefreshToken
        {
            UserId = user.Id,
            Token = refreshToken,
            ExpiresAt = expiresAt
        };

        await _db.AddAsync(rt);
        await _db.SaveChangesAsync();

        return Success(new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken
        });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] LoginResponse request)
    {
        if (string.IsNullOrEmpty(request.RefreshToken)) return Failure("Missing refresh token.");

        var rt = await _db.Q<UserRefreshToken>()
            .FirstOrDefaultAsync(x => x.Token == request.RefreshToken && !x.Revoked && x.ExpiresAt > DateTime.UtcNow);

        if (rt is null) return Failure("Invalid refresh token.");

        var user = await _db.Q<User>().FirstOrDefaultAsync(u => u.Id == rt.UserId);
        if (user is null) return Failure("Invalid refresh token.");

        // revoke current
        rt.Revoked = true;

        var (newToken, expiresAt) = _jwt.GenerateRefreshToken();
        var newRt = new UserRefreshToken
        {
            UserId = user.Id,
            Token = newToken,
            ExpiresAt = expiresAt,
            ReplacedByToken = null
        };

        await _db.UpdateAsync(rt);
        await _db.AddAsync(newRt);
        await _db.SaveChangesAsync();

        var accessToken = _jwt.GenerateAccessToken(user);

        return Success(new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = newToken
        });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] LoginResponse request)
    {
        if (string.IsNullOrEmpty(request.RefreshToken)) return Failure("Missing refresh token.");

        var rt = await _db.Q<UserRefreshToken>()
            .FirstOrDefaultAsync(x => x.Token == request.RefreshToken && !x.Revoked);

        if (rt is null) return Failure("Invalid refresh token.");

        rt.Revoked = true;
        await _db.UpdateAsync(rt);
        await _db.SaveChangesAsync();

        return Success();
    }

    [HttpGet("me")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> Me()
    {
        var userId = Guid.Parse(User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());
        var user = await _db.Q<User>().FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null) return Failure("User not found.");

        return Success(new
        {
            user.Id,
            user.Account,
            user.Name,
            user.Email,
            user.Phone,
            user.IsSuper
        });
    }

    /// <summary>
    /// 获取当前登录用户的权限列表
    /// </summary>
    [HttpGet("permissions")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> MyPermissions([FromServices] IPermissionService permissionService)
    {
        var permissions = await permissionService.GetUserPermissionsAsync(UserId);
        return Success(permissions);
    }

    /// <summary>
    /// 获取当前登录用户的菜单树
    /// </summary>
    [HttpGet("menus")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> MyMenus([FromServices] IPermissionService permissionService)
    {
        var menus = await permissionService.GetUserMenusAsync(UserId);
        return Success(menus);
    }

    /// <summary>
    /// 检查当前用户是否拥有指定权限
    /// </summary>
    [HttpGet("check-permission")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> CheckPermission([FromQuery] string code, [FromServices] IPermissionService permissionService)
    {
        if (string.IsNullOrWhiteSpace(code))
            return Failure("权限代码不能为空。");

        var hasPermission = await permissionService.HasPermissionAsync(UserId, code);
        return Success(new { HasPermission = hasPermission });
    }
}
