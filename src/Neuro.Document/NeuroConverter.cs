using System.IO;
using System;
using System.Threading.Tasks;

namespace Neuro.Document;

public static class NeuroConverter
{
    /// <summary>
    /// Convert document stream to markdown based on filename extension.
    /// </summary>
    /// <param name="input">Input stream. Caller retains ownership; stream will not be disposed by this method.</param>
    /// <param name="fileName">File name (used to select converter by extension)</param>
    /// <returns>Markdown text</returns>
    public static string ConvertToMarkdown(Stream input, string fileName, ConversionOptions? options = null)
    {
        if (input == null) throw new ArgumentNullException(nameof(input));
        if (fileName == null) throw new ArgumentNullException(nameof(fileName));

        var converter = DocumentConverterFactory.GetConverterByFileName(fileName);
        // Ensure rewindable stream for converters
        if (!input.CanSeek)
        {
            var ms = new MemoryStream();
            input.CopyTo(ms);
            ms.Position = 0;
            return converter.ConvertToMarkdown(ms, fileName, options);
        }
        else
        {
            input.Position = 0;
            return converter.ConvertToMarkdown(input, fileName, options);
        }
    }

    /// <summary>
    /// Convenience async version that reads a file from disk and converts it.
    /// </summary>
    public static string ConvertFileToMarkdown(string path, ConversionOptions? options = null)
    {
        using var fs = File.OpenRead(path);
        return ConvertToMarkdown(fs, path, options);
    }
}
