using System.IO;
using System.Text;
using UglyToad.PdfPig;

namespace Neuro.Document;

public class PdfToMarkdownConverter : IDocumentConverter
{
    public string ConvertToMarkdown(Stream input, string? fileName = null, ConversionOptions? options = null)
    {
        // PdfPig requires a seekable stream
        using var ms = new MemoryStream();
        input.CopyTo(ms);
        ms.Position = 0;

        var sb = new StringBuilder();
        using (var doc = PdfDocument.Open(ms))
        {
            int pageIndex = 1;
            foreach (var page in doc.GetPages())
            {
                var text = page.Text;
                if (!string.IsNullOrWhiteSpace(text))
                {
                    // Simple heuristic: separate pages with HR
                    if (pageIndex > 1) sb.AppendLine("\n---\n");
                    sb.AppendLine(text.Trim());
                }
                pageIndex++;
            }
        }

        return sb.ToString().TrimEnd();
    }
}
