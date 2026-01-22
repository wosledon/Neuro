using System.IO;
using System.Text.RegularExpressions;
using ReverseMarkdown;

namespace Neuro.Document;

public class HtmlToMarkdownConverter : IDocumentConverter
{
    public string ConvertToMarkdown(Stream input, string? fileName = null, ConversionOptions? options = null)
    {
        using var sr = new StreamReader(input, leaveOpen: true);
        var html = sr.ReadToEnd();

        // Try a simple extraction of <body> content to avoid heavy HTML libs
        var bodyMatch = Regex.Match(html, @"<body[^>]*>([\s\S]*?)</body>", RegexOptions.IgnoreCase);
        var htmlToConvert = bodyMatch.Success ? bodyMatch.Groups[1].Value : html;

        var converter = new Converter();
        var markdown = converter.Convert(htmlToConvert);
        return markdown ?? string.Empty;
    }
}
