using System.IO;
using System.Linq;
using System.Text;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using Xunit;

namespace Neuro.Document.Tests;

public class ConvertersTests
{
    [Fact]
    public void TextConverter_ReturnsSameText()
    {
        var input = "Line1\n\nLine2";
        using var ms = new MemoryStream(Encoding.UTF8.GetBytes(input));
        var md = NeuroConverter.ConvertToMarkdown(ms, "sample.txt");
        Assert.Equal("Line1\n\nLine2", md);
    }

    [Fact]
    public void HtmlConverter_ConvertsSimpleHtml()
    {
        var html = "<html><body><h1>Title</h1><p>Hello</p></body></html>";
        using var ms = new MemoryStream(Encoding.UTF8.GetBytes(html));
        var md = NeuroConverter.ConvertToMarkdown(ms, "sample.html");
        Assert.Contains("Title", md);
        Assert.Contains("Hello", md);
    }

    [Fact]
    public void DocxConverter_ExtractsParagraphsAndHeadingsAndTable()
    {
        using var ms = new MemoryStream();
        using (var wordDoc = WordprocessingDocument.Create(ms, WordprocessingDocumentType.Document, true))
        {
            var main = wordDoc.AddMainDocumentPart();
            main.Document = new DocumentFormat.OpenXml.Wordprocessing.Document();
            var body = main.Document.AppendChild(new Body());

            // Heading
            var heading = new Paragraph(new ParagraphProperties(new ParagraphStyleId() { Val = "Heading1" }), new Run(new Text("Title")));
            body.AppendChild(heading);

            // Paragraphs
            body.AppendChild(new Paragraph(new Run(new Text("Para1"))));
            body.AppendChild(new Paragraph(new Run(new Text("Para2"))));

            // Table (header + 1 row)
            var table = new Table();
            var trHead = new TableRow();
            trHead.Append(new TableCell(new Paragraph(new Run(new Text("H1")))));
            trHead.Append(new TableCell(new Paragraph(new Run(new Text("H2")))));
            table.Append(trHead);

            var tr = new TableRow();
            tr.Append(new TableCell(new Paragraph(new Run(new Text("A1")))));
            tr.Append(new TableCell(new Paragraph(new Run(new Text("A2")))));
            table.Append(tr);

            body.AppendChild(table);

            main.Document.Save();
        }

        ms.Position = 0;
        var md = NeuroConverter.ConvertToMarkdown(ms, "sample.docx");
        Assert.Contains("Title", md);
        Assert.Contains("Para1", md);
        Assert.Contains("Para2", md);
        Assert.Contains("| H1 | H2 |", md);
        Assert.Contains("| A1 | A2 |", md);
    }
}