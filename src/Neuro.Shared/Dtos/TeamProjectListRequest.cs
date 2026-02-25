namespace Neuro.Shared.Dtos;

public class TeamProjectListRequest : PageBase
{
    public Guid? TeamId { get; set; }
    public Guid? ProjectId { get; set; }
}
