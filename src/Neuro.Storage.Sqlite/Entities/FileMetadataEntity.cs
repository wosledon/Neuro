using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Neuro.Storage.Sqlite.Entities
{
    [Table("FileMetadatas")]
    public class FileMetadataEntity
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string Key { get; set; } = null!;

        [Required]
        public string FileName { get; set; } = null!;

        public string Path { get; set; } = null!;
        public long Size { get; set; }
        public string? MimeType { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string? Hash { get; set; }
        public string? TagsJson { get; set; }
        public string? ContentText { get; set; }
        public DateTime? AccessedAt { get; set; }
    }
}