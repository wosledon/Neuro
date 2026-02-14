using Neuro.Shared.Enums;

namespace Neuro.Shared.Dtos;

public class GitCredentialUpsertRequest
{
    public Guid? Id { get; set; }
    public Guid? GitAccountId { get; set; }
    public GitCredentialTypeEnum? Type { get; set; }
    public string? Name { get; set; }
    public string? EncryptedSecret { get; set; }
    public string? PublicKey { get; set; }
    public string? PassphraseEncrypted { get; set; }
    public bool? IsActive { get; set; }
    public string? Notes { get; set; }
}
