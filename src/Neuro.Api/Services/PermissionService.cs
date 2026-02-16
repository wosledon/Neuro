using Microsoft.EntityFrameworkCore;
using Neuro.Api.Entity;
using DocumentEntity = Neuro.Api.Entity.MyDocument;
using Neuro.EntityFrameworkCore.Services;

namespace Neuro.Api.Services;

public class PermissionService : IPermissionService
{
    private readonly IUnitOfWork _db;

    public PermissionService(IUnitOfWork db)
    {
        _db = db;
    }

    public async Task<bool> HasPermissionAsync(Guid userId, string permissionCode)
    {
        // 超级管理员拥有所有权限
        var user = await _db.Q<User>().FirstOrDefaultAsync(u => u.Id == userId);
        if (user?.IsSuper == true) return true;

        // 检查用户是否通过角色拥有该权限
        return await _db.Q<UserRole>()
            .Where(ur => ur.UserId == userId)
            .Join(_db.Q<RolePermission>(), ur => ur.RoleId, rp => rp.RoleId, (ur, rp) => rp)
            .Join(_db.Q<Permission>(), rp => rp.PermissionId, p => p.Id, (rp, p) => p)
            .AnyAsync(p => p.Code == permissionCode);
    }

    public async Task<IReadOnlyList<string>> GetUserPermissionsAsync(Guid userId)
    {
        var user = await _db.Q<User>().FirstOrDefaultAsync(u => u.Id == userId);
        if (user?.IsSuper == true)
        {
            // 超级管理员返回所有权限
            return await _db.Q<Permission>()
                .Select(p => p.Code)
                .Distinct()
                .ToListAsync();
        }

        return await _db.Q<UserRole>()
            .Where(ur => ur.UserId == userId)
            .Join(_db.Q<RolePermission>(), ur => ur.RoleId, rp => rp.RoleId, (ur, rp) => rp)
            .Join(_db.Q<Permission>(), rp => rp.PermissionId, p => p.Id, (rp, p) => p.Code)
            .Distinct()
            .ToListAsync();
    }

    public async Task<IReadOnlyList<MenuInfo>> GetUserMenusAsync(Guid userId)
    {
        var user = await _db.Q<User>().FirstOrDefaultAsync(u => u.Id == userId);

        List<Menu> menus;
        if (user?.IsSuper == true)
        {
            // 超级管理员返回所有启用状态的菜单
            menus = await _db.Q<Menu>()
                .OrderBy(m => m.Sort)
                .ThenBy(m => m.CreatedAt)
                .ToListAsync();
        }
        else
        {
            // 普通用户返回角色关联的菜单
            menus = await _db.Q<UserRole>()
                .Where(ur => ur.UserId == userId)
                .Join(_db.Q<RoleMenu>(), ur => ur.RoleId, rm => rm.RoleId, (ur, rm) => rm)
                .Join(_db.Q<Menu>(), rm => rm.MenuId, m => m.Id, (rm, m) => m)
                .Distinct()
                .OrderBy(m => m.Sort)
                .ThenBy(m => m.CreatedAt)
                .ToListAsync();
        }

        return BuildMenuTree(menus);
    }

    public async Task<bool> CanAccessDocumentAsync(Guid userId, Guid documentId)
    {
        // 超级管理员可以访问所有文档
        var user = await _db.Q<User>().FirstOrDefaultAsync(u => u.Id == userId);
        if (user?.IsSuper == true) return true;

        // 检查直接用户文档授权
        var hasDirectAccess = await _db.Q<UserDocument>()
            .AnyAsync(ud => ud.UserId == userId && ud.DocumentId == documentId);
        if (hasDirectAccess) return true;

        // 检查用户团队是否有文档授权
        var userTeamIds = await _db.Q<UserTeam>()
            .Where(ut => ut.UserId == userId)
            .Select(ut => ut.TeamId)
            .ToListAsync();

        var hasTeamAccess = await _db.Q<TeamDocument>()
            .AnyAsync(td => userTeamIds.Contains(td.TeamId) && td.DocumentId == documentId);
        if (hasTeamAccess) return true;

        // 检查用户角色是否有文档授权
        var userRoleIds = await _db.Q<UserRole>()
            .Where(ur => ur.UserId == userId)
            .Select(ur => ur.RoleId)
            .ToListAsync();

        return await _db.Q<RoleDocument>()
            .AnyAsync(rd => userRoleIds.Contains(rd.RoleId) && rd.DocumentId == documentId);
    }

