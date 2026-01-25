using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace Neuro.Vectorizer.Tests;

public class VectorizerTests
{
    [Fact]
    public async Task Embed_Returns_NonEmpty_WhenModelPresent()
    {
        // Try to locate model file in common places
        string modelPath = LocateModel();
        if (modelPath == null)
        {
            // Skip test if model missing
            return;
        }

        var opts = new VectorizerOptions { ModelPath = modelPath };
        var vec = new OnnxVectorizer(opts);

        var emb = await vec.EmbedAsync(new int[] { 101, 2003, 102 });

        Assert.NotNull(emb);
        Assert.True(emb.Length > 0);
    }

    private static string LocateModel()
    {
        // 1. local relative
        var candidates = new[] {
            Path.Combine(Directory.GetCurrentDirectory(), "models", "bert_Opset18.onnx"),
            Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "src", "Neuro.Vectorizer", "models", "bert_Opset18.onnx"),
            Path.Combine(AppContext.BaseDirectory!, "models", "bert_Opset18.onnx"),
            Path.Combine(AppContext.BaseDirectory!, "..", "..", "..", "src", "Neuro.Vectorizer", "models", "bert_Opset18.onnx")
        };

        foreach (var c in candidates)
        {
            var p = Path.GetFullPath(c);
            if (File.Exists(p)) return p;
        }

        return null;
    }
}
