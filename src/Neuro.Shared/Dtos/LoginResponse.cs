namespace Neuro.Shared.Dtos;

/// <summary>
/// 登录响应
/// </summary>
public record LoginResponse
{
    /// <summary>
    /// 访问令牌
    /// </summary>
    public required string AccessToken { get; init; }

    /// <summary>
    /// 刷新令牌
    /// </summary>
    public required string RefreshToken { get; init; }
}
