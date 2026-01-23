namespace Neuro.RAG.Models;

public class RagOptions
{
    public int TopK { get; set; } = 4;
    public string? PromptTemplate { get; set; }
}
