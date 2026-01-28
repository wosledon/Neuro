using System;

namespace Neuro.Storage.Models
{
    /// <summary>
    /// 文件元数据模型。
    /// </summary>
    public class FileMetadata
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Key { get; set; } = null!;
        public string FileName { get; set; } = null!;
        public string Path { get; set; } = null!;
        public long Size { get; set; }
        public string? MimeType { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public string? Hash { get; set; }
        public string? TagsJson { get; set; }
        /// <summary>
        /// 可选的文本内容预览，用于全文索引。
        /// </summary>
        public string? ContentText { get; set; }
        /// <summary>
        /// 上次访问时间（UTC）。
        /// </summary>
        public DateTime? AccessedAt { get; set; }
    }
}