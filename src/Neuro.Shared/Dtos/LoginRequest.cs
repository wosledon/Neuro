namespace Neuro.Shared.Dtos;

/// <summary>
/// 登录请求
/// </summary>
public class LoginRequest
{
    /// <summary>
    /// 账号
    /// </summary>
    public required string Account { get; set; }

    /// <summary>
    /// 密码
    /// </summary>
    public required string Password { get; set; }
}
