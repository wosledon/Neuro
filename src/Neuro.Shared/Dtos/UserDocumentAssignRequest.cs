namespace Neuro.Shared.Dtos;

public class UserDocumentAssignRequest
{
    public Guid UserId { get; set; }
    public Guid[] DocumentIds { get; set; } = Array.Empty<Guid>();
}
