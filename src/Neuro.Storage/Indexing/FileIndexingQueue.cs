using System;
using System.Threading.Channels;
using System.Threading.Tasks;

namespace Neuro.Storage.Indexing
{
    public class FileIndexingQueue : IFileIndexingQueue, IDisposable
    {
        private readonly Channel<(string key, string? content)> _channel;

        public FileIndexingQueue(int capacity = 1000)
        {
            var options = new BoundedChannelOptions(capacity)
            {
                SingleReader = true,
                SingleWriter = false,
                FullMode = BoundedChannelFullMode.DropOldest
            };

            _channel = Channel.CreateBounded<(string, string?)>(options);
        }

        public ValueTask EnqueueAsync(string key, string? content)
        {
            // non-blocking; if full, DropOldest (configured)
            return _channel.Writer.WriteAsync((key, content));
        }

        public ChannelReader<(string key, string? content)> Reader => _channel.Reader;

        public void Dispose()
        {
            _channel.Writer.Complete();
        }
    }
}