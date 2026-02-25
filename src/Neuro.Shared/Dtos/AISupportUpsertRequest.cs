using Neuro.Shared.Enums;

namespace Neuro.Shared.Dtos;

public class AISupportUpsertRequest
{
    public Guid? Id { get; set; }
    public string? Name { get; set; }
    public AIProviderEnum? Provider { get; set; }
    public string? ApiKey { get; set; }
    public string? Endpoint { get; set; }
    public string? Description { get; set; }
    public bool? IsEnabled { get; set; }
    public bool? IsPin { get; set; }
    public string? ModelName { get; set; }
    public int? MaxTokens { get; set; }
    public double? Temperature { get; set; }
    public double? TopP { get; set; }
    public double? FrequencyPenalty { get; set; }
    public double? PresencePenalty { get; set; }
    public string? CustomParameters { get; set; }
    public int? Sort { get; set; }
}
