using Neuro.Storage.Enums;

namespace Neuro.Storage.Abstractions;

/// <summary>
/// 文件存储接口
/// </summary>
public interface IFileStorage
{
    Task<Stream> GetAsync(string key);
    /// <summary>
    /// 保存文件
    /// </summary>
    /// <param name="content"></param>
    /// <param name="storageType"></param>
    /// <returns>Key of the saved file</returns>
    Task<string> SaveAsync(Stream content, string? fileName = null, StorageTypeEnum storageType = StorageTypeEnum.Temporary);
    Task<bool> DeleteAsync(string key);
    Task<bool> ExistsAsync(string key);
    Task<IEnumerable<string>> ListAsync(string directoryKey);
    Task<string> MoveAsync(string sourceKey);
    Task<string> CopyAsync(string sourceKey);
    Task<long> GetFileSizeAsync(string key);
    Task<string> HashFileAsync(string key);
}
