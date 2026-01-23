namespace Neuro.RAG.Models;

public record SearchResult(DocumentFragment Fragment, float Score, float[]? Embedding = null);
