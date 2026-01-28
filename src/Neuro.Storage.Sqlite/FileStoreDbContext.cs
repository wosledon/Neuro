using Microsoft.EntityFrameworkCore;
using Neuro.Storage.Sqlite.Entities;

namespace Neuro.Storage.Sqlite
{
    public class FileStoreDbContext : DbContext
    {
        public DbSet<FileMetadataEntity> FileMetadatas { get; set; } = null!;

        public FileStoreDbContext(DbContextOptions<FileStoreDbContext> options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<FileMetadataEntity>()
                .HasIndex(f => f.Hash);

            modelBuilder.Entity<FileMetadataEntity>()
                .HasIndex(f => f.Key)
                .IsUnique();

            base.OnModelCreating(modelBuilder);
        }
    }
}