using System.Collections.Concurrent;
using System.Text.RegularExpressions;
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
                // 按照树状结构生成文档
                await GenerateDocsTreeAsync(project, db, hubContext, cancellationToken);
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
                return pullResult.Success;
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

                if (cloneResult.Success)
                {
                    return true;
                }

                if (await TryCloneWithSparseCheckoutAsync(project.RepositoryUrl, repoPath, cloneResult.Error, cancellationToken))
                {
                    _logger.LogWarning("项目 {ProjectId} 使用稀疏检出完成克隆（过滤非法路径）", project.Id);
                    return true;
                }

                return false;
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
    private async Task<GitCommandResult> ExecuteGitCommandAsync(string workingDir, string args, CancellationToken cancellationToken)
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
                return new GitCommandResult(false, string.Empty, "无法启动 Git 进程", -1);
            }

            var outputTask = process.StandardOutput.ReadToEndAsync(cancellationToken);
            var errorTask = process.StandardError.ReadToEndAsync(cancellationToken);

            await process.WaitForExitAsync(cancellationToken);

            var output = await outputTask;
            var error = await errorTask;

            if (process.ExitCode != 0)
            {
                _logger.LogError("Git 命令失败 (退出码: {ExitCode}): {Error}", process.ExitCode, error);
                return new GitCommandResult(false, output, error, process.ExitCode);
            }

            _logger.LogInformation("Git 命令执行成功: {Output}", output);
            return new GitCommandResult(true, output, error, process.ExitCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "执行 Git 命令失败: git {Args}", args);
            return new GitCommandResult(false, string.Empty, ex.Message, -1);
        }
    }

    private async Task<bool> TryCloneWithSparseCheckoutAsync(string repositoryUrl, string repoPath, string error, CancellationToken cancellationToken)
    {
        var invalidPaths = ExtractInvalidPaths(error);
        if (invalidPaths.Count == 0)
        {
            return false;
        }

        _logger.LogWarning("检测到非法路径，尝试稀疏检出：{Paths}", string.Join(" | ", invalidPaths));

        var parentDir = Path.GetDirectoryName(repoPath)!;
        var cloneResult = await ExecuteGitCommandAsync(parentDir, $"clone --no-checkout {repositoryUrl} \"{repoPath}\"", cancellationToken);
        if (!cloneResult.Success)
        {
            return false;
        }

        var initResult = await ExecuteGitCommandAsync(repoPath, "sparse-checkout init --no-cone", cancellationToken);
        if (!initResult.Success)
        {
            return false;
        }

        var sparseFile = Path.Combine(repoPath, ".git", "info", "sparse-checkout");
        var patterns = new List<string> { "**/*" };
        foreach (var path in invalidPaths)
        {
            patterns.Add("!" + path.Replace('\\', '/'));
        }

        Directory.CreateDirectory(Path.GetDirectoryName(sparseFile)!);
        await File.WriteAllLinesAsync(sparseFile, patterns, cancellationToken);

        var checkoutResult = await ExecuteGitCommandAsync(repoPath, "checkout -f", cancellationToken);
        return checkoutResult.Success;
    }

    private static IReadOnlyList<string> ExtractInvalidPaths(string error)
    {
        if (string.IsNullOrWhiteSpace(error))
        {
            return Array.Empty<string>();
        }

        var matches = Regex.Matches(error, "invalid path '([^']+)'", RegexOptions.IgnoreCase);
        if (matches.Count == 0)
        {
            return Array.Empty<string>();
        }

        var results = new List<string>();
        foreach (Match match in matches)
        {
            if (match.Success && match.Groups.Count > 1)
            {
                var path = match.Groups[1].Value;
                if (!string.IsNullOrWhiteSpace(path))
                {
                    results.Add(path);
                }
            }
        }

        return results;
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
    /// 按照树状结构生成文档 - 项目作为根节点，文件夹作为文档节点，文件作为叶子节点
    /// </summary>
    private async Task GenerateDocsTreeAsync(Project project, NeuroDbContext db, IHubContext<ProjectDocHub> hubContext, CancellationToken cancellationToken)
    {
        _logger.LogInformation("项目 {ProjectId} 按照树状结构生成文档", project.Id);

        if (string.IsNullOrEmpty(project.LocalRepositoryPath) || !Directory.Exists(project.LocalRepositoryPath))
        {
            _logger.LogWarning("项目 {ProjectId} 本地仓库不存在", project.Id);
            return;
        }

        var includePatterns = project.IncludePatterns.Split(',', StringSplitOptions.RemoveEmptyEntries);
        var excludePatterns = project.ExcludePatterns.Split(',', StringSplitOptions.RemoveEmptyEntries);

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
            rootDoc.Title = project.Name;
            rootDoc.Content = $"# {project.Name}\n\n> 项目代码文档\n\n- 仓库地址: {project.RepositoryUrl}\n- 生成时间: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}\n";
            rootDoc.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
        }

        // 2. 扫描目录结构并生成文档树
        var fileEntries = ScanDirectoryStructure(project.LocalRepositoryPath, includePatterns, excludePatterns);
        
        await BroadcastProgressAsync(hubContext, project.Id, ProjectDocGenStatus.Generating, 50, 
            $"正在处理 {fileEntries.Count} 个文件和文件夹...");

        // 3. 构建文档树
        var docMap = new Dictionary<string, Guid>(); // 路径 -> 文档ID映射
        docMap["/"] = rootDoc.Id; // 根路径映射到根文档

        // 先处理所有文件夹，创建文件夹文档
        var folders = fileEntries.Where(e => e.IsDirectory).OrderBy(e => e.RelativePath).ToList();
        int processedCount = 0;
        
        foreach (var folder in folders)
        {
            cancellationToken.ThrowIfCancellationRequested();
            
            var folderDoc = await GetOrCreateFolderDocumentAsync(db, project.Id, folder, docMap, cancellationToken);
            docMap[folder.RelativePath] = folderDoc.Id;
            
            processedCount++;
            if (processedCount % 10 == 0)
            {
                var progress = 50 + (int)((double)processedCount / fileEntries.Count * 25);
                await BroadcastProgressAsync(hubContext, project.Id, ProjectDocGenStatus.Generating, progress, 
                    $"已处理 {processedCount}/{fileEntries.Count} 个文件夹...");
            }
        }

        // 4. 处理所有文件
        var files = fileEntries.Where(e => !e.IsDirectory).ToList();
        processedCount = 0;
        
        foreach (var file in files)
        {
            cancellationToken.ThrowIfCancellationRequested();
            
            try
            {
                await GetOrCreateFileDocumentAsync(db, project.Id, file, docMap, cancellationToken);
                
                processedCount++;
                if (processedCount % 10 == 0)
                {
                    var progress = 75 + (int)((double)processedCount / files.Count * 20);
                    await BroadcastProgressAsync(hubContext, project.Id, ProjectDocGenStatus.Generating, progress, 
                        $"已处理 {processedCount}/{files.Count} 个文件...");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "处理文件 {File} 失败", file.FullPath);
            }
        }

        // 5. 清理已不存在的文档
        await CleanupDeletedDocumentsAsync(db, project.Id, fileEntries, cancellationToken);

        await db.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("项目 {ProjectId} 文档树生成完成，根文档: {RootDocId}, 处理了 {Count} 个条目",
            project.Id, rootDoc.Id, fileEntries.Count);
    }

    /// <summary>
    /// 扫描目录结构，返回所有文件和文件夹
    /// </summary>
    private List<FileSystemEntry> ScanDirectoryStructure(string basePath, string[] includePatterns, string[] excludePatterns)
    {
        var entries = new List<FileSystemEntry>();
        
        if (!Directory.Exists(basePath))
            return entries;

        // 递归扫描目录
        ScanDirectoryRecursive(basePath, "", includePatterns, excludePatterns, entries);
        
        return entries;
    }

    private void ScanDirectoryRecursive(string basePath, string relativePath, string[] includePatterns, string[] excludePatterns, List<FileSystemEntry> entries)
    {
        var currentFullPath = Path.Combine(basePath, relativePath);
        if (!Directory.Exists(currentFullPath))
            return;

        // 获取所有文件
        var files = Directory.GetFiles(currentFullPath);
        foreach (var file in files)
        {
            var fileName = Path.GetFileName(file);
            var fileRelativePath = string.IsNullOrEmpty(relativePath) ? fileName : Path.Combine(relativePath, fileName);
            var normalizedRelativePath = fileRelativePath.Replace('\\', '/');

            // 检查排除模式
            if (excludePatterns.Any(pattern => MatchesPattern(normalizedRelativePath, pattern.Trim())))
                continue;

            // 检查包含模式
            if (includePatterns.Any(pattern => MatchesPattern(normalizedRelativePath, pattern.Trim())))
            {
                entries.Add(new FileSystemEntry
                {
                    FullPath = file,
                    RelativePath = normalizedRelativePath,
                    Name = fileName,
                    IsDirectory = false
                });
            }
        }

        // 获取所有子目录
        var directories = Directory.GetDirectories(currentFullPath);
        foreach (var dir in directories)
        {
            var dirName = Path.GetFileName(dir);
            var dirRelativePath = string.IsNullOrEmpty(relativePath) ? dirName : Path.Combine(relativePath, dirName);
            var normalizedRelativePath = dirRelativePath.Replace('\\', '/');

            // 检查排除模式（跳过整个目录）
            if (excludePatterns.Any(pattern => MatchesPattern(normalizedRelativePath + "/", pattern.Trim())))
                continue;

            // 添加文件夹条目
            entries.Add(new FileSystemEntry
            {
                FullPath = dir,
                RelativePath = normalizedRelativePath,
                Name = dirName,
                IsDirectory = true
            });

            // 递归扫描子目录
            ScanDirectoryRecursive(basePath, dirRelativePath, includePatterns, excludePatterns, entries);
        }
    }

    /// <summary>
    /// 获取或创建文件夹文档
    /// </summary>
    private async Task<Entity.MyDocument> GetOrCreateFolderDocumentAsync(NeuroDbContext db, Guid projectId, 
        FileSystemEntry folder, Dictionary<string, Guid> docMap, CancellationToken cancellationToken)
    {
        // 计算父路径
        var parentPath = GetParentPath(folder.RelativePath);
        var parentId = docMap.TryGetValue(parentPath, out var pid) ? pid : (Guid?)null;
        var treePath = $"/{projectId}/{folder.RelativePath}";

        // 查找现有文档
        var existingDoc = await db.Set<Entity.MyDocument>()
            .FirstOrDefaultAsync(d => d.ProjectId == projectId && d.TreePath == treePath, cancellationToken);

        if (existingDoc != null)
        {
            // 更新现有文档
            existingDoc.Title = folder.Name;
            existingDoc.ParentId = parentId;
            existingDoc.UpdatedAt = DateTime.UtcNow;
            return existingDoc;
        }

        // 创建新文档
        var newDoc = new Entity.MyDocument
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            ParentId = parentId,
            Title = folder.Name,
            Content = $"# {folder.Name}\n\n> 文件夹\n\n路径: `{folder.RelativePath}`\n",
            TreePath = treePath,
            Sort = 0
        };
        await db.AddAsync(newDoc, cancellationToken);
        return newDoc;
    }

    /// <summary>
    /// 获取或创建文件文档
    /// </summary>
    private async Task<Entity.MyDocument> GetOrCreateFileDocumentAsync(NeuroDbContext db, Guid projectId, 
        FileSystemEntry file, Dictionary<string, Guid> docMap, CancellationToken cancellationToken)
    {
        // 计算父路径
        var parentPath = GetParentPath(file.RelativePath);
        var parentId = docMap.TryGetValue(parentPath, out var pid) ? pid : (Guid?)null;
        var treePath = $"/{projectId}/{file.RelativePath}";

        // 读取文件内容
        string content;
        try
        {
            content = await File.ReadAllTextAsync(file.FullPath, cancellationToken);
        }
        catch
        {
            content = "[无法读取文件内容]";
        }

        var extension = Path.GetExtension(file.FullPath).TrimStart('.');

        // 查找现有文档
        var existingDoc = await db.Set<Entity.MyDocument>()
            .FirstOrDefaultAsync(d => d.ProjectId == projectId && d.TreePath == treePath, cancellationToken);

        if (existingDoc != null)
        {
            // 更新现有文档
            existingDoc.Title = file.Name;
            existingDoc.Content = $"# {file.RelativePath}\n\n```{extension}\n{content}\n```";
            existingDoc.ParentId = parentId;
            existingDoc.UpdatedAt = DateTime.UtcNow;
            return existingDoc;
        }

        // 创建新文档
        var newDoc = new Entity.MyDocument
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            ParentId = parentId,
            Title = file.Name,
            Content = $"# {file.RelativePath}\n\n```{extension}\n{content}\n```",
            TreePath = treePath,
            Sort = 0
        };
        await db.AddAsync(newDoc, cancellationToken);
        return newDoc;
    }

    /// <summary>
    /// 获取父路径
    /// </summary>
    private string GetParentPath(string relativePath)
    {
        var lastSlashIndex = relativePath.LastIndexOf('/');
        if (lastSlashIndex < 0)
            return "/";
        return relativePath.Substring(0, lastSlashIndex);
    }

    /// <summary>
    /// 清理已删除的文档
    /// </summary>
    private async Task CleanupDeletedDocumentsAsync(NeuroDbContext db, Guid projectId, 
        List<FileSystemEntry> currentEntries, CancellationToken cancellationToken)
    {
        var currentPaths = new HashSet<string>(currentEntries.Select(e => $"/{projectId}/{e.RelativePath}"));
        currentPaths.Add($"/{projectId}"); // 保留根路径

        // 获取该项目下所有文档
        var allDocs = await db.Set<Entity.MyDocument>()
            .Where(d => d.ProjectId == projectId && d.ParentId != null) // 排除根文档
            .ToListAsync(cancellationToken);

        var docsToDelete = allDocs.Where(d => !currentPaths.Contains(d.TreePath)).ToList();
        
        if (docsToDelete.Count > 0)
        {
            _logger.LogInformation("清理 {Count} 个已不存在的文档", docsToDelete.Count);
            db.RemoveRange(docsToDelete);
        }
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
/// 文件系统条目
/// </summary>
internal sealed record FileSystemEntry
{
    public string FullPath { get; set; } = string.Empty;
    public string RelativePath { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsDirectory { get; set; }
}

internal sealed record GitCommandResult(bool Success, string Output, string Error, int ExitCode);

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
