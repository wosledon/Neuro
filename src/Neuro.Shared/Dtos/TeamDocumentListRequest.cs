namespace Neuro.Shared.Dtos;

public class TeamDocumentListRequest : PageBase
{
    public Guid? TeamId { get; set; }
    public Guid? DocumentId { get; set; }
}
