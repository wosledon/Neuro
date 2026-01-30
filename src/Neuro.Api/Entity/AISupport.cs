using Neuro.Abstractions.Entity;
using Neuro.Shared.Enums;

namespace Neuro.Api.Entity;

public class AISupport : EntityBase
{
    public string Name { get; set; } = string.Empty;
    public AIProviderEnum Provider { get; set; } = AIProviderEnum.OpenAI;
    public string ApiKey { get; set; } = string.Empty;

    public string Endpoint { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public bool IsEnabled { get; set; } = true;

    public bool IsPin { get; set; } = false;

    /// <summary>
    /// 模型名称，例如 "gpt-3.5-turbo" 或 "gpt-4"
    /// </summary>
    public string ModelName { get; set; } = "gpt-4";

    /// <summary>
    /// 生成文本的最大长度（以标记为单位）
    /// </summary>
    public int MaxTokens { get; set; } = 2048;
    /// <summary>
    /// 这个值越高，模型的回答越随机。范围通常在0到1之间。
    /// </summary>
    public double Temperature { get; set; } = 0.7;
    /// <summary>
    /// 控制生成文本的多样性。值越低，模型会选择更常见的词语；值越高，模型会选择更多样化的词语。范围通常在0到1之间。
    /// </summary>
    public double TopP { get; set; } = 1.0;

    /// <summary>
    /// 惩罚模型重复使用相同词语的程度。值越高，模型越不倾向于重复相同的词语。范围通常在0到1之间。
    /// </summary>
    public double FrequencyPenalty { get; set; } = 0.0;

    /// <summary>
    /// 惩罚模型引入新话题的程度。值越高，模型越倾向于保持在已有话题范围内。范围通常在0到1之间。
    /// </summary>
    public double PresencePenalty { get; set; } = 0.0;

    /// <summary>
    /// 自定义参数，JSON格式存储其他模型参数
    /// </summary>
    public string CustomParameters { get; set; } = string.Empty;

    public int Sort { get; set; } = 0;
}
