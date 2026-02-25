using Microsoft.EntityFrameworkCore;
using Neuro.Api.Entity;
using Neuro.EntityFrameworkCore.Services;
using Neuro.Shared.Dtos;

namespace Neuro.Api.Services;

/// <summary>
/// 菜单同步服务 - 处理前端上报的菜单
/// </summary>
public interface IMenuSyncService
{
    /// <summary>
    /// 同步前端菜单到数据库
    /// </summary>
    Task<MenuSyncResult> SyncMenusAsync(List<Neuro.Shared.Dtos.FrontendMenuItem> frontendMenus);
}

public class MenuSyncResult
{
    public int Added { get; set; }
    public int Updated { get; set; }
    public int Unchanged { get; set; }
    public List<string> Errors { get; set; } = new();
}

// 注意：FrontendMenuItem 已移动到 Neuro.Shared.Dtos 命名空间

public class MenuSyncService : IMenuSyncService
{
    private readonly IUnitOfWork _db;
    private readonly ILogger<MenuSyncService> _logger;

    public MenuSyncService(IUnitOfWork db, ILogger<MenuSyncService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<MenuSyncResult> SyncMenusAsync(List<Neuro.Shared.Dtos.FrontendMenuItem> frontendMenus)
    {
        var result = new MenuSyncResult();
        
        // 扁平化菜单列表
        var flatMenus = FlattenMenus(frontendMenus);
        
        // 获取现有菜单
        var existingMenus = await _db.Q<Menu>().ToListAsync();
        var existingByCode = existingMenus.ToDictionary(m => m.Code);
        
        // 处理每个菜单项
        foreach (var menuItem in flatMenus)
        {
            try
            {
                await ProcessMenuItemAsync(menuItem, existingByCode, result);
            }
            catch (Exception ex)
            {
                result.Errors.Add($"处理菜单 {menuItem.Code} 失败: {ex.Message}");
                _logger.LogError(ex, "处理菜单 {Code} 失败", menuItem.Code);
            }
        }

        await _db.SaveChangesAsync();
        
        _logger.LogInformation("菜单同步完成: 新增 {Added}, 更新 {Updated}, 未变更 {Unchanged}", 
            result.Added, result.Updated, result.Unchanged);
        
        return result;
    }

    private async Task ProcessMenuItemAsync(
        Neuro.Shared.Dtos.FrontendMenuItem item, 
        Dictionary<string, Menu> existingByCode, 
        MenuSyncResult result)
    {
        // 查找父菜单
        Guid? parentId = null;
        if (!string.IsNullOrEmpty(item.ParentCode))
        {
            var parent = existingByCode.GetValueOrDefault(item.ParentCode);
            if (parent != null)
            {
                parentId = parent.Id;
            }
        }

        if (existingByCode.TryGetValue(item.Code, out var existing))
        {
            // 更新现有菜单
            var needsUpdate = false;

            if (existing.Name != item.Name)
            {
                existing.Name = item.Name;
                needsUpdate = true;
            }
            if (existing.Url != (item.Url ?? string.Empty))
            {
                existing.Url = item.Url ?? string.Empty;
                needsUpdate = true;
            }
            if (existing.Icon != (item.Icon ?? string.Empty))
            {
                existing.Icon = item.Icon ?? string.Empty;
                needsUpdate = true;
            }
            if (existing.Sort != item.Sort)
            {
                existing.Sort = item.Sort;
                needsUpdate = true;
            }
            if (existing.ParentId != parentId)
            {
                existing.ParentId = parentId;
                // 更新 TreePath
                existing.TreePath = await BuildTreePathAsync(parentId);
                needsUpdate = true;
            }

            if (needsUpdate)
            {
                await _db.UpdateAsync(existing);
                result.Updated++;
                _logger.LogDebug("更新菜单: {Code}", item.Code);
            }
            else
            {
                result.Unchanged++;
            }
        }
        else
        {
            // 创建新菜单
            var newMenu = new Menu
            {
                Id = Guid.NewGuid(),
                Code = item.Code,
                Name = item.Name,
                Url = item.Url ?? string.Empty,
                Icon = item.Icon ?? string.Empty,
                Sort = item.Sort,
                ParentId = parentId,
                TreePath = await BuildTreePathAsync(parentId),
                Description = string.Empty
            };
            
            await _db.AddAsync(newMenu);
            existingByCode[item.Code] = newMenu; // 添加到字典供子菜单使用
            result.Added++;
            _logger.LogInformation("添加新菜单: {Code}", item.Code);
        }
    }

    private async Task<string> BuildTreePathAsync(Guid? parentId)
    {
        if (!parentId.HasValue) return string.Empty;
        
        var parent = await _db.Q<Menu>().FirstOrDefaultAsync(m => m.Id == parentId.Value);
        if (parent == null) return string.Empty;
        
        if (string.IsNullOrEmpty(parent.TreePath))
        {
            return parent.Id.ToString();
        }
        return $"{parent.TreePath}/{parent.Id}";
    }

    private List<Neuro.Shared.Dtos.FrontendMenuItem> FlattenMenus(List<Neuro.Shared.Dtos.FrontendMenuItem> menus, string? parentCode = null)
    {
        var result = new List<Neuro.Shared.Dtos.FrontendMenuItem>();
        
        foreach (var menu in menus)
        {
            var item = new Neuro.Shared.Dtos.FrontendMenuItem
            {
                Code = menu.Code,
                Name = menu.Name,
                Url = menu.Url,
                Icon = menu.Icon,
                Sort = menu.Sort,
                ParentCode = parentCode
            };
            result.Add(item);
            
            // 递归处理子菜单
            if (menu.Children?.Count > 0)
            {
                result.AddRange(FlattenMenus(menu.Children, menu.Code));
            }
        }
        
        return result;
    }
}
