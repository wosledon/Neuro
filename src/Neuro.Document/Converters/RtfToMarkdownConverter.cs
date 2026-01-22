using System.IO;
using ReverseMarkdown;
using RtfPipe;

namespace Neuro.Document;

public class RtfToMarkdownConverter : IDocumentConverter
{
    public string ConvertToMarkdown(Stream input, string? fileName = null, ConversionOptions? options = null)
    {
        using var sr = new StreamReader(input, leaveOpen: true);
        var rtf = sr.ReadToEnd();
        var html = Rtf.ToHtml(rtf);
        var converter = new Converter();
        var markdown = converter.Convert(html);
        return markdown ?? string.Empty;
    }
}
