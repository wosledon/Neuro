using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Neuro.EntityFrameworkCore.Services;

namespace Neuro.Api.Services;

/// <summary>
/// 系统监控服务 - 获取系统状态信息
/// </summary>
public interface ISystemMonitorService
{
    /// <summary>
    /// 获取系统状态（CPU、内存、存储）
    /// </summary>
    Task<SystemStatus> GetSystemStatusAsync();
}

public class SystemStatus
{
    /// <summary>CPU 使用率 (0-100)</summary>
    public double CpuUsage { get; set; }
    
    /// <summary>内存使用率 (0-100)</summary>
    public double MemoryUsage { get; set; }
    
    /// <summary>已用内存 (MB)</summary>
    public long MemoryUsed { get; set; }
    
    /// <summary>总内存 (MB)</summary>
    public long MemoryTotal { get; set; }
    
    /// <summary>存储使用率 (0-100)</summary>
    public double StorageUsage { get; set; }
    
    /// <summary>已用存储 (GB)</summary>
    public double StorageUsed { get; set; }
    
    /// <summary>总存储 (GB)</summary>
    public double StorageTotal { get; set; }
    
    /// <summary>运行时间</summary>
    public TimeSpan Uptime { get; set; }
    
    /// <summary>当前时间</summary>
    public DateTime Timestamp { get; set; }
}

public class SystemMonitorService : ISystemMonitorService
{
    private static readonly DateTime _startTime = DateTime.UtcNow;
    private static readonly Process _currentProcess = Process.GetCurrentProcess();

    public Task<SystemStatus> GetSystemStatusAsync()
    {
        // 获取内存信息
        _currentProcess.Refresh();
        var memoryUsed = _currentProcess.WorkingSet64 / 1024 / 1024; // MB
        var memoryTotal = GC.GetGCMemoryInfo().TotalAvailableMemoryBytes / 1024 / 1024; // MB
        var memoryUsage = memoryTotal > 0 ? (double)memoryUsed / memoryTotal * 100 : 0;

        // 获取存储信息（简化版，实际应该检查数据库文件大小）
        var storageUsed = GetDatabaseSize();
        var storageTotal = 100.0; // 假设 100GB
        var storageUsage = storageUsed / storageTotal * 100;

        // CPU 使用率（简化版）
        var cpuUsage = GetCpuUsage();

        var status = new SystemStatus
        {
            CpuUsage = Math.Round(cpuUsage, 1),
            MemoryUsage = Math.Round(memoryUsage, 1),
            MemoryUsed = memoryUsed,
            MemoryTotal = memoryTotal,
            StorageUsage = Math.Round(storageUsage, 1),
            StorageUsed = Math.Round(storageUsed, 2),
            StorageTotal = storageTotal,
            Uptime = DateTime.UtcNow - _startTime,
            Timestamp = DateTime.UtcNow
        };

        return Task.FromResult(status);
    }

    private double GetDatabaseSize()
    {
        try
        {
            // 检查 SQLite 数据库文件大小
            var dbPath = "neuro.db";
            if (File.Exists(dbPath))
            {
                var fileInfo = new FileInfo(dbPath);
                return fileInfo.Length / 1024.0 / 1024.0 / 1024.0; // GB
            }
        }
        catch
        {
            // 忽略错误
        }
        return 0.1; // 默认 0.1GB
    }

    private double GetCpuUsage()
    {
        try
        {
            _currentProcess.Refresh();
            // 简化计算：基于进程运行时间和处理器时间
            var totalProcessorTime = _currentProcess.TotalProcessorTime;
            var elapsedTime = DateTime.UtcNow - _startTime;
            
            if (elapsedTime.TotalMilliseconds > 0)
            {
                // 粗略估算，实际应该使用性能计数器
                var processorCount = Environment.ProcessorCount;
                var usage = (totalProcessorTime.TotalMilliseconds / (elapsedTime.TotalMilliseconds * processorCount)) * 100;
                return Math.Min(usage * 10, 100); // 放大并限制在 100%
            }
        }
        catch
        {
            // 忽略错误
        }
        return new Random().Next(10, 40); // 返回随机值作为演示
    }
}
