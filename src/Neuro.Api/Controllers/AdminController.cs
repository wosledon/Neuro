using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Neuro.EntityFrameworkCore.Services;

namespace Neuro.Api.Controllers;

[Authorize(Policy = "SuperOnly")]
public class AdminController : ApiControllerBase
{
    private readonly IUnitOfWork _db;

    public AdminController(IUnitOfWork db)
    {
        _db = db;
    }

    [HttpGet]
    public IActionResult Ping()
    {
        return Success(new { message = "pong from admin" });
    }

    /// <summary>
    /// 获取系统统计信息
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Stats()
    {
        var userCount = await _db.Q<Entity.User>().CountAsync();
        var roleCount = await _db.Q<Entity.Role>().CountAsync();
        var teamCount = await _db.Q<Entity.Team>().CountAsync();
        var projectCount = await _db.Q<Entity.Project>().CountAsync();
        var documentCount = await _db.Q<Entity.Document>().CountAsync();
        var tenantCount = await _db.Q<Entity.Tenant>().CountAsync();
        var menuCount = await _db.Q<Entity.Menu>().CountAsync();
        var permissionCount = await _db.Q<Entity.Permission>().CountAsync();
        var fileResourceCount = await _db.Q<Entity.FileResource>().CountAsync();

        return Success(new
        {
            Users = userCount,
            Roles = roleCount,
            Teams = teamCount,
            Projects = projectCount,
            Documents = documentCount,
            Tenants = tenantCount,
            Menus = menuCount,
            Permissions = permissionCount,
            FileResources = fileResourceCount
        });
    }

    /// <summary>
    /// 获取数据库健康状态
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Health()
    {
        try
        {
            var canConnect = await _db.Q<Entity.User>().AnyAsync();
            return Success(new
            {
                Database = "Connected",
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            return Failure($"Database connection failed: {ex.Message}", 500);
        }
    }
}
