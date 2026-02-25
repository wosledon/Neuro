namespace Neuro.Shared.Dtos;

/// <summary>
/// 前端菜单项 - 用于前端上报菜单结构
/// </summary>
public class FrontendMenuItem
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Url { get; set; }
    public string? Icon { get; set; }
    public int Sort { get; set; }
    public string? ParentCode { get; set; }
    public List<FrontendMenuItem> Children { get; set; } = new();
}
