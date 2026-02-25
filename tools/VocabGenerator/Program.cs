// VocabGenerator - Downloads the official bert-base-uncased vocab.txt (30522 tokens)
// from Hugging Face and writes it to the Neuro.Vectorizer models directory.
//
// The bert-base-uncased vocabulary is a well-known, standardized, public file.
// Every copy of bert-base-uncased uses the exact same 30522-token vocabulary.
//
// Usage:
//   dotnet run
//     -> Downloads vocab.txt and saves to the default output path
//   dotnet run -- --stdout
//     -> Writes all 30522 lines to stdout (can be redirected to a file)
//   dotnet run -- --output <path>
//     -> Writes vocab.txt to the specified path

using System.Security.Cryptography;

const int ExpectedVocabSize = 30522;

// Hugging Face URLs for bert-base-uncased vocab.txt (multiple mirrors for reliability)
string[] vocabUrls =
[
    "https://huggingface.co/google-bert/bert-base-uncased/resolve/main/vocab.txt",
    "https://huggingface.co/bert-base-uncased/resolve/main/vocab.txt",
];

// Default output path
var directOutputPath = Path.Combine(
    AppContext.BaseDirectory, "..", "..", "..", "..", "..", "src", "Neuro.Vectorizer", "models", "vocab.txt");

// Also try a more direct path relative to the repo root
var repoOutputPath = @"c:\Users\Administrator\repos\Neuro\src\Neuro.Vectorizer\models\vocab.txt";

// Parse arguments
bool writeToStdout = false;
string? outputPath = null;

for (int i = 0; i < args.Length; i++)
{
    if (args[i] == "--stdout")
    {
        writeToStdout = true;
    }
    else if (args[i] == "--output" && i + 1 < args.Length)
    {
        outputPath = args[++i];
    }
}

if (!writeToStdout && outputPath == null)
{
    // Use the repo path if the directory exists, otherwise use the computed path
    if (Directory.Exists(Path.GetDirectoryName(repoOutputPath)))
        outputPath = repoOutputPath;
    else
        outputPath = Path.GetFullPath(directOutputPath);
}

Console.Error.WriteLine("=== VocabGenerator: bert-base-uncased vocab.txt ===");
Console.Error.WriteLine();

string[]? vocabLines = null;

// Step 1: Try to download from Hugging Face
using var httpClient = new HttpClient();
httpClient.Timeout = TimeSpan.FromSeconds(60);
httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("VocabGenerator/1.0");

foreach (var url in vocabUrls)
{
    try
    {
        Console.Error.WriteLine($"Downloading from: {url}");
        var content = await httpClient.GetStringAsync(url);

        // Split into lines (handle both \n and \r\n)
        vocabLines = content.Split('\n', StringSplitOptions.None);

        // Remove trailing empty line if present (common with text files)
        if (vocabLines.Length > 0 && string.IsNullOrEmpty(vocabLines[^1]))
        {
            vocabLines = vocabLines[..^1];
        }

        // Trim any \r from line endings
        for (int i = 0; i < vocabLines.Length; i++)
        {
            vocabLines[i] = vocabLines[i].TrimEnd('\r');
        }

        Console.Error.WriteLine($"Downloaded {vocabLines.Length} lines.");

        if (vocabLines.Length == ExpectedVocabSize)
        {
            Console.Error.WriteLine($"Line count matches expected: {ExpectedVocabSize}");
            break;
        }
        else
        {
            Console.Error.WriteLine($"WARNING: Expected {ExpectedVocabSize} lines but got {vocabLines.Length}. Trying next URL...");
            vocabLines = null;
        }
    }
    catch (Exception ex)
    {
        Console.Error.WriteLine($"Failed to download from {url}: {ex.Message}");
        vocabLines = null;
    }
}

if (vocabLines == null || vocabLines.Length != ExpectedVocabSize)
{
    Console.Error.WriteLine();
    Console.Error.WriteLine("ERROR: Could not download the vocabulary from any source.");
    Console.Error.WriteLine("Please check your internet connection and try again.");
    Console.Error.WriteLine();
    Console.Error.WriteLine("Alternatively, you can manually download the file from:");
    Console.Error.WriteLine("  https://huggingface.co/google-bert/bert-base-uncased/resolve/main/vocab.txt");
    Console.Error.WriteLine($"  and save it to: {outputPath ?? repoOutputPath}");
    Environment.Exit(1);
    return;
}

// Step 2: Verify the vocabulary structure
Console.Error.WriteLine();
Console.Error.WriteLine("Verifying vocabulary structure...");

var errors = new List<string>();