    public async Task<bool> IsUserInTeamAsync(Guid userId, Guid teamId)
    {
        var user = await _db.Q<User>().FirstOrDefaultAsync(u => u.Id == userId);
        if (user?.IsSuper == true) return true;

        return await _db.Q<UserTeam>()
            .AnyAsync(ut => ut.UserId == userId && ut.TeamId == teamId);
    }

    public async Task<bool> CanAccessProjectAsync(Guid userId, Guid projectId)
    {
        // 超级管理员可以访问所有项目
        var user = await _db.Q<User>().FirstOrDefaultAsync(u => u.Id == userId);
        if (user?.IsSuper == true) return true;

        // 检查用户所在团队是否有项目权限
        var userTeamIds = await _db.Q<UserTeam>()
            .Where(ut => ut.UserId == userId)
            .Select(ut => ut.TeamId)
            .ToListAsync();

        return await _db.Q<TeamProject>()
            .AnyAsync(tp => userTeamIds.Contains(tp.TeamId) && tp.ProjectId == projectId);
    }

    public async Task<IReadOnlyList<Guid>> GetAccessibleDocumentIdsAsync(Guid userId)
    {
        var user = await _db.Q<User>().FirstOrDefaultAsync(u => u.Id == userId);
        if (user?.IsSuper == true)
        {
            // 超级管理员可以访问所有文档
            return await _db.Q<DocumentEntity>()
                .Select(d => d.Id)
                .ToListAsync();
        }

        // 收集用户可访问的所有文档ID
        var accessibleIds = new HashSet<Guid>();

        // 直接授权的文档
        var directDocs = await _db.Q<UserDocument>()
            .Where(ud => ud.UserId == userId)
            .Select(ud => ud.DocumentId)
            .ToListAsync();
        accessibleIds.UnionWith(directDocs);

        // 通过团队授权的文档
        var userTeamIds = await _db.Q<UserTeam>()
            .Where(ut => ut.UserId == userId)
            .Select(ut => ut.TeamId)
            .ToListAsync();

        var teamDocs = await _db.Q<TeamDocument>()
            .Where(td => userTeamIds.Contains(td.TeamId))
            .Select(td => td.DocumentId)
            .ToListAsync();
        accessibleIds.UnionWith(teamDocs);

        // 通过角色授权的文档
        var userRoleIds = await _db.Q<UserRole>()
            .Where(ur => ur.UserId == userId)
            .Select(ur => ur.RoleId)
            .ToListAsync();

        var roleDocs = await _db.Q<RoleDocument>()
            .Where(rd => userRoleIds.Contains(rd.RoleId))
            .Select(rd => rd.DocumentId)
            .ToListAsync();
        accessibleIds.UnionWith(roleDocs);

        return accessibleIds.ToList();
    }

    private static List<MenuInfo> BuildMenuTree(List<Menu> menus)
    {
        var menuDict = menus.ToDictionary(
            m => m.Id,
            m => new MenuInfo
            {
                Id = m.Id,
                Name = m.Name,
                Code = m.Code,
                Url = m.Url,
                Icon = m.Icon,
                ParentId = m.ParentId,
                TreePath = m.TreePath,
                Sort = m.Sort
            }
        );

        var rootMenus = new List<MenuInfo>();

        foreach (var menu in menuDict.Values.OrderBy(m => m.Sort))
        {
            if (menu.ParentId.HasValue && menuDict.TryGetValue(menu.ParentId.Value, out var parent))
            {
                parent.Children.Add(menu);
            }
            else
            {
                rootMenus.Add(menu);
            }
        }

        return rootMenus;
    }
}
