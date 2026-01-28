using System.Threading.Tasks;

namespace Neuro.Storage
{
    public interface IFileContentIndexer
    {
        Task IndexContentAsync(string key, string? content);
    }
}