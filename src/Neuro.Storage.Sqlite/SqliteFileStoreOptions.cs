namespace Neuro.Storage.Sqlite
{
    public class SqliteFileStoreOptions
    {
        public string ConnectionString { get; set; } = "Data Source=filestore.db;Cache=Shared;Mode=ReadWriteCreate;Pooling=True;";
    }
}