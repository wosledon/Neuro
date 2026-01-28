using System;

namespace Neuro.Abstractions.Services;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? UserName { get; }
    Guid? TenantId { get; }
    bool IsAuthenticated { get; }
}
