using Neuro.Shared.Enums;

namespace Neuro.Shared.Dtos;

public class AISupportDetail
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public AIProviderEnum Provider { get; set; }
    public string ApiKey { get; set; } = string.Empty;
    public string Endpoint { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
    public bool IsPin { get; set; }
    public string ModelName { get; set; } = string.Empty;
    public int MaxTokens { get; set; }
    public double Temperature { get; set; }
    public double TopP { get; set; }
    public double FrequencyPenalty { get; set; }
    public double PresencePenalty { get; set; }
    public string CustomParameters { get; set; } = string.Empty;
    public int Sort { get; set; }
}
