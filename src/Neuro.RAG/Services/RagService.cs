using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Neuro.RAG.Abstractions;
using Neuro.RAG.Models;

namespace Neuro.RAG.Services;

public class RagService : IRagService
{
    private readonly ISearchService _search;

    public RagService(ISearchService search)
    {
        _search = search ?? throw new ArgumentNullException(nameof(search));
    }

    public async Task<RagResponse> AnswerAsync(string question, Func<string, Task<string>> llmCallback, RagOptions? options = null, CancellationToken cancellationToken = default)
    {
        options ??= new RagOptions();
        var hits = (await _search.QueryAsync(question, options.TopK, cancellationToken)).ToArray();
        var context = string.Join("\n---\n", hits.Select(h => h.Fragment.Text));
        var prompt = options.PromptTemplate ?? "Use the following context to answer the question:\n{context}\nQuestion: {question}";
        prompt = prompt.Replace("{context}", context).Replace("{question}", question);
        var llmResult = await llmCallback(prompt);
        return new RagResponse(llmResult, hits.Select(h => h.Fragment), llmResult);
    }
}
