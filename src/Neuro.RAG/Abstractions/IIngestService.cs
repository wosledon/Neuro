using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Neuro.RAG.Abstractions;

public interface IIngestService
{
    Task<IEnumerable<string>> IndexFileAsync(string filePath, CancellationToken cancellationToken = default);
    Task<IEnumerable<string>> IndexTextAsync(string text, string? id = null, CancellationToken cancellationToken = default);
}
