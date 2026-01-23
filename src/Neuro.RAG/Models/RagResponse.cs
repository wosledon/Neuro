using System.Collections.Generic;

namespace Neuro.RAG.Models;

public record RagResponse(string Answer, IEnumerable<DocumentFragment> Sources, string RawLlmResult);
