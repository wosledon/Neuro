namespace Neuro.Shared.Dtos;

public class UserTeamListRequest : PageBase
{
    public Guid? UserId { get; set; }
    public Guid? TeamId { get; set; }
}
