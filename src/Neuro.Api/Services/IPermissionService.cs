namespace Neuro.Api.Services;

/// <summary>
/// 权限服务接口
/// </summary>
public interface IPermissionService
{
    /// <summary>
    /// 检查用户是否拥有指定权限
    /// </summary>
    Task<bool> HasPermissionAsync(Guid userId, string permissionCode);

    /// <summary>
    /// 获取用户的所有权限代码
    /// </summary>
    Task<IReadOnlyList<string>> GetUserPermissionsAsync(Guid userId);

    /// <summary>
    /// 获取用户的所有菜单
    /// </summary>
    Task<IReadOnlyList<MenuInfo>> GetUserMenusAsync(Guid userId);

    /// <summary>
    /// 检查用户是否有权访问文档
    /// </summary>
    Task<bool> CanAccessDocumentAsync(Guid userId, Guid documentId);

    /// <summary>
    /// 检查用户是否属于团队
    /// </summary>
    Task<bool> IsUserInTeamAsync(Guid userId, Guid teamId);

    /// <summary>
    /// 检查用户是否可以访问项目
    /// </summary>
    Task<bool> CanAccessProjectAsync(Guid userId, Guid projectId);

    /// <summary>
    /// 获取用户可访问的文档ID列表
    /// </summary>
    Task<IReadOnlyList<Guid>> GetAccessibleDocumentIdsAsync(Guid userId);

    /// <summary>
    /// 获取用户可访问的项目ID列表
    /// </summary>
    Task<IReadOnlyList<Guid>> GetAccessibleProjectIdsAsync(Guid userId);
}

/// <summary>
/// 菜单信息
/// </summary>
public class MenuInfo
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public Guid? ParentId { get; set; }
    public string TreePath { get; set; } = string.Empty;
    public int Sort { get; set; }
    public List<MenuInfo> Children { get; set; } = new();
}
