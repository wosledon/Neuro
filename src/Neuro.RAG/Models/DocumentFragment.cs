using System.Collections.Generic;

namespace Neuro.RAG.Models;

public record DocumentFragment(string Id, string Text, IDictionary<string, object?>? Metadata = null, string? Source = null, int ChunkIndex = 0);
