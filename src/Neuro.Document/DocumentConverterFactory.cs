using System;
using System.IO;

namespace Neuro.Document;

public static class DocumentConverterFactory
{
    public static IDocumentConverter GetConverterByExtension(string? extension)
    {
        if (extension == null) throw new ArgumentNullException(nameof(extension));
        extension = extension.Trim().ToLowerInvariant();
        return extension switch
        {
            ".html" or ".htm" => new HtmlToMarkdownConverter(),
            ".md" => new IdentityMarkdownConverter(),
            ".txt" => new TextToMarkdownConverter(),
            ".docx" => new DocxToMarkdownConverter(),
            ".pdf" => new PdfToMarkdownConverter(),
            ".rtf" => new RtfToMarkdownConverter(),
            _ => throw new NotSupportedException($"No converter registered for extension '{extension}'")
        };
    }

    public static IDocumentConverter GetConverterByFileName(string fileName)
    {
        if (fileName == null) throw new ArgumentNullException(nameof(fileName));
        var ext = Path.GetExtension(fileName);
        return GetConverterByExtension(ext);
    }
}
