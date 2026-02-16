using System.Reflection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;
using Microsoft.EntityFrameworkCore;
using Neuro.Api.Authorization;
using Neuro.Api.Entity;
using Neuro.EntityFrameworkCore.Services;

namespace Neuro.Api.Services;

/// <summary>
/// 权限发现服务 - 自动扫描并同步接口权限
/// </summary>
public interface IPermissionDiscoveryService
{
    /// <summary>
    /// 扫描并同步所有权限
    /// </summary>
    Task<PermissionSyncResult> ScanAndSyncPermissionsAsync();
}

public class PermissionSyncResult
{
    public int Added { get; set; }
    public int Updated { get; set; }
    public int Removed { get; set; }
    public List<string> Permissions { get; set; } = new();
}

public class PermissionDiscoveryService : IPermissionDiscoveryService
{
    private readonly IUnitOfWork _db;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<PermissionDiscoveryService> _logger;

    public PermissionDiscoveryService(
        IUnitOfWork db, 
        IServiceProvider serviceProvider,
        ILogger<PermissionDiscoveryService> logger)
    {
        _db = db;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task<PermissionSyncResult> ScanAndSyncPermissionsAsync()
    {
        var result = new PermissionSyncResult();
        
        // 1. 扫描所有权限
        var scannedPermissions = ScanPermissions();
        result.Permissions = scannedPermissions.Select(p => p.Code).ToList();
        
        _logger.LogInformation("扫描到 {Count} 个权限", scannedPermissions.Count);

        // 2. 获取数据库中现有的权限
        var existingPermissions = await _db.Q<Permission>().ToListAsync();
        var existingCodes = existingPermissions.ToDictionary(p => p.Code);

        // 3. 添加新权限
        foreach (var perm in scannedPermissions)
        {
            if (!existingCodes.ContainsKey(perm.Code))
            {
                var newPerm = new Permission
                {
                    Id = Guid.NewGuid(),
                    Name = perm.Name,
                    Code = perm.Code,
                    Description = perm.Description,
                    Action = perm.Action,
                    Method = perm.Method,
                    MenuId = null
                };
                await _db.AddAsync(newPerm);
                result.Added++;
                _logger.LogInformation("添加新权限: {Code}", perm.Code);
            }
            else
            {
                // 更新现有权限的信息（如果发生变化）
                var existing = existingCodes[perm.Code];
                var needsUpdate = false;

                if (existing.Name != perm.Name)
                {
                    existing.Name = perm.Name;
                    needsUpdate = true;
                }
                if (existing.Action != perm.Action)
                {
                    existing.Action = perm.Action;
                    needsUpdate = true;
                }
                if (existing.Method != perm.Method)
                {
                    existing.Method = perm.Method;
                    needsUpdate = true;
                }

                if (needsUpdate)
                {
                    await _db.UpdateAsync(existing);
                    result.Updated++;
                    _logger.LogInformation("更新权限: {Code}", perm.Code);
                }
            }
        }

        // 4. 标记已删除的权限（可选：软删除或记录日志）
        var scannedCodes = scannedPermissions.Select(p => p.Code).ToHashSet();
        foreach (var existing in existingPermissions)
        {
            if (!scannedCodes.Contains(existing.Code) && !existing.Code.StartsWith("menu:"))
            {
                // 只删除非菜单权限，菜单权限由前端管理
                // 这里选择不自动删除，而是记录日志，避免误删
                _logger.LogWarning("权限 {Code} 在代码中不存在，建议手动检查", existing.Code);
            }
        }

        await _db.SaveChangesAsync();
        
        _logger.LogInformation("权限同步完成: 新增 {Added}, 更新 {Updated}", result.Added, result.Updated);
        
        return result;
    }

    private List<ScannedPermission> ScanPermissions()
    {
        var permissions = new List<ScannedPermission>();
        
        // 获取所有 Controller 类型
        var controllerTypes = Assembly.GetExecutingAssembly()
            .GetTypes()
            .Where(t => t.IsClass && !t.IsAbstract && t.IsSubclassOf(typeof(ControllerBase)))
            .ToList();

        foreach (var controllerType in controllerTypes)
        {
            var methods = controllerType.GetMethods(BindingFlags.Public | BindingFlags.Instance)
                .Where(m => m.DeclaringType == controllerType || m.DeclaringType?.IsSubclassOf(typeof(ControllerBase)) == true)
                .ToList();

            foreach (var method in methods)
            {
                // 检查是否有 PermissionAttribute
                var permAttr = method.GetCustomAttribute<PermissionAttribute>();
                if (permAttr != null)
                {
                    var httpAttr = method.GetCustomAttributes<HttpMethodAttribute>().FirstOrDefault();
                    var actionName = method.Name;
                    var controllerName = controllerType.Name.Replace("Controller", "");
                    
                    permissions.Add(new ScannedPermission
                    {
                        Code = permAttr.PermissionCode,
                        Name = GeneratePermissionName(controllerName, actionName, permAttr.PermissionCode),
                        Description = $"{controllerName} - {actionName}",
                        Action = $"/api/{controllerName}/{actionName}",
                        Method = httpAttr?.HttpMethods.FirstOrDefault() ?? "GET"
                    });
                }
            }
        }

        return permissions;
    }

    private string GeneratePermissionName(string controller, string action, string code)
    {
        // 尝试从代码生成可读名称
        var parts = code.Split(':');
        if (parts.Length >= 2)
        {
            var resource = parts[0];
            var operation = parts[1];
            var operationName = operation.ToLower() switch
            {
                "view" => "查看",
                "list" => "列表",
                "create" => "创建",
                "update" => "更新",
                "delete" => "删除",
                "manage" => "管理",
                "sync" => "同步",
                "export" => "导出",
                "import" => "导入",
                _ => operation
            };
            return $"{resource}:{operationName}";
        }
        return $"{controller}:{action}";
    }
}

public class ScannedPermission
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
}
