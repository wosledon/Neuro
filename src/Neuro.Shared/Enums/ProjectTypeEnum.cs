using System;
using System.ComponentModel;

namespace Neuro.Shared.Enums;

public enum ProjectTypeEnum
{
    [Description("文档")]
    Document = 0,
    [Description("Github")]
    Github = 1,
    [Description("Gitlab")]
    Gitlab = 2,
    [Description("Gitee")]
    Gitee = 3,
    [Description("Gitea")]
    Gitea = 4,
    [Description("其他")]
    Other = 99
}

public enum AIProviderEnum
{
    [Description("OpenAI")]
    OpenAI = 0,
    [Description("Azure OpenAI")]
    AzureOpenAI = 1,
    [Description("Hugging Face")]
    HuggingFace = 2,
    [Description("OpenAI Embedding")]
    OpenAIEmbedding = 10,
    [Description("Azure OpenAI Embedding")]
    AzureOpenAIEmbedding = 11,
    [Description("Hugging Face Embedding")]
    HuggingFaceEmbedding = 12,
    [Description("Sentence Transformers")]
    SentenceTransformers = 13,
    [Description("Cohere Embedding")]
    Cohere = 14,
    [Description("本地模型 Embedding")]
    LocalModelEmbedding = 15,
}

/// <summary>
/// 凭据类型：密码、SSH 密钥或个人访问令牌
/// </summary>
public enum GitCredentialTypeEnum
{
    Password = 0,
    SshKey = 1,
    PersonalAccessToken = 2
}

/// <summary>
/// 项目状态：进行中、暂停、已归档
/// </summary>
public enum ProjectStatusEnum
{
    [Description("进行中")]
    Active = 0,
    [Description("暂停")]
    Inactive = 1,
    [Description("已归档")]
    Archived = 2
}