using Microsoft.ML.OnnxRuntime;
using Microsoft.ML.OnnxRuntime.Tensors;

var modelPath = @"c:\Users\Administrator\repos\Neuro\src\Neuro.Vectorizer\models\bert_Opset18.onnx";

Console.WriteLine($"Model path: {modelPath}");
Console.WriteLine($"Exists: {File.Exists(modelPath)}");

if (!File.Exists(modelPath))
{
    Console.WriteLine("Model file not found!");
    return;
}

using var session = new InferenceSession(modelPath);

Console.WriteLine("\n=== Model Inputs ===");
foreach (var input in session.InputMetadata)
{
    Console.WriteLine($"  {input.Key}: {input.Value.ElementType}  Dims: [{string.Join(", ", input.Value.Dimensions)}]");
}

Console.WriteLine("\n=== Model Outputs ===");
foreach (var output in session.OutputMetadata)
{
    Console.WriteLine($"  {output.Key}: {output.Value.ElementType}  Dims: [{string.Join(", ", output.Value.Dimensions)}]");
}

Console.WriteLine("\n=== Model Metadata ===");
foreach (var meta in session.ModelMetadata.CustomMetadataMap)
    Console.WriteLine($"  {meta.Key}: {meta.Value}");
Console.WriteLine($"  Producer: {session.ModelMetadata.ProducerName}");

// Helper to create proper typed input
List<NamedOnnxValue> CreateInputs(long tokenId)
{
    var inputs = new List<NamedOnnxValue>();
    foreach (var input in session.InputMetadata)
    {
        var dims = input.Value.Dimensions;
        var batchSize = dims[0] > 0 ? dims[0] : 1;
        var seqLen = dims.Length >= 2 && dims[1] > 0 ? dims[1] : 128;
        var name = input.Key;
        var elType = input.Value.ElementType;

        if (name.ToLower().Contains("input_ids") || name == session.InputMetadata.First().Key)
        {
            if (elType == typeof(long))
            {
                var t = new DenseTensor<long>(new[] { batchSize, seqLen });
                t[0, 0] = tokenId;
                inputs.Add(NamedOnnxValue.CreateFromTensor(name, t));
            }
            else if (elType == typeof(int))
            {
                var t = new DenseTensor<int>(new[] { batchSize, seqLen });
                t[0, 0] = (int)tokenId;
                inputs.Add(NamedOnnxValue.CreateFromTensor(name, t));
            }
        }
        else if (name.ToLower().Contains("attention_mask"))
        {
            if (elType == typeof(float))
            {
                var t = new DenseTensor<float>(new[] { batchSize, seqLen });
                t[0, 0] = 1.0f;
                inputs.Add(NamedOnnxValue.CreateFromTensor(name, t));
            }
            else if (elType == typeof(long))
            {
                var t = new DenseTensor<long>(new[] { batchSize, seqLen });
                t[0, 0] = 1L;
                inputs.Add(NamedOnnxValue.CreateFromTensor(name, t));
            }
            else if (elType == typeof(int))
            {
                var t = new DenseTensor<int>(new[] { batchSize, seqLen });
                t[0, 0] = 1;
                inputs.Add(NamedOnnxValue.CreateFromTensor(name, t));
            }
        }
        else if (name.ToLower().Contains("token_type"))
        {
            if (elType == typeof(long))
            {
                var t = new DenseTensor<long>(new[] { batchSize, seqLen });
                inputs.Add(NamedOnnxValue.CreateFromTensor(name, t));
            }
            else if (elType == typeof(int))
            {
                var t = new DenseTensor<int>(new[] { batchSize, seqLen });
                inputs.Add(NamedOnnxValue.CreateFromTensor(name, t));
            }
            else if (elType == typeof(float))
            {
                var t = new DenseTensor<float>(new[] { batchSize, seqLen });
                inputs.Add(NamedOnnxValue.CreateFromTensor(name, t));
            }
        }
    }
    return inputs;
}

// Test basic inference
Console.WriteLine("\n=== Basic Inference Test ===");
try
{
    var inputs = CreateInputs(101); // [CLS]
    using var results = session.Run(inputs);
    foreach (var result in results)
    {
        var t = result.AsTensor<float>();
        var dims = t.Dimensions.ToArray();
        Console.WriteLine($"  Output '{result.Name}': dims=[{string.Join(",", dims)}]");
        if (dims.Length == 2)
            Console.WriteLine($"    POOLED output: hidden_dim={dims[1]} => {(dims[1] == 768 ? "bert-base" : dims[1] == 384 ? "MiniLM/small" : "unknown")}");
        else if (dims.Length == 3)
            Console.WriteLine($"    SEQUENCE output: seq_len={dims[1]}, hidden_dim={dims[2]}");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"  Basic test failed: {ex.Message}");
}

// Test vocabulary boundaries
Console.WriteLine("\n=== Finding Vocabulary Size ===");
Console.WriteLine("Testing various token IDs to find where the model crashes...");

