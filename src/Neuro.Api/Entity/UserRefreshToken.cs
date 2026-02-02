using System;
using Neuro.Abstractions.Entity;

namespace Neuro.Api.Entity;

public class UserRefreshToken : EntityBase
{
    public Guid UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool Revoked { get; set; } = false;
    public string? ReplacedByToken { get; set; }
    public string? CreatedByIp { get; set; }
}