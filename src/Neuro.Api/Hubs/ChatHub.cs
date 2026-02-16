using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Neuro.Api.Controllers;
using Neuro.Api.Entity;
using Neuro.EntityFrameworkCore.Services;
using Neuro.RAG.Abstractions;
using Neuro.RAG.Models;
using Neuro.Shared.Enums;

namespace Neuro.Api.Hubs;

/// <summary>
/// AI 聊天 SignalR Hub - 流式输出 AI 回答
/// </summary>
[Authorize]
public class ChatHub : Hub
{
    private readonly IUnitOfWork _db;
    private readonly ISearchService _searchService;
    private readonly IRagService _ragService;
    private readonly ILogger<ChatHub> _logger;

    public ChatHub(
        IUnitOfWork db,
        ISearchService searchService,
        IRagService ragService,
        ILogger<ChatHub> logger)
    {
        _db = db;
        _searchService = searchService;
        _ragService = ragService;
        _logger = logger;
    }

    /// <summary>
    /// 流式 AI 问答
    /// </summary>
    public async Task StreamAsk(string question, int? topK = 5, string? sessionId = null)
    {
        if (string.IsNullOrWhiteSpace(question))
        {
            await Clients.Caller.SendAsync("Error", "请输入问题");
            return;
        }

        try
        {
            _logger.LogInformation("用户 {UserId} 提问: {Question}", Context.UserIdentifier, question);

            // 1. 执行向量搜索获取相关文档片段
            _logger.LogInformation("开始搜索: {Question}", question);
            var searchResults = await _searchService.QueryAsync(question, topK ?? 5);
            var results = searchResults.ToList();
            _logger.LogInformation("搜索完成，找到 {Count} 条结果", results.Count);

            if (!results.Any())
            {
                _logger.LogWarning("未找到与问题相关的内容: {Question}", question);
                await Clients.Caller.SendAsync("AnswerChunk", "抱歉，我在知识库中没有找到与您问题相关的内容。");
                await Clients.Caller.SendAsync("AnswerComplete", new { Sources = new List<ChatSource>() });
                return;
            }
            
            // 输出搜索结果详情供调试
            foreach (var result in results)
            {
                _logger.LogDebug("搜索结果: Score={Score}, Text={Text}", result.Score, result.Fragment.Text.Substring(0, Math.Min(100, result.Fragment.Text.Length)));
            }

            // 发送找到的文档数量
            await Clients.Caller.SendAsync("SearchComplete", new 
            { 
                Count = results.Count,
                Sources = results.Select(r => new ChatSource
                {
                    Content = r.Fragment.Text,
                    Score = r.Score,
                    Source = r.Fragment.Metadata != null && r.Fragment.Metadata.ContainsKey("source") ? r.Fragment.Metadata["source"]?.ToString() ?? "未知来源" : "未知来源"
                }).ToList()
            });

            // 2. 检查是否有可用的 LLM 配置
            var hasLLM = await HasAvailableLLMAsync();

            if (!hasLLM)
            {
                // 没有 LLM，直接返回搜索结果
                _logger.LogInformation("没有可用的 LLM 配置，返回搜索结果");

                var sources = results.Select(r => new ChatSource
                {
                    Content = r.Fragment.Text,
                    Score = r.Score,
                    Source = r.Fragment.Metadata != null && r.Fragment.Metadata.ContainsKey("source") ? r.Fragment.Metadata["source"]?.ToString() ?? "未知来源" : "未知来源"
                }).ToList();

                // 构建简单的汇总答案
                var answer = $"我在知识库中找到了 {sources.Count} 条相关内容：\n\n" +
                    string.Join("\n\n", sources.Select((s, i) => $"[{i + 1}] {s.Content}"));

                // 模拟流式输出
                foreach (var chunk in answer.Chunk(20))
                {
                    await Clients.Caller.SendAsync("AnswerChunk", new string(chunk));
                    await Task.Delay(50); // 模拟打字效果
                }

                await Clients.Caller.SendAsync("AnswerComplete", new { Sources = sources });
                return;
            }

            // 3. 有 LLM，使用流式 RAG 流程
            _logger.LogInformation("使用 LLM 进行流式 RAG 问答");

            var sourcesList = results.Select(r => new ChatSource
            {
                Content = r.Fragment.Text,
                Score = r.Score,
                Source = r.Fragment.Metadata != null && r.Fragment.Metadata.ContainsKey("source") ? r.Fragment.Metadata["source"]?.ToString() ?? "未知来源" : "未知来源"
            }).ToList();

            // 调用流式 LLM
            await StreamLLMAnswerAsync(question, sourcesList, Context.ConnectionAborted);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AI 流式问答处理失败");
            await Clients.Caller.SendAsync("Error", "处理问题时出错，请稍后重试");
        }
    }