var tokenIdsToTest = new long[]
{
    0, 100, 101, 102, 103, 999, 1000, 1996, 5000, 10000,
    20000, 21127, 21128, 28995, 28996, 30000, 30521, 30522,
    30523, 50000, 100000, 105878, 105879, 119546, 119547
};

foreach (var tokenId in tokenIdsToTest)
{
    try
    {
        var inputs = CreateInputs(tokenId);
        using var results = session.Run(inputs);
        // Get pooled output and check for NaN/Inf
        var output = results.First();
        var tensor = output.AsTensor<float>();
        var firstVal = tensor[0, 0];
        var isNanOrInf = float.IsNaN(firstVal) || float.IsInfinity(firstVal);
        Console.WriteLine($"  Token {tokenId,7}: OK  first_val={firstVal:F6} {(isNanOrInf ? "NaN/Inf!" : "")}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"  Token {tokenId,7}: FAIL - {ex.Message[..Math.Min(80, ex.Message.Length)]}");
    }
}

// Binary search for exact vocab boundary
Console.WriteLine("\n=== Binary Search for Vocab Boundary ===");
long lo = 30000, hi = 200000;
bool TestToken(long id)
{
    try
    {
        var inputs = CreateInputs(id);
        using var results = session.Run(inputs);
        return true;
    }
    catch
    {
        return false;
    }
}

// First check if 200000 fails
if (TestToken(hi))
{
    Console.WriteLine($"  Even token {hi} works - model may accept any input (Gather op may not throw)");
    // In this case, check by looking at whether output is meaningful or garbage
    // Compare embeddings of different high tokens - if they're all the same, it's out of vocab

    Console.WriteLine("\n=== Checking if high tokens produce distinct embeddings ===");
    float[] GetPooledEmbedding(long tokenId)
    {
        var inputs = CreateInputs(tokenId);
        using var results = session.Run(inputs);
        foreach (var result in results)
        {
            var t = result.AsTensor<float>();
            if (t.Dimensions.Length == 2)
            {
                var emb = new float[t.Dimensions[1]];
                for (int i = 0; i < emb.Length; i++) emb[i] = t[0, i];
                return emb;
            }
        }
        return Array.Empty<float>();
    }

    var emb0 = GetPooledEmbedding(0);
    var emb100 = GetPooledEmbedding(100); // [UNK]
    var emb101 = GetPooledEmbedding(101); // [CLS]
    var emb1996 = GetPooledEmbedding(1996); // "the" in bert-base-uncased
    var emb30521 = GetPooledEmbedding(30521); // last token if vocab=30522
    var emb30522 = GetPooledEmbedding(30522); // out of vocab if vocab=30522
    var emb50000 = GetPooledEmbedding(50000);
    var emb100000 = GetPooledEmbedding(100000);

    float Cosine(float[] a, float[] b)
    {
        if (a.Length == 0 || b.Length == 0 || a.Length != b.Length) return -1;
        double dot = 0, na = 0, nb = 0;
        for (int i = 0; i < a.Length; i++)
        {
            dot += a[i] * b[i];
            na += a[i] * a[i];
            nb += b[i] * b[i];
        }
        if (na == 0 || nb == 0) return -1;
        return (float)(dot / (Math.Sqrt(na) * Math.Sqrt(nb)));
    }

    Console.WriteLine($"  Embedding dim: {emb0.Length}");
    Console.WriteLine($"  cos(0, 100): {Cosine(emb0, emb100):F6}");
    Console.WriteLine($"  cos(0, 101): {Cosine(emb0, emb101):F6}");
    Console.WriteLine($"  cos(0, 1996): {Cosine(emb0, emb1996):F6}");
    Console.WriteLine($"  cos(0, 30521): {Cosine(emb0, emb30521):F6}");
    Console.WriteLine($"  cos(0, 30522): {Cosine(emb0, emb30522):F6}");
    Console.WriteLine($"  cos(30521, 30522): {Cosine(emb30521, emb30522):F6}");
    Console.WriteLine($"  cos(30522, 50000): {Cosine(emb30522, emb50000):F6}");
    Console.WriteLine($"  cos(50000, 100000): {Cosine(emb50000, emb100000):F6}");
    Console.WriteLine($"  cos(101, 1996): {Cosine(emb101, emb1996):F6}");

    // If tokens beyond vocab boundary all produce same embedding (cos~1.0), that's the boundary
    if (Cosine(emb30522, emb50000) > 0.999 && Cosine(emb50000, emb100000) > 0.999)
    {
        Console.WriteLine("\n  => Tokens 30522+ all produce same embedding => vocab_size = 30522 (bert-base-uncased)");
    }
    else if (Cosine(emb30522, emb50000) < 0.99)
    {
        Console.WriteLine("\n  => Tokens beyond 30522 still produce distinct embeddings, vocab may be larger");
    }
}
else
{
    while (hi - lo > 1)
    {
        var mid = (lo + hi) / 2;
        if (TestToken(mid)) lo = mid;
        else hi = mid;
    }
    Console.WriteLine($"  Vocab boundary: last valid={lo}, first invalid={hi}");
    Console.WriteLine($"  => vocab_size = {hi}");
}

Console.WriteLine("\nDone!");
