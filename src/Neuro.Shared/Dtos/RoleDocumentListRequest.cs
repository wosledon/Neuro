namespace Neuro.Shared.Dtos;

public class RoleDocumentListRequest : PageBase
{
    public Guid? RoleId { get; set; }
    public Guid? DocumentId { get; set; }
}
