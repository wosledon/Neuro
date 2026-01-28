using System.Collections.Generic;
using System.Threading.Tasks;
using Neuro.Storage.Models;

namespace Neuro.Storage.Abstractions
{
    /// <summary>
    /// 文件元数据存储接口（用于存储文件的索引与元信息）。
    /// </summary>
    public interface IFileMetadataStore
    {
        Task<FileMetadata> SaveAsync(FileMetadata metadata);
        Task<FileMetadata?> GetByKeyAsync(string key);
        Task<bool> DeleteAsync(string key);
        Task<bool> ExistsByHashAsync(string hash);
        Task<IEnumerable<FileMetadata>> ListAsync(int limit = 100, int offset = 0);
        Task<IEnumerable<FileMetadata>> QueryByTagAsync(string tag);
        Task<IEnumerable<FileMetadata>> QueryByFullTextAsync(string query);
    }
}