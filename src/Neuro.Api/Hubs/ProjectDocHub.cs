using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Neuro.Api.Hubs;

/// <summary>
/// 项目文档生成进度 SignalR Hub - 实时推送文档生成状态
/// </summary>
[Authorize]
public class ProjectDocHub : Hub
{
    private readonly ILogger<ProjectDocHub> _logger;

    public ProjectDocHub(ILogger<ProjectDocHub> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// 客户端订阅项目文档生成进度
    /// </summary>
    public async Task SubscribeProject(string projectId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, projectId);
        _logger.LogDebug("客户端 {ConnectionId} 订阅项目 {ProjectId} 的文档生成进度", 
            Context.ConnectionId, projectId);
    }

    /// <summary>
    /// 客户端取消订阅
    /// </summary>
    public async Task UnsubscribeProject(string projectId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, projectId);
        _logger.LogDebug("客户端 {ConnectionId} 取消订阅项目 {ProjectId} 的文档生成进度", 
            Context.ConnectionId, projectId);
    }

    public override Task OnConnectedAsync()
    {
        _logger.LogDebug("客户端 {ConnectionId} 连接到 ProjectDocHub", Context.ConnectionId);
        return base.OnConnectedAsync();
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        if (exception != null)
        {
            _logger.LogWarning(exception, "客户端 {ConnectionId} 断开 ProjectDocHub 连接时发生错误", 
                Context.ConnectionId);
        }
        else
        {
            _logger.LogDebug("客户端 {ConnectionId} 断开 ProjectDocHub 连接", Context.ConnectionId);
        }
        return base.OnDisconnectedAsync(exception);
    }
}

/// <summary>
/// 文档生成进度更新
/// </summary>
public class DocGenProgressUpdate
{
    /// <summary>
    /// 项目 ID
    /// </summary>
    public Guid ProjectId { get; set; }

    /// <summary>
    /// 文档生成状态
    /// </summary>
    public int Status { get; set; }

    /// <summary>
    /// 状态描述
    /// </summary>
    public string StatusText { get; set; } = string.Empty;

    /// <summary>
    /// 进度百分比 (0-100)
    /// </summary>
    public int Progress { get; set; }

    /// <summary>
    /// 当前处理的消息
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// 最后生成时间
    /// </summary>
    public DateTime? LastDocGenAt { get; set; }
}
