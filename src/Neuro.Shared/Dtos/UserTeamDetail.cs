namespace Neuro.Shared.Dtos;

public class UserTeamDetail
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public Guid TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
}
