using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Neuro.RAG.Abstractions;

public interface ISearchService
{
    Task<IEnumerable<Models.SearchResult>> QueryAsync(string query, int topK = 5, CancellationToken cancellationToken = default);
}
