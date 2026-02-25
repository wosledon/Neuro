namespace Neuro.Shared.Dtos;

public class UserDocumentListRequest : PageBase
{
    public Guid? UserId { get; set; }
    public Guid? DocumentId { get; set; }
}
