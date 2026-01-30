using Neuro.Abstractions.Entity;

namespace Neuro.Api.Entity;

public class UserDocument : EntityBase
{
    public Guid UserId { get; set; }
    public Guid DocumentId { get; set; }
}
