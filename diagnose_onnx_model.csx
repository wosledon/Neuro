using System;
using System.Linq;
using Neuro.Vectorizer;
using Neuro.Tokenizer;

// 快速诊断脚本：检查ONNX模型的输入输出

Console.WriteLine("=== ONNX模型诊断 ===\n");

var vectorizerOpts = new VectorizerOptions
{
    ModelPath = "src/Neuro.Vectorizer/models/bert_Opset18.onnx"
};

using var vectorizer = new OnnxVectorizer(vectorizerOpts);

if (!vectorizer.IsModelLoaded)
{
    Console.WriteLine("模型未加载！");
    return;
}

Console.WriteLine($"模型路径: {vectorizer.ModelPath}\n");

// 使用反射获取私有字段_session
var sessionField = typeof(OnnxVectorizer).GetField("_session", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
var session = sessionField?.GetValue(vectorizer) as Microsoft.ML.OnnxRuntime.InferenceSession;

if (session == null)
{
    Console.WriteLine("无法获取InferenceSession");
    return;
}

Console.WriteLine("模型输入:");
foreach (var input in session.InputMetadata)
{
    Console.WriteLine($"  {input.Key}: {input.Value.ElementType}  Dimensions: [{string.Join(", ", input.Value.Dimensions)}]");
}

Console.WriteLine("\n模型输出:");
foreach (var output in session.OutputMetadata)
{
    Console.WriteLine($"  {output.Key}: {output.Value.ElementType}  Dimensions: [{string.Join(", ", output.Value.Dimensions)}]");
}

Console.WriteLine("\n尝试向量化测试文本...");
var tokenizer = new BertTokenizerAdapter(new TokenizerOptions { MaxSequenceLength = 512 });
var testText = "The quick brown fox";
var tokenIds = tokenizer.EncodeToIds(testText);

Console.WriteLine($"Token IDs: [{string.Join(", ", tokenIds.Take(10))}]");

var embedding = await vectorizer.EmbedAsync(tokenIds);
Console.WriteLine($"向量维度: {embedding.Length}");
Console.WriteLine($"向量前10个值: [{string.Join(", ", embedding.Take(10).Select(x => x.ToString("F4")))}]");