// Check special tokens
void ExpectToken(int index, string expected)
{
    if (index < vocabLines!.Length && vocabLines[index] != expected)
        errors.Add($"  Line {index}: expected '{expected}', got '{vocabLines[index]}'");
}

ExpectToken(0, "[PAD]");
ExpectToken(100, "[UNK]");
ExpectToken(101, "[CLS]");
ExpectToken(102, "[SEP]");
ExpectToken(103, "[MASK]");

// Check [unused] tokens (lines 1-99 are [unused0]..[unused98])
for (int i = 1; i <= 99; i++)
{
    ExpectToken(i, $"[unused{i - 1}]");
}

// Check [unused] tokens (lines 104-998 are [unused99]..[unused993])
// The real bert-base-uncased has 994 unused tokens total:
//   [unused0]..[unused98] at positions 1-99
//   [unused99]..[unused993] at positions 104-998
for (int i = 104; i <= 998; i++)
{
    ExpectToken(i, $"[unused{i - 104 + 99}]");
}

// Check some known vocabulary entries at well-known positions
// In bert-base-uncased, "!" is at index 999, "." at 1012, "a" at 1037, "the" at 1996
ExpectToken(999, "!");
ExpectToken(1012, ".");
ExpectToken(1037, "a");
ExpectToken(1996, "the");

if (errors.Count > 0)
{
    Console.Error.WriteLine("WARNING: Vocabulary structure issues detected:");
    foreach (var err in errors.Take(20))
        Console.Error.WriteLine(err);
    if (errors.Count > 20)
        Console.Error.WriteLine($"  ... and {errors.Count - 20} more");
    Console.Error.WriteLine();
    Console.Error.WriteLine("This may indicate a different BERT variant. Proceeding anyway...");
}
else
{
    Console.Error.WriteLine("Vocabulary structure verified: OK");
}

// Step 3: Compute SHA-256 hash for verification
Console.Error.WriteLine();
var vocabContent = string.Join("\n", vocabLines) + "\n"; // Unix line endings
var hashBytes = SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(vocabContent));
var hashHex = Convert.ToHexString(hashBytes).ToLowerInvariant();
Console.Error.WriteLine($"SHA-256: {hashHex}");

// Step 4: Write output
Console.Error.WriteLine();

if (writeToStdout)
{
    Console.Error.WriteLine("Writing vocabulary to stdout...");
    foreach (var line in vocabLines)
    {
        Console.WriteLine(line);
    }
    Console.Error.WriteLine($"Done. Wrote {vocabLines.Length} lines to stdout.");
}
else
{
    // Ensure output directory exists
    var dir = Path.GetDirectoryName(outputPath!);
    if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
    {
        Directory.CreateDirectory(dir);
        Console.Error.WriteLine($"Created directory: {dir}");
    }

    // Write with Unix line endings (standard for vocab.txt)
    await File.WriteAllTextAsync(outputPath!, string.Join("\n", vocabLines) + "\n");
    Console.Error.WriteLine($"Vocabulary written to: {outputPath}");
    Console.Error.WriteLine($"Total tokens: {vocabLines.Length}");

    // Verify the written file
    var writtenLines = (await File.ReadAllTextAsync(outputPath!)).Split('\n', StringSplitOptions.None);
    if (writtenLines.Length > 0 && string.IsNullOrEmpty(writtenLines[^1]))
        writtenLines = writtenLines[..^1];
    Console.Error.WriteLine($"Verification: file contains {writtenLines.Length} tokens");
}

// Step 5: Print some stats
Console.Error.WriteLine();
Console.Error.WriteLine("=== Vocabulary Statistics ===");
Console.Error.WriteLine($"Total tokens: {vocabLines.Length}");

int specialCount = 0;
int unusedCount = 0;
int wordPieceCount = 0;
int singleCharCount = 0;
int regularCount = 0;

foreach (var line in vocabLines)
{
    if (line.StartsWith("[") && line.EndsWith("]"))
    {
        if (line.StartsWith("[unused"))
            unusedCount++;
        else
            specialCount++;
    }
    else if (line.StartsWith("##"))
    {
        wordPieceCount++;
    }
    else if (line.Length == 1)
    {
        singleCharCount++;
    }
    else
    {
        regularCount++;
    }
}

Console.Error.WriteLine($"  Special tokens: {specialCount} ([PAD], [UNK], [CLS], [SEP], [MASK])");
Console.Error.WriteLine($"  Unused tokens:  {unusedCount}");
Console.Error.WriteLine($"  Single chars:   {singleCharCount}");
Console.Error.WriteLine($"  WordPiece (##): {wordPieceCount}");
Console.Error.WriteLine($"  Regular words:  {regularCount}");
Console.Error.WriteLine();
Console.Error.WriteLine("Done!");
