using Microsoft.EntityFrameworkCore;
using Neuro.Api.Entity;
using Neuro.EntityFrameworkCore.Services;

namespace Neuro.Api.Services;

/// <summary>
/// 活动日志服务 - 记录和查询系统活动
/// </summary>
public interface IActivityLogService
{
    /// <summary>
    /// 记录活动
    /// </summary>
    Task LogActivityAsync(string type, string title, string description, string? userId = null, string? userName = null);
    
    /// <summary>
    /// 获取最近活动
    /// </summary>
    Task<List<ActivityItem>> GetRecentActivitiesAsync(int count = 10);
}

public class ActivityItem
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Type { get; set; } = "system"; // user, document, project, system
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime Time { get; set; } = DateTime.UtcNow;
    public string? User { get; set; }
}

public class ActivityLogService : IActivityLogService
{
    private readonly IUnitOfWork _db;
    private readonly ILogger<ActivityLogService> _logger;
    
    // 内存中的活动日志（简化版，实际应该使用数据库表）
    private static readonly List<ActivityItem> _activities = new();
    private static readonly int _maxActivities = 100;

    public ActivityLogService(IUnitOfWork db, ILogger<ActivityLogService> logger)
    {
        _db = db;
        _logger = logger;
        
        // 初始化一些示例数据
        InitializeSampleData();
    }

    private void InitializeSampleData()
    {
        if (_activities.Count == 0)
        {
            _activities.AddRange(new[]
            {
                new ActivityItem 
                { 
                    Id = Guid.NewGuid().ToString(),
                    Type = "user", 
                    Title = "新用户注册", 
                    Description = "用户 admin 刚刚完成了注册", 
                    Time = DateTime.UtcNow.AddMinutes(-2),
                    User = "系统"
                },
                new ActivityItem 
                { 
                    Id = Guid.NewGuid().ToString(),
                    Type = "document", 
                    Title = "文档更新", 
                    Description = "API 文档 v2.0 已更新", 
                    Time = DateTime.UtcNow.AddMinutes(-15),
                    User = "张三"
                },
                new ActivityItem 
                { 
                    Id = Guid.NewGuid().ToString(),
                    Type = "project", 
                    Title = "项目创建", 
                    Description = "新项目 \"Neuro AI\" 已创建", 
                    Time = DateTime.UtcNow.AddHours(-1),
                    User = "李四"
                },
                new ActivityItem 
                { 
                    Id = Guid.NewGuid().ToString(),
                    Type = "system", 
                    Title = "系统备份", 
                    Description = "每日自动备份已完成", 
                    Time = DateTime.UtcNow.AddHours(-3),
                    User = "系统"
                },
                new ActivityItem 
                { 
                    Id = Guid.NewGuid().ToString(),
                    Type = "user", 
                    Title = "角色变更", 
                    Description = "用户王五被分配为管理员", 
                    Time = DateTime.UtcNow.AddHours(-5),
                    User = "管理员"
                }
            });
        }
    }

    public Task LogActivityAsync(string type, string title, string description, string? userId = null, string? userName = null)
    {
        var activity = new ActivityItem
        {
            Id = Guid.NewGuid().ToString(),
            Type = type,
            Title = title,
            Description = description,
            Time = DateTime.UtcNow,
            User = userName ?? "系统"
        };

        _activities.Insert(0, activity);
        
        // 限制数量
        if (_activities.Count > _maxActivities)
        {
            _activities.RemoveAt(_activities.Count - 1);
        }

        _logger.LogInformation("Activity logged: {Title} - {Description}", title, description);
        return Task.CompletedTask;
    }

    public Task<List<ActivityItem>> GetRecentActivitiesAsync(int count = 10)
    {
        var activities = _activities
            .Take(count)
            .Select(a => new ActivityItem
            {
                Id = a.Id,
                Type = a.Type,
                Title = a.Title,
                Description = a.Description,
                Time = a.Time,
                User = a.User
            })
            .ToList();

        return Task.FromResult(activities);
    }
}
