using System;
using System.Threading;
using System.Threading.Tasks;

namespace Neuro.RAG.Abstractions;

public interface IRagService
{
    /// <summary>
    /// 问答接口：接受问题与调用 LLM 的回调（用户负责实现具体 LLM 客户端）。
    /// </summary>
    Task<Models.RagResponse> AnswerAsync(string question, Func<string, Task<string>> llmCallback, Models.RagOptions? options = null, CancellationToken cancellationToken = default);
}
