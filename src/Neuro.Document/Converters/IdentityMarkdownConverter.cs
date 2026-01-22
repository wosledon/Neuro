using System.IO;

namespace Neuro.Document;

// For .md files, just return the existing content
public class IdentityMarkdownConverter : IDocumentConverter
{
    public string ConvertToMarkdown(Stream input, string? fileName = null, ConversionOptions? options = null)
    {
        using var sr = new StreamReader(input, leaveOpen: true);
        return sr.ReadToEnd();
    }
}
