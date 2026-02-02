namespace Neuro.Shared.Dtos;

public class BatchDeleteRequest
{
    public required Guid[] Ids { get; set; }
}
