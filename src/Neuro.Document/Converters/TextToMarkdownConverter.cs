using System.IO;

namespace Neuro.Document;

public class TextToMarkdownConverter : IDocumentConverter
{
    public string ConvertToMarkdown(Stream input, string? fileName = null, ConversionOptions? options = null)
    {
        using var sr = new StreamReader(input, leaveOpen: true);
        // Plain text -> wrap as paragraphs preserving blank lines
        var text = sr.ReadToEnd();
        // Minimal normalization: ensure consistent newlines
        text = text.Replace("\r\n", "\n").Replace("\r", "\n");
        return text.TrimEnd();
    }
}
