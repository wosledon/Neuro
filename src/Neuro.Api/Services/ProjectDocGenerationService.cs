using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;
using Neuro.Api.Entity;
using Neuro.Api.Hubs;
using Neuro.EntityFrameworkCore;
using Neuro.RAG.Abstractions;
using Microsoft.EntityFrameworkCore;
using Neuro.Shared.Enums;

namespace Neuro.Api.Services;

/// <summary>
/// 项目文档生成后台服务 - 从 Git 拉取代码并生成文档
/// </summary>
public class ProjectDocGenerationService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ProjectDocGenerationService> _logger;
    private readonly ConcurrentQueue<Guid> _pendingProjects = new();
    private readonly SemaphoreSlim _signal = new(0);

    public ProjectDocGenerationService(
        IServiceProvider serviceProvider,
        ILogger<ProjectDocGenerationService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    /// <summary>
    /// 将项目加入文档生成队列
    /// </summary>
    public void EnqueueProject(Guid projectId)
    {
        _pendingProjects.Enqueue(projectId);
        _signal.Release();
        _logger.LogInformation("项目 {ProjectId} 已加入文档生成队列", projectId);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("项目文档生成服务已启动");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await _signal.WaitAsync(TimeSpan.FromMinutes(1), stoppingToken);

                while (_pendingProjects.TryDequeue(out var projectId))
                {
                    await ProcessProjectAsync(projectId, stoppingToken);
                }
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "项目文档生成处理失败");
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }

        _logger.LogInformation("项目文档生成服务已停止");
    }

    private async Task ProcessProjectAsync(Guid projectId, CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<NeuroDbContext>();
        var hubContext = scope.ServiceProvider.GetRequiredService<IHubContext<ProjectDocHub>>();

        try
        {
            var project = await db.Set<Project>()
                .FirstOrDefaultAsync(p => p.Id == projectId, cancellationToken);

            if (project == null || project.IsDeleted)
            {
                _logger.LogWarning("项目 {ProjectId} 不存在或已删除", projectId);
                return;
            }

            // 检查项目类型是否支持 Git
            if (project.Type == ProjectTypeEnum.Document)
            {
                _logger.LogInformation("项目 {ProjectId} 是文档类型，跳过 Git 操作", projectId);
                await GenerateDocsWithoutGitAsync(project, db, hubContext, cancellationToken);
                return;
            }

            // 1. 更新状态为拉取中
            project.DocGenStatus = ProjectDocGenStatus.Pulling;
            await db.SaveChangesAsync(cancellationToken);
            await BroadcastProgressAsync(hubContext, projectId, ProjectDocGenStatus.Pulling, 10, "正在拉取代码仓库...");

            // 2. 拉取 Git 仓库
            var pullSuccess = await PullRepositoryAsync(project, cancellationToken);
            if (!pullSuccess)
            {
                project.DocGenStatus = ProjectDocGenStatus.Failed;
                await db.SaveChangesAsync(cancellationToken);
                await BroadcastProgressAsync(hubContext, projectId, ProjectDocGenStatus.Failed, 0, "代码仓库拉取失败");
                return;
            }

            project.LastPullAt = DateTime.UtcNow;
            await BroadcastProgressAsync(hubContext, projectId, ProjectDocGenStatus.Pulling, 30, "代码仓库拉取完成");

            // 3. 更新状态为生成中
            project.DocGenStatus = ProjectDocGenStatus.Generating;
            await db.SaveChangesAsync(cancellationToken);
            await BroadcastProgressAsync(hubContext, projectId, ProjectDocGenStatus.Generating, 40, "正在生成文档...");

            // 4. 生成文档
            if (project.EnableAIDocs && project.AISupportId.HasValue)
            {
                // 使用 AI 生成文档
                await GenerateDocsWithAIAsync(project, db, scope.ServiceProvider, hubContext, cancellationToken);
            }
            else
            {
                // 展平代码文件为文档
                await GenerateDocsFlattenAsync(project, db, hubContext, cancellationToken);
            }

            project.LastDocGenAt = DateTime.UtcNow;
            project.DocGenStatus = ProjectDocGenStatus.Completed;
            await db.SaveChangesAsync(cancellationToken);
            await BroadcastProgressAsync(hubContext, projectId, ProjectDocGenStatus.Completed, 100, "文档生成完成", project.LastDocGenAt);

            _logger.LogInformation("项目 {ProjectId} 文档生成完成", projectId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "项目 {ProjectId} 文档生成失败", projectId);

            try
            {
                var project = await db.Set<Project>().FirstOrDefaultAsync(p => p.Id == projectId, cancellationToken);
                if (project != null)
                {
                    project.DocGenStatus = ProjectDocGenStatus.Failed;
                    await db.SaveChangesAsync(cancellationToken);
                    await BroadcastProgressAsync(hubContext, projectId, ProjectDocGenStatus.Failed, 0, $"文档生成失败: {ex.Message}");
                }
            }
            catch { }
        }
    }

    /// <summary>
    /// 广播文档生成进度
    /// </summary>
    private async Task BroadcastProgressAsync(IHubContext<ProjectDocHub> hubContext, Guid projectId, ProjectDocGenStatus status, int progress, string message, DateTime? lastDocGenAt = null)
    {
        try
        {
            var update = new DocGenProgressUpdate
            {
                ProjectId = projectId,
                Status = (int)status,
                StatusText = GetStatusText(status),
                Progress = progress,
                Message = message,
                LastDocGenAt = lastDocGenAt
            };

            await hubContext.Clients.Group(projectId.ToString())
                .SendAsync("DocGenProgress", update);

            _logger.LogDebug("项目 {ProjectId} 进度更新: {Status} - {Progress}% - {Message}", 
                projectId, status, progress, message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "广播文档生成进度失败");
        }
    }

    /// <summary>
    /// 获取状态文本
    /// </summary>
    private string GetStatusText(ProjectDocGenStatus status) => status switch
    {
        ProjectDocGenStatus.Pending => "待处理",
        ProjectDocGenStatus.Pulling => "拉取中",
        ProjectDocGenStatus.Generating => "生成中",
        ProjectDocGenStatus.Completed => "已完成",
        ProjectDocGenStatus.Failed => "失败",
        _ => "未知"
    };

    /// <summary>
    /// 拉取 Git 仓库
    /// </summary>
    private async Task<bool> PullRepositoryAsync(Project project, CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrEmpty(project.RepositoryUrl))
            {
                _logger.LogWarning("项目 {ProjectId} 没有配置仓库地址", project.Id);
                return false;
            }

            // 设置本地仓库路径
            if (string.IsNullOrEmpty(project.LocalRepositoryPath))
            {
                var reposBasePath = Path.Combine(AppContext.BaseDirectory, "repositories");
                Directory.CreateDirectory(reposBasePath);
                project.LocalRepositoryPath = Path.Combine(reposBasePath, project.Id.ToString());
            }

            var repoPath = project.LocalRepositoryPath;

            // 检查是否已存在仓库
            if (Directory.Exists(Path.Combine(repoPath, ".git")))
            {
                // 执行 git pull
                _logger.LogInformation("项目 {ProjectId} 执行 git pull", project.Id);
                var pullResult = await ExecuteGitCommandAsync(repoPath, "pull", cancellationToken);
                return pullResult;
            }
            else
            {
                // 执行 git clone
                _logger.LogInformation("项目 {ProjectId} 执行 git clone", project.Id);

                // 清理旧目录
                if (Directory.Exists(repoPath))
                {
                    Directory.Delete(repoPath, true);
                }

                var cloneResult = await ExecuteGitCommandAsync(
                    Path.GetDirectoryName(repoPath)!,
                    $"clone {project.RepositoryUrl} \"{repoPath}\"",
                    cancellationToken);

                return cloneResult;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "项目 {ProjectId} Git 操作失败", project.Id);
            return false;
        }
    }

    /// <summary>
    /// 执行 Git 命令
    /// </summary>
    private async Task<bool> ExecuteGitCommandAsync(string workingDir, string args, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("执行 Git 命令: git {Args} (工作目录: {WorkingDir})", args, workingDir);
            
            var psi = new System.Diagnostics.ProcessStartInfo
            {
                FileName = "git",
                Arguments = args,
                WorkingDirectory = workingDir,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = System.Diagnostics.Process.Start(psi);
            if (process == null) 
            {
                _logger.LogError("无法启动 Git 进程，请确保 Git 已安装并在 PATH 中");
                return false;
            }

            var outputTask = process.StandardOutput.ReadToEndAsync(cancellationToken);
            var errorTask = process.StandardError.ReadToEndAsync(cancellationToken);
            
            await process.WaitForExitAsync(cancellationToken);
            
            var output = await outputTask;
            var error = await errorTask;

            if (process.ExitCode != 0)
            {
                _logger.LogError("Git 命令失败 (退出码: {ExitCode}): {Error}", process.ExitCode, error);
                return false;
            }

            _logger.LogInformation("Git 命令执行成功: {Output}", output);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "执行 Git 命令失败: git {Args}", args);
            return false;
        }
    }

    /// <summary>
    /// 使用 AI 生成文档
    /// </summary>
    private async Task GenerateDocsWithAIAsync(Project project, NeuroDbContext db, IServiceProvider sp, IHubContext<ProjectDocHub> hubContext, CancellationToken cancellationToken)
    {
        _logger.LogInformation("项目 {ProjectId} 使用 AI 生成文档", project.Id);

        await BroadcastProgressAsync(hubContext, project.Id, ProjectDocGenStatus.Generating, 50, "正在分析代码结构...");

        // TODO: 实现 AI 文档生成逻辑
        // 1. 读取代码文件
        // 2. 调用 AI 模型分析
        // 3. 生成文档并保存到 Document 表

        await Task.Delay(1000, cancellationToken); // 模拟处理时间
        await BroadcastProgressAsync(hubContext, project.Id, ProjectDocGenStatus.Generating, 80, "正在生成文档内容...");
    }

    /// <summary>
    /// 展平代码文件为文档（无 AI）- 项目作为根文档，文件作为子文档
    /// </summary>
    private async Task GenerateDocsFlattenAsync(Project project, NeuroDbContext db, IHubContext<ProjectDocHub> hubContext, CancellationToken cancellationToken)
    {
        _logger.LogInformation("项目 {ProjectId} 展平代码文件为文档", project.Id);

        if (string.IsNullOrEmpty(project.LocalRepositoryPath) || !Directory.Exists(project.LocalRepositoryPath))
        {
            _logger.LogWarning("项目 {ProjectId} 本地仓库不存在", project.Id);
            return;
        }

        var includePatterns = project.IncludePatterns.Split(',', StringSplitOptions.RemoveEmptyEntries);
        var excludePatterns = project.ExcludePatterns.Split(',', StringSplitOptions.RemoveEmptyEntries);

        // 获取所有匹配的文件
        var files = GetMatchingFiles(project.LocalRepositoryPath, includePatterns, excludePatterns);

        await BroadcastProgressAsync(hubContext, project.Id, ProjectDocGenStatus.Generating, 50, $"正在处理 {files.Count} 个文件...");

        // 1. 创建或获取项目根文档
        var rootDoc = await db.Set<Entity.MyDocument>()
            .FirstOrDefaultAsync(d => d.ProjectId == project.Id && d.ParentId == null, cancellationToken);
        
        if (rootDoc == null)
        {
            rootDoc = new Entity.MyDocument
            {
                Id = Guid.NewGuid(),
                ProjectId = project.Id,
                Title = project.Name,
                Content = $"# {project.Name}\n\n> 项目代码文档\n\n- 仓库地址: {project.RepositoryUrl}\n- 生成时间: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}\n",
                TreePath = $"/{project.Id}",
                Sort = 0
            };
            await db.AddAsync(rootDoc, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("创建项目根文档: {DocId}", rootDoc.Id);
        }
        else
        {
            // 更新根文档内容
            rootDoc.Content = $"# {project.Name}\n\n> 项目代码文档\n\n- 仓库地址: {project.RepositoryUrl}\n- 生成时间: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}\n";
            rootDoc.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
        }

        // 2. 为每个文件创建子文档
        int processedCount = 0;
        foreach (var file in files)
        {
            cancellationToken.ThrowIfCancellationRequested();

            try
            {
                var relativePath = Path.GetRelativePath(project.LocalRepositoryPath, file);
                var content = await File.ReadAllTextAsync(file, cancellationToken);
                var extension = Path.GetExtension(file).TrimStart('.');

                // 检查是否已存圩该文件对应的文档（通过 TreePath 匹配）
                var fileTreePath = $"/{project.Id}/{relativePath.Replace(Path.DirectorySeparatorChar, '/')}";
                var existingDoc = await db.Set<Entity.MyDocument>()
                    .FirstOrDefaultAsync(d => d.ProjectId == project.Id && d.TreePath == fileTreePath, cancellationToken);

                if (existingDoc != null)
                {
                    // 更新现有文档
                    existingDoc.Content = $"# {relativePath}\n\n```{extension}\n{content}\n```";
                    existingDoc.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    // 创建新文档，作为项目根文档的子文档
                    var doc = new Entity.MyDocument
                    {
                        Id = Guid.NewGuid(),
                        ProjectId = project.Id,
                        ParentId = rootDoc.Id,  // 设置父文档为项目根文档
                        Title = Path.GetFileName(relativePath),
                        Content = $"# {relativePath}\n\n```{extension}\n{content}\n```",
                        TreePath = fileTreePath,
                        Sort = processedCount
                    };
                    await db.AddAsync(doc, cancellationToken);
                }

                processedCount++;
                // 每处理 10 个文件更新一次进度
                if (processedCount % 10 == 0)
                {
                    var progress = 50 + (int)((double)processedCount / files.Count * 40);
                    await BroadcastProgressAsync(hubContext, project.Id, ProjectDocGenStatus.Generating, progress, $"已处理 {processedCount}/{files.Count} 个文件...");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "处理文件 {File} 失败", file);
            }
        }

        await db.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("项目 {ProjectId} 展平完成，根文档: {RootDocId}, 处理了 {Count} 个文件", 
            project.Id, rootDoc.Id, files.Count);
    }

    /// <summary>
    /// 无 Git 的文档生成（纯文档类型项目）
    /// </summary>
    private async Task GenerateDocsWithoutGitAsync(Project project, NeuroDbContext db, IHubContext<ProjectDocHub> hubContext, CancellationToken cancellationToken)
    {
        _logger.LogInformation("项目 {ProjectId} 是文档类型，无需 Git 操作", project.Id);
        project.DocGenStatus = ProjectDocGenStatus.Completed;
        await db.SaveChangesAsync(cancellationToken);
        await BroadcastProgressAsync(hubContext, project.Id, ProjectDocGenStatus.Completed, 100, "文档生成完成", DateTime.UtcNow);
    }

    /// <summary>
    /// 获取匹配的文件列表
    /// </summary>
    private List<string> GetMatchingFiles(string basePath, string[] includePatterns, string[] excludePatterns)
    {
        var files = new List<string>();
        var allFiles = Directory.GetFiles(basePath, "*.*", SearchOption.AllDirectories);

        foreach (var file in allFiles)
        {
            var relativePath = Path.GetRelativePath(basePath, file);

            // 检查排除模式
            bool isExcluded = excludePatterns.Any(pattern =>
                MatchesPattern(relativePath, pattern.Trim()));
            if (isExcluded) continue;

            // 检查包含模式
            bool isIncluded = includePatterns.Any(pattern =>
                MatchesPattern(relativePath, pattern.Trim()));
            if (isIncluded)
            {
                files.Add(file);
            }
        }

        return files;
    }

    /// <summary>
    /// 简单的 glob 模式匹配
    /// </summary>
    private bool MatchesPattern(string path, string pattern)
    {
        // 简单的通配符匹配
        if (pattern.Contains("*"))
        {
            var regex = pattern.Replace(".", "\\.").Replace("*", ".*");
            return System.Text.RegularExpressions.Regex.IsMatch(path, regex,
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        }
        return path.Equals(pattern, StringComparison.OrdinalIgnoreCase);
    }
}

/// <summary>
/// 项目文档生成服务扩展方法
/// </summary>
public static class ProjectDocGenerationExtensions
{
    private static ProjectDocGenerationService? _service;

    public static void SetProjectDocGenerationService(ProjectDocGenerationService service)
    {
        _service = service;
    }

    /// <summary>
    /// 触发项目文档生成
    /// </summary>
    public static void TriggerDocGeneration(Guid projectId)
    {
        _service?.EnqueueProject(projectId);
    }
}
