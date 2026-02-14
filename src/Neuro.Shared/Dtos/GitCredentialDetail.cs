using Neuro.Shared.Enums;

namespace Neuro.Shared.Dtos;

public class GitCredentialDetail
{
    public Guid Id { get; set; }
    public Guid GitAccountId { get; set; }
    public GitCredentialTypeEnum Type { get; set; }
    public string Name { get; set; } = string.Empty;
    public string EncryptedSecret { get; set; } = string.Empty;
    public string PublicKey { get; set; } = string.Empty;
    public string PassphraseEncrypted { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime? LastUsedAt { get; set; }
    public string Notes { get; set; } = string.Empty;
}
