using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Neuro.Api.Entity;
using DocumentEntity = Neuro.Api.Entity.MyDocument;
using Neuro.EntityFrameworkCore.Services;
using Neuro.RAG.Abstractions;
using Neuro.RAG.Models;
using Neuro.Shared.Dtos;
using Neuro.Shared.Enums;

namespace Neuro.Api.Controllers;

/// <summary>
/// AI 聊天控制器 - 提供基于知识库的问答服务
/// </summary>
[Route("api/[controller]")]
public class ChatController : ApiControllerBase
{
    private readonly IUnitOfWork _db;
    private readonly ISearchService _searchService;
    private readonly IRagService _ragService;
    private readonly ILogger<ChatController> _logger;

    public ChatController(
        IUnitOfWork db,
        ISearchService searchService,
        IRagService ragService,
        ILogger<ChatController> logger)
    {
        _db = db;
        _searchService = searchService;
        _ragService = ragService;
        _logger = logger;
    }

    /// <summary>
    /// AI 问答接口
    /// 如果没有配置 LLM，直接返回 topK 搜索结果
    /// </summary>
    [HttpPost("ask")]
    public async Task<IActionResult> Ask([FromBody] ChatAskRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Question))
            return Failure("请输入问题");

        try
        {
            _logger.LogInformation("用户提问: {Question}", request.Question);

            // 1. 执行向量搜索获取相关文档片段
            var searchResults = await _searchService.QueryAsync(request.Question, request.TopK ?? 5);
            var results = searchResults.ToList();

            if (!results.Any())
            {
                return Success(new ChatResponse
                {
                    Answer = "抱歉，我在知识库中没有找到与您问题相关的内容。",
                    Sources = new List<ChatSource>()
                });
            }

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

                return Success(new ChatResponse
                {
                    Answer = answer,
                    Sources = sources
                });
            }

            // 3. 有 LLM，使用 RAG 流程
            _logger.LogInformation("使用 LLM 进行 RAG 问答");

            var ragResponse = await _ragService.AnswerAsync(
                request.Question,
                async prompt => await CallLLMAsync(prompt),
                new() { TopK = request.TopK ?? 5 }
            );

            var ragSources = ragResponse.Sources?.Select(s => new ChatSource
            {
                Content = s.Text,
                Score = 0,
                Source = s.Metadata != null && s.Metadata.ContainsKey("source") ? s.Metadata["source"]?.ToString() ?? "未知来源" : "未知来源"
            }).ToList() ?? new List<ChatSource>();

            return Success(new ChatResponse
            {
                Answer = ragResponse.Answer,
                Sources = ragSources
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AI 问答处理失败");
            return Failure("处理问题时出错，请稍后重试");
        }
    }

    /// <summary>
    /// 搜索知识库（不经过 LLM）
    /// </summary>
    [HttpPost("search")]
    public async Task<IActionResult> Search([FromBody] ChatSearchRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Query))
            return Failure("请输入搜索内容");

        try
        {
            var results = await _searchService.QueryAsync(request.Query, request.TopK ?? 5);

            var sources = results.Select(r => new ChatSource
            {
                Content = r.Fragment.Text,
                Score = r.Score,
                Source = r.Fragment.Metadata != null && r.Fragment.Metadata.ContainsKey("source") ? r.Fragment.Metadata["source"]?.ToString() ?? "未知来源" : "未知来源"
            }).ToList();

            return Success(new ChatSearchResponse
            {
                Results = sources,
                Total = sources.Count
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "知识库搜索失败");
            return Failure("搜索失败，请稍后重试");
        }
    }

    /// <summary>
    /// 检查是否有可用的 LLM 配置
    /// </summary>
    private async Task<bool> HasAvailableLLMAsync()
    {
        try
        {
            var hasEnabledLLM = await _db.Q<AISupport>()
                .AnyAsync(a => a.IsEnabled);
            return hasEnabledLLM;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// 调用 LLM 服务
    /// </summary>
    private async Task<string> CallLLMAsync(string prompt)
    {
        // 获取启用的 LLM 配置
        var llmConfig = await _db.Q<AISupport>()
            .Where(a => a.IsEnabled)
            .OrderByDescending(a => a.IsPin)
            .ThenBy(a => a.Sort)
            .FirstOrDefaultAsync();

        if (llmConfig == null)
            throw new InvalidOperationException("没有可用的 LLM 配置");

        // 根据提供商调用不同的 API
        return llmConfig.Provider switch
        {
            AIProviderEnum.OpenAI => await CallOpenAIAsync(llmConfig, prompt),
            AIProviderEnum.AzureOpenAI => await CallAzureOpenAIAsync(llmConfig, prompt),
            // AIProviderEnum.Custom => await CallCustomLLMAsync(llmConfig, prompt),
            _ => throw new NotSupportedException($"不支持的 LLM 提供商: {llmConfig.Provider}")
        };
    }

    private async Task<string> CallOpenAIAsync(AISupport config, string prompt)
    {
        // TODO: 实现 OpenAI API 调用
        // 这里使用 HttpClient 调用 OpenAI API
        throw new NotImplementedException("OpenAI API 调用尚未实现");
    }

    private async Task<string> CallAzureOpenAIAsync(AISupport config, string prompt)
    {
        // TODO: 实现 Azure OpenAI API 调用
        throw new NotImplementedException("Azure OpenAI API 调用尚未实现");
    }

    private async Task<string> CallCustomLLMAsync(AISupport config, string prompt)
    {
        // TODO: 实现自定义 LLM API 调用
        throw new NotImplementedException("自定义 LLM API 调用尚未实现");
    }
}

/// <summary>
/// AI 问答请求
/// </summary>
public class ChatAskRequest
{
    /// <summary>
    /// 问题内容
    /// </summary>
    public string Question { get; set; } = string.Empty;

    /// <summary>
    /// 返回的相关文档数量（默认 5）
    /// </summary>
    public int? TopK { get; set; }

    /// <summary>
    /// 会话 ID（用于上下文关联）
    /// </summary>
    public string? SessionId { get; set; }
}

/// <summary>
/// AI 问答响应
/// </summary>
public class ChatResponse
{
    /// <summary>
    /// AI 回答内容
    /// </summary>
    public string Answer { get; set; } = string.Empty;

    /// <summary>
    /// 引用的知识库来源
    /// </summary>
    public List<ChatSource> Sources { get; set; } = new();
}

/// <summary>
/// 知识库来源
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

/// <summary>
/// 知识库搜索请求
/// </summary>
public class ChatSearchRequest
{
    /// <summary>
    /// 搜索查询
    /// </summary>
    public string Query { get; set; } = string.Empty;

    /// <summary>
    /// 返回结果数量（默认 5）
    /// </summary>
    public int? TopK { get; set; }
}

/// <summary>
/// 知识库搜索响应
/// </summary>
public class ChatSearchResponse
{
    /// <summary>
    /// 搜索结果
    /// </summary>
    public List<ChatSource> Results { get; set; } = new();

    /// <summary>
    /// 结果总数
    /// </summary>
    public int Total { get; set; }
}
