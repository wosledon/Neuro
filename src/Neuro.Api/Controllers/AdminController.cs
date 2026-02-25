using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Neuro.Api.Authorization;
using Neuro.Api.Services;
using Neuro.EntityFrameworkCore.Services;
using Neuro.Shared.Dtos;

namespace Neuro.Api.Controllers;

[Authorize(Policy = "SuperOnly")]
public class AdminController : ApiControllerBase
{
    private readonly IUnitOfWork _db;
    private readonly IPermissionDiscoveryService _permissionDiscovery;
    private readonly IMenuSyncService _menuSync;
    private readonly ISystemMonitorService _systemMonitor;
    private readonly IActivityLogService _activityLog;
    private readonly ILogger<AdminController> _logger;

    public AdminController(
        IUnitOfWork db,
        IPermissionDiscoveryService permissionDiscovery,
        IMenuSyncService menuSync,
        ISystemMonitorService systemMonitor,
        IActivityLogService activityLog,
        ILogger<AdminController> logger)
    {
        _db = db;
        _permissionDiscovery = permissionDiscovery;
        _menuSync = menuSync;
        _systemMonitor = systemMonitor;
        _activityLog = activityLog;
        _logger = logger;
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
        var documentCount = await _db.Q<Entity.MyDocument>().CountAsync();
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

    /// <summary>
    /// 获取系统状态（CPU、内存、存储）
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> SystemStatus()
    {
        try
        {
            var status = await _systemMonitor.GetSystemStatusAsync();
            return Success(new
            {
                status.CpuUsage,
                status.MemoryUsage,
                status.MemoryUsed,
                status.MemoryTotal,
                status.StorageUsage,
                status.StorageUsed,
                status.StorageTotal,
                Uptime = status.Uptime.ToString("dd\\:hh\\:mm\\:ss"),
                status.Timestamp
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取系统状态失败");
            return Failure($"获取系统状态失败: {ex.Message}", 500);
        }
    }

    /// <summary>
    /// 获取最近活动
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> RecentActivities([FromQuery] int count = 10)
    {
        try
        {
            var activities = await _activityLog.GetRecentActivitiesAsync(count);
            return Success(activities.Select(a => new
            {
                a.Id,
                a.Type,
                a.Title,
                a.Description,
                Time = FormatRelativeTime(a.Time),
                a.User
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取最近活动失败");
            return Failure($"获取最近活动失败: {ex.Message}", 500);
        }
    }

    /// <summary>
    /// 扫描并同步接口权限（自动扫描所有 Controller 的 PermissionAttribute）
    /// </summary>
    [HttpPost]
    [Permission("admin:sync-permissions")]
    public async Task<IActionResult> SyncPermissions()
    {
        try
        {
            _logger.LogInformation("开始扫描并同步权限...");
            var result = await _permissionDiscovery.ScanAndSyncPermissionsAsync();

            // 记录活动
            await _activityLog.LogActivityAsync("system", "权限同步", $"同步了 {result.Added} 个新权限，更新了 {result.Updated} 个权限", UserId.ToString(), UserName);

            return Success(new
            {
                result.Added,
                result.Updated,
                result.Removed,
                Permissions = result.Permissions
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "同步权限失败");
            return Failure($"同步权限失败: {ex.Message}", 500);
        }
    }

    /// <summary>
    /// 同步前端菜单到数据库
    /// </summary>
    [HttpPost]
    [Permission("admin:sync-menus")]
    public async Task<IActionResult> SyncMenus([FromBody] List<Neuro.Shared.Dtos.FrontendMenuItem> menus)
    {
        try
        {
            if (menus == null || menus.Count == 0)
            {
                return Failure("菜单列表不能为空");
            }

            _logger.LogInformation("开始同步菜单，共 {Count} 个顶级菜单", menus.Count);
            var result = await _menuSync.SyncMenusAsync(menus);

            // 记录活动
            await _activityLog.LogActivityAsync("system", "菜单同步", $"新增了 {result.Added} 个菜单，更新了 {result.Updated} 个菜单", UserId.ToString(), UserName);

            return Success(new
            {
                result.Added,
                result.Updated,
                result.Unchanged,
                result.Errors
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "同步菜单失败");
            return Failure($"同步菜单失败: {ex.Message}", 500);
        }
    }

    /// <summary>
    /// 获取扫描到的权限列表（预览，不保存）
    /// </summary>
    [HttpGet]
    [Permission("admin:view-permissions")]
    public async Task<IActionResult> PreviewPermissions()
    {
        try
        {
            var result = await _permissionDiscovery.ScanAndSyncPermissionsAsync();
            return Success(new
            {
                Preview = true,
                result.Permissions
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "预览权限失败");
            return Failure($"预览权限失败: {ex.Message}", 500);
        }
    }

    private string FormatRelativeTime(DateTime time)
    {
        var diff = DateTime.UtcNow - time;

        if (diff.TotalMinutes < 1)
            return "刚刚";
        if (diff.TotalMinutes < 60)
            return $"{diff.TotalMinutes:0}分钟前";
        if (diff.TotalHours < 24)
            return $"{diff.TotalHours:0}小时前";
        if (diff.TotalDays < 30)
            return $"{diff.TotalDays:0}天前";

        return time.ToString("yyyy-MM-dd");
    }
}
