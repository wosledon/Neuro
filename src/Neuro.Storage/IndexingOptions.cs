namespace Neuro.Storage
{
    public class IndexingOptions
    {
        /// <summary>
        /// Maximum content bytes to index. Default 64KB.
        /// </summary>
        public int MaxContentBytes { get; set; } = 64 * 1024;

        /// <summary>
        /// Channel capacity.
        /// </summary>
        public int ChannelCapacity { get; set; } = 1000;

        /// <summary>
        /// Number of retry attempts for indexing (background worker).
        /// </summary>
        public int RetryCount { get; set; } = 3;

        /// <summary>
        /// Base retry delay in milliseconds.
        /// </summary>
        public int RetryDelayMs { get; set; } = 200;
    }
}