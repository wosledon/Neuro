using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Neuro.Abstractions.Services;

namespace Neuro.Api.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public Guid? UserId
    {
        get
        {
            var id = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(id, out var g) ? g : null;
        }
    }

    public string? UserName => User?.FindFirst(ClaimTypes.Name)?.Value;

    public Guid? TenantId
    {
        get
        {
            var v = User?.FindFirst("tenant_id")?.Value ?? User?.FindFirst("tenant")?.Value;
            return Guid.TryParse(v, out var t) ? t : null;
        }
    }

    public bool IsSuper => User?.FindFirst("is_super")?.Value == "True";

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated == true;
}
