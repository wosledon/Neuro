using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Neuro.Api.Services;

namespace Neuro.Api.Authorization;

/// <summary>
/// 权限检查特性
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = true)]
public class PermissionAttribute : AuthorizeAttribute, IAsyncAuthorizationFilter
{
    public string PermissionCode { get; }

    public PermissionAttribute(string permissionCode)
    {
        PermissionCode = permissionCode;
    }

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;
        if (!user.Identity?.IsAuthenticated ?? true)
        {
            context.Result = new ForbidResult();
            return;
        }

        var userIdClaim = user.FindFirst("user_id")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            context.Result = new ForbidResult();
            return;
        }

        var permissionService = context.HttpContext.RequestServices.GetService<IPermissionService>();
        if (permissionService is null)
        {
            context.Result = new ForbidResult();
            return;
        }

        var hasPermission = await permissionService.HasPermissionAsync(userId, PermissionCode);
        if (!hasPermission)
        {
            context.Result = new ObjectResult(new { Code = 403, Message = $"缺少权限: {PermissionCode}" })
            {
                StatusCode = 403
            };
        }
    }
}
