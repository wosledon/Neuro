namespace Neuro.Shared.Dtos;

/// <summary>
/// 登录请求
/// </summary>
public record LoginRequest
{
    /// <summary>
    /// 账号
    /// </summary>
    public required string Account { get; init; }

    /// <summary>
    /// 密码
    /// </summary>
    public required string Password { get; init; }
}
