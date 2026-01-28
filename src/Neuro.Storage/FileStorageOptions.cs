using Microsoft.Extensions.Options;
using Neuro.Storage.Enums;

namespace Neuro.Storage.Options;

public class FileStorageOptions : IOptions<FileStorageOptions>
{
    /// <summary>
    /// 存储类型
    /// </summary>
    public StorageProviderEnum Provider { get; set; } = StorageProviderEnum.Local;

    /// <summary>
    /// 本地存储路径
    /// </summary>
    public string PathBase { get; set; } = "Storage";

    /// <summary>
    /// 其他配置项
    /// </summary>
    public Dictionary<string, string> Settings { get; set; } = new();

    public FileStorageOptions Value => this;
}
