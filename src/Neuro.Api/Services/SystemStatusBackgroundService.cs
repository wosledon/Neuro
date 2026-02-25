using Microsoft.AspNetCore.SignalR;
using Neuro.Api.Hubs;

namespace Neuro.Api.Services;

/// <summary>
/// 系统状态后台服务 - 定时推送系统状态到所有连接的客户端
/// </summary>
public class SystemStatusBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<SystemStatusBackgroundService> _logger;
    private readonly TimeSpan _updateInterval = TimeSpan.FromSeconds(1); // 每 1 秒更新一次

    public SystemStatusBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<SystemStatusBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("系统状态推送服务已启动，更新间隔: {Interval}s", _updateInterval.TotalSeconds);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(_updateInterval, stoppingToken);
                
                if (stoppingToken.IsCancellationRequested)
                    break;

                await BroadcastSystemStatusAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "推送系统状态时发生错误");
            }
        }

        _logger.LogInformation("系统状态推送服务已停止");
    }

    private async Task BroadcastSystemStatusAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        
        var hubContext = scope.ServiceProvider.GetRequiredService<IHubContext<SystemStatusHub>>();
        var systemMonitor = scope.ServiceProvider.GetRequiredService<ISystemMonitorService>();

        try
        {
            var status = await systemMonitor.GetSystemStatusAsync();
            
            // 将 TimeSpan 转换为格式化的字符串，避免小数点
            // 格式: 总小时数:分钟:秒，确保时间连续递增
            var totalHours = (int)status.Uptime.TotalHours;
            var minutes = status.Uptime.Minutes;
            var seconds = status.Uptime.Seconds;
            var uptimeString = $"{totalHours:D2}:{minutes:D2}:{seconds:D2}";
            
            var statusDto = new
            {
                status.CpuUsage,
                status.MemoryUsage,
                status.MemoryUsed,
                status.MemoryTotal,
                status.StorageUsage,
                status.StorageUsed,
                status.StorageTotal,
                Uptime = uptimeString,
                status.Timestamp
            };
            
            // 广播到所有连接的客户端
            await hubContext.Clients.All.SendAsync("SystemStatusUpdated", statusDto, cancellationToken);
            
            _logger.LogDebug("系统状态已广播: CPU {CpuUsage}%, Memory {MemoryUsage}%", 
                status.CpuUsage, status.MemoryUsage);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取或广播系统状态时发生错误");
        }
    }
}
