using Microsoft.AspNetCore.SignalR;
using Neuro.Api.Services;

namespace Neuro.Api.Hubs;

/// <summary>
/// 系统状态 SignalR Hub - 实时推送系统监控数据
/// </summary>
public class SystemStatusHub : Hub
{
    private readonly ISystemMonitorService _systemMonitor;
    private readonly ILogger<SystemStatusHub> _logger;

    public SystemStatusHub(ISystemMonitorService systemMonitor, ILogger<SystemStatusHub> logger)
    {
        _systemMonitor = systemMonitor;
        _logger = logger;
    }

    /// <summary>
    /// 客户端连接时立即发送一次系统状态
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        try
        {
            _logger.LogDebug("客户端 {ConnectionId} 连接到 SystemStatusHub", Context.ConnectionId);
            
            // 立即发送一次当前状态
            var status = await _systemMonitor.GetSystemStatusAsync();
            await Clients.Caller.SendAsync("SystemStatusUpdated", status);
            
            await base.OnConnectedAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "客户端连接 SystemStatusHub 时发生错误");
        }
    }

    /// <summary>
    /// 客户端断开连接
    /// </summary>
    public override Task OnDisconnectedAsync(Exception? exception)
    {
        if (exception != null)
        {
            _logger.LogWarning(exception, "客户端 {ConnectionId} 断开连接时发生错误", Context.ConnectionId);
        }
        else
        {
            _logger.LogDebug("客户端 {ConnectionId} 断开 SystemStatusHub 连接", Context.ConnectionId);
        }
        
        return base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// 客户端请求立即获取系统状态
    /// </summary>
    public async Task RequestSystemStatus()
    {
        try
        {
            var status = await _systemMonitor.GetSystemStatusAsync();
            await Clients.Caller.SendAsync("SystemStatusUpdated", status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "响应客户端系统状态请求时发生错误");
            await Clients.Caller.SendAsync("SystemStatusError", ex.Message);
        }
    }
}
