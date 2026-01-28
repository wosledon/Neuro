using System.Threading.Channels;
using System.Threading.Tasks;

namespace Neuro.Storage
{
    public interface IFileIndexingQueue
    {
        /// <summary>
        /// Enqueue a file content for indexing. Content may be null.
        /// </summary>
        ValueTask EnqueueAsync(string key, string? content);

        /// <summary>
        /// Exposes the reader for the background consumer.
        /// </summary>
        ChannelReader<(string key, string? content)> Reader { get; }
    }
}