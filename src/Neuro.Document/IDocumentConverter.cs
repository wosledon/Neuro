using System.IO;

namespace Neuro.Document;

public interface IDocumentConverter
{
    /// <summary>
    /// Convert the input stream to Markdown.
    /// The implementation should NOT dispose the provided stream.
    /// </summary>
    /// <param name="input">Input stream containing the document.</param>
    /// <param name="fileName">Optional file name used to determine type or for diagnostics.</param>
    /// <param name="options">Optional conversion options</param>
    /// <returns>Markdown text</returns>
    string ConvertToMarkdown(Stream input, string? fileName = null, ConversionOptions? options = null);
}
