using Neuro.Abstractions.Entity;
using Neuro.Shared.Enums;

namespace Neuro.Api.Entity;

/// <summary>
/// 存储用于从服务端拉取代码仓库的凭据（注意：敏感数据应加密存储）
/// </summary>
public class GitCredential : EntityBase
{
    /// <summary>
    /// 关联的 Git 账号
    /// </summary>
    public Guid GitAccountId { get; set; }

    /// <summary>
    /// 凭据类型
    /// </summary>
    public GitCredentialTypeEnum Type { get; set; } = GitCredentialTypeEnum.Password;

    /// <summary>
    /// 凭据友好名称（便于在 UI 列表中区分）
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 加密后的秘密内容：
    /// - 密码 / 令牌：存储加密后的值
    /// - SSH：存储加密后的私钥
    /// </summary>
    public string EncryptedSecret { get; set; } = string.Empty;

    /// <summary>
    /// SSH 公钥（可选，便于展示或下发到远端）
    /// </summary>
    public string PublicKey { get; set; } = string.Empty;

    /// <summary>
    /// 私钥口令（如果私钥被口令保护，存储加密后的口令）
    /// </summary>
    public string PassphraseEncrypted { get; set; } = string.Empty;

    /// <summary>
    /// 是否启用该凭据
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// 最后一次使用时间（UTC）
    /// </summary>
    public DateTime? LastUsedAt { get; set; }

    /// <summary>
    /// 备注或用途说明
    /// </summary>
    public string Notes { get; set; } = string.Empty;
}