    /// <summary>
    /// 流式输出 LLM 回答
    /// </summary>
    private async Task StreamLLMAnswerAsync(string question, List<ChatSource> sources, CancellationToken cancellationToken)
    {
        try
        {
            // 构建提示词
            var context = string.Join("\n\n", sources.Select((s, i) => $"[{i + 1}] {s.Content}"));
            var prompt = $"基于以下参考信息回答问题：\n\n" +
                $"参考信息：\n{context}\n\n" +
                $"问题：{question}\n\n" +
                $"请根据参考信息回答问题，如果参考信息不足以回答问题，请明确说明。回答要简洁明了。";

            // 获取 LLM 配置
            var llmConfig = await _db.Q<AISupport>()
                .Where(a => a.IsEnabled)
                .OrderByDescending(a => a.IsPin)
                .ThenBy(a => a.Sort)
                .FirstOrDefaultAsync(cancellationToken);

            if (llmConfig == null)
            {
                await Clients.Caller.SendAsync("Error", "没有可用的 LLM 配置");
                return;
            }

            // 根据提供商调用不同的流式 API
            switch (llmConfig.Provider)
            {
                case AIProviderEnum.OpenAI:
                    await StreamOpenAIAsync(llmConfig, prompt, sources, cancellationToken);
                    break;
                case AIProviderEnum.AzureOpenAI:
                    await StreamAzureOpenAIAsync(llmConfig, prompt, sources, cancellationToken);
                    break;
                default:
                    // 默认使用模拟流式输出
                    await StreamMockAnswerAsync(question, sources, cancellationToken);
                    break;
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("流式回答被取消");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "流式 LLM 调用失败");
            await Clients.Caller.SendAsync("Error", $"LLM 调用失败: {ex.Message}");
        }
    }

    private async Task StreamOpenAIAsync(AISupport config, string prompt, List<ChatSource> sources, CancellationToken cancellationToken)
    {
        // TODO: 实现 OpenAI 流式 API 调用
        // 目前使用模拟数据
        await StreamMockAnswerAsync(prompt, sources, cancellationToken);
    }

    private async Task StreamAzureOpenAIAsync(AISupport config, string prompt, List<ChatSource> sources, CancellationToken cancellationToken)
    {
        // TODO: 实现 Azure OpenAI 流式 API 调用
        // 目前使用模拟数据
        await StreamMockAnswerAsync(prompt, sources, cancellationToken);
    }

    /// <summary>
    /// 模拟流式回答（用于测试或 LLM 未配置时）
    /// </summary>
    private async Task StreamMockAnswerAsync(string question, List<ChatSource> sources, CancellationToken cancellationToken)
    {
        var mockAnswer = $"根据知识库中的 {sources.Count} 条相关内容，我来为您解答：\n\n" +
            "这是一个模拟的流式回答。在实际实现中，这里会调用真实的 LLM API 并流式返回结果。\n\n" +
            "流式输出可以让用户更快地看到部分内容，提升用户体验。";

        // 模拟流式输出
        var words = mockAnswer.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
        foreach (var word in words)
        {
            if (cancellationToken.IsCancellationRequested)
                break;

            await Clients.Caller.SendAsync("AnswerChunk", word + " ");
            await Task.Delay(50, cancellationToken); // 模拟打字效果
        }

        if (!cancellationToken.IsCancellationRequested)
        {
            await Clients.Caller.SendAsync("AnswerComplete", new { Sources = sources });
        }
    }

    /// <summary>
    /// 检查是否有可用的 LLM 配置
    /// </summary>
    private async Task<bool> HasAvailableLLMAsync()
    {
        try
        {
            return await _db.Q<AISupport>().AnyAsync(a => a.IsEnabled);
        }
        catch
        {
            return false;
        }
    }

    public override Task OnConnectedAsync()
    {
        _logger.LogDebug("客户端 {ConnectionId} 连接到 ChatHub", Context.ConnectionId);
        return base.OnConnectedAsync();
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        if (exception != null)
        {
            _logger.LogWarning(exception, "客户端 {ConnectionId} 断开 ChatHub 连接时发生错误", Context.ConnectionId);
        }
        else
        {
            _logger.LogDebug("客户端 {ConnectionId} 断开 ChatHub 连接", Context.ConnectionId);
        }
        return base.OnDisconnectedAsync(exception);
    }
}

/// <summary>
/// 聊天来源
/// </summary>
public class ChatSource
{
    /// <summary>
    /// 内容片段
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// 相似度分数
    /// </summary>
    public float Score { get; set; }

    /// <summary>
    /// 来源文档
    /// </summary>
    public string Source { get; set; } = string.Empty;
}
