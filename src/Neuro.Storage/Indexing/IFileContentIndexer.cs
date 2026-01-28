using System.Threading.Tasks;

namespace Neuro.Storage.Indexing
{
    public interface IFileContentIndexer
    {
        Task IndexContentAsync(string key, string? content);
    }
}