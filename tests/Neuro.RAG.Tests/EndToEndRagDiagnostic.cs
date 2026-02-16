using System;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using Xunit.Abstractions;
using Neuro.Tokenizer;
using Neuro.Vectorizer;
using Neuro.Vector.Stores;

namespace Neuro.RAG.Tests;

public class EndToEndRagDiagnostic
{
    private readonly ITestOutputHelper _output;

    public EndToEndRagDiagnostic(ITestOutputHelper output)
    {
        _output = output;
    }

    [Fact]
    public async Task DiagnoseVectorQuality()
    {
        _output.WriteLine("=== 端到端向量质量诊断 ===\n");

        // 1. 初始化组件 - 使用新的BertWordPieceTokenizer
        var tokenizerOpts = new TokenizerOptions { MaxSequenceLength = 128 };
        var tokenizer = new BertWordPieceTokenizer(tokenizerOpts);

        var vectorizerOpts = new VectorizerOptions
        {
            ModelPath = "src/Neuro.Vectorizer/models/bert_Opset18.onnx"
        };
        var vectorizer = new OnnxVectorizer(vectorizerOpts);

        _output.WriteLine($"模型已加载: {vectorizer.IsModelLoaded}");
        _output.WriteLine($"模型路径: {vectorizer.ModelPath}");
        _output.WriteLine($"分词器词汇量: {tokenizer.VocabSize}");
        _output.WriteLine($"完整词汇表: {tokenizer.HasFullVocab}");

        if (!vectorizer.IsModelLoaded)
        {
            _output.WriteLine("✗ 模型未加载！");
            vectorizer.Dispose();
            return;
        }

        // 诊断：检查模型输入输出
        var sessionField = typeof(OnnxVectorizer).GetField("_session", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
        var session = sessionField?.GetValue(vectorizer) as Microsoft.ML.OnnxRuntime.InferenceSession;

        if (session != null)
        {
            _output.WriteLine("\n模型输入:");
            foreach (var input in session.InputMetadata)
            {
                _output.WriteLine($"  {input.Key}: {input.Value.ElementType}  形状: [{string.Join(", ", input.Value.Dimensions)}]");
            }

            _output.WriteLine("\n模型输出:");
            foreach (var output in session.OutputMetadata)
            {
                _output.WriteLine($"  {output.Key}: {output.Value.ElementType}  形状: [{string.Join(", ", output.Value.Dimensions)}]");
            }
            _output.WriteLine("");
        }

        // 2. 测试相同文本的向量相似度（应该接近1.0）
        _output.WriteLine("测试1: 相同文本的向量相似度");
        var text1 = "The quick brown fox jumps over the lazy dog";
        var tokens1a = tokenizer.EncodeToIds(text1);
        var tokens1b = tokenizer.EncodeToIds(text1);

        _output.WriteLine($"  文本: \"{text1}\"");
        _output.WriteLine($"  Token数量: {tokens1a.Length}");
        _output.WriteLine($"  前10个Token IDs: [{string.Join(", ", tokens1a.Take(10))}]");

        var emb1a = await vectorizer.EmbedAsync(tokens1a);
        var emb1b = await vectorizer.EmbedAsync(tokens1b);

        var selfSim = CosineSimilarity(emb1a, emb1b);
        _output.WriteLine($"  向量维度: {emb1a.Length}");
        _output.WriteLine($"  自身相似度: {selfSim:F6} (期望≈1.0)");

        if (selfSim < 0.99)
        {
            _output.WriteLine($"  ⚠ 警告: 相同文本的相似度过低！\n");
        }
        else
        {
            _output.WriteLine($"  ✓ 相同文本向量一致\n");
        }

        // 3. 测试相似文本的向量相似度（应该比较高）
        _output.WriteLine("测试2: 相似文本的向量相似度");
        var text2a = "The cat sleeps on the sofa";
        var text2b = "A cat is sleeping on the couch";
        var text2c = "Python is a programming language";

        var tokens2a = tokenizer.EncodeToIds(text2a);
        var tokens2b = tokenizer.EncodeToIds(text2b);
        var tokens2c = tokenizer.EncodeToIds(text2c);

        var emb2a = await vectorizer.EmbedAsync(tokens2a);
        var emb2b = await vectorizer.EmbedAsync(tokens2b);
        var emb2c = await vectorizer.EmbedAsync(tokens2c);

        var simAB = CosineSimilarity(emb2a, emb2b);
        var simAC = CosineSimilarity(emb2a, emb2c);

        _output.WriteLine($"  文本A: \"{text2a}\"");
        _output.WriteLine($"  文本B: \"{text2b}\"");
        _output.WriteLine($"  文本C: \"{text2c}\"");
        _output.WriteLine($"  A-B相似度: {simAB:F4} (期望>0.5，语义相似)");
        _output.WriteLine($"  A-C相似度: {simAC:F4} (期望<0.3，语义不同)");

        if (simAB <= 0.5)
        {
            _output.WriteLine($"  ⚠ 警告: 相似文本的相似度过低！");
            _output.WriteLine($"  这表明tokenizer或向量化存在问题\n");
        }
        else if (simAC >= simAB)
        {
            _output.WriteLine($"  ⚠ 警告: 不相关文本的相似度比相关文本还高！");
            _output.WriteLine($"  向量化质量有严重问题\n");
        }
        else
        {
            _output.WriteLine($"  ✓ 向量能区分相似和不相关文本\n");
        }

        // 4. 测试关键词匹配（精确词汇匹配）
        _output.WriteLine("测试3: 关键词精确匹配");
        var query = "fox";
        var doc1 = "The quick brown fox jumps over the lazy dog";
        var doc2 = "Dogs are loyal pets and love to play";

        var qTokens = tokenizer.EncodeToIds(query);
        var d1Tokens = tokenizer.EncodeToIds(doc1);
        var d2Tokens = tokenizer.EncodeToIds(doc2);

        var qEmb = await vectorizer.EmbedAsync(qTokens);
        var d1Emb = await vectorizer.EmbedAsync(d1Tokens);
        var d2Emb = await vectorizer.EmbedAsync(d2Tokens);

        var simQ1 = CosineSimilarity(qEmb, d1Emb);
        var simQ2 = CosineSimilarity(qEmb, d2Emb);

        _output.WriteLine($"  查询: \"{query}\"");
        _output.WriteLine($"  文档1: \"{doc1}\" (包含fox)");
        _output.WriteLine($"  文档2: \"{doc2}\" (不包含fox)");
        _output.WriteLine($"  查询-文档1: {simQ1:F4}");
        _output.WriteLine($"  查询-文档2: {simQ2:F4}");

        if (simQ1 <= simQ2)
        {
            _output.WriteLine($"  注意: 单词级别查询偏差 (基础BERT的已知限制)");
        }
        else
        {
            _output.WriteLine($"  ✓ 关键词匹配正常\n");
        }

        // 4b. 测试句子级查询（更贴近真实RAG使用场景）
        _output.WriteLine("\n测试3b: 句子级查询（真实RAG场景）");
        var sentenceQuery = "What animal jumps over the dog?";
        var sqTokens = tokenizer.EncodeToIds(sentenceQuery);
        var sqEmb = await vectorizer.EmbedAsync(sqTokens);
        var sqSim1 = CosineSimilarity(sqEmb, d1Emb);
        var sqSim2 = CosineSimilarity(sqEmb, d2Emb);

        _output.WriteLine($"  查询: \"{sentenceQuery}\"");
        _output.WriteLine($"  文档1: \"{doc1}\" (相关)");
        _output.WriteLine($"  文档2: \"{doc2}\" (不相关)");
        _output.WriteLine($"  查询-文档1: {sqSim1:F4}");
        _output.WriteLine($"  查询-文档2: {sqSim2:F4}");

        if (sqSim1 > sqSim2)
        {
            _output.WriteLine($"  ✓ 句子级查询匹配正确\n");
        }
        else
        {
            _output.WriteLine($"  ✗ 句子级查询匹配失败\n");
        }

        Assert.True(simAB > simAC, "Similar sentences should be closer than unrelated ones");
        Assert.True(sqSim1 > sqSim2, "Sentence-level query should match relevant document");

        // 5. 检查向量本身的统计特性
        _output.WriteLine("测试4: 向量统计特性");
        var sampleText = "This is a test document";
        var sampleTokens = tokenizer.EncodeToIds(sampleText);
        var sampleEmb = await vectorizer.EmbedAsync(sampleTokens);

        var mean = sampleEmb.Average();
        var variance = sampleEmb.Select(x => (x - mean) * (x - mean)).Average();
        var std = Math.Sqrt(variance);
        var norm = Math.Sqrt(sampleEmb.Sum(x => x * x));
        var min = sampleEmb.Min();
        var max = sampleEmb.Max();
        var zerosCount = sampleEmb.Count(x => Math.Abs(x) < 1e-6);
        var uniqueCount = sampleEmb.Distinct().Count();

        _output.WriteLine($"  向量维度: {sampleEmb.Length}");
        _output.WriteLine($"  均值: {mean:F6}");
        _output.WriteLine($"  标准差: {std:F6}");
        _output.WriteLine($"  范数(L2): {norm:F4}");
        _output.WriteLine($"  范围: [{min:F4}, {max:F4}]");
        _output.WriteLine($"  零值数量: {zerosCount}/{sampleEmb.Length}");
        _output.WriteLine($"  唯一值数量: {uniqueCount}/{sampleEmb.Length}");

        if (zerosCount > sampleEmb.Length * 0.9)
        {
            _output.WriteLine($"  ✗ 向量几乎全是零！");
        }
        else if (uniqueCount < 10)
        {
            _output.WriteLine($"  ⚠ 向量唯一值过少，可能有问题");
        }
        else if (std < 0.01)
        {
            _output.WriteLine($"  ⚠ 向量标准差过小，几乎没有变化");
        }
        else
        {
            _output.WriteLine($"  ✓ 向量统计特性正常");
        }

        vectorizer.Dispose();
        _output.WriteLine($"\n=== 诊断完成 ===");
    }

    private static float CosineSimilarity(float[] a, float[] b)
    {
        if (a == null || b == null || a.Length != b.Length) return -1f;
        double dot = 0, na = 0, nb = 0;
        for (int i = 0; i < a.Length; i++)
        {
            dot += (double)a[i] * b[i];
            na += (double)a[i] * a[i];
            nb += (double)b[i] * b[i];
        }
        if (na == 0 || nb == 0) return -1f;
        return (float)(dot / (Math.Sqrt(na) * Math.Sqrt(nb)));
    }
}
