using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

namespace Neuro.Document;

// Higher-fidelity DOCX -> Markdown converter using OpenXML.
// - Preserves headings (Heading1..n)
// - Converts tables into Markdown tables
// - Extracts images and embeds them as base64 data URIs in the returned markdown
public class DocxToMarkdownConverter : IDocumentConverter
{
    public string ConvertToMarkdown(Stream input, string? fileName = null, ConversionOptions? options = null)
    {
        using var ms = new MemoryStream();
        input.CopyTo(ms);
        ms.Position = 0;

        var sb = new StringBuilder();

        using (var doc = WordprocessingDocument.Open(ms, false))
        {
            var main = doc.MainDocumentPart;
            var body = main?.Document?.Body;
            if (body == null) return string.Empty;

            // Build style -> heading level map
            var styleHeadingMap = BuildStyleHeadingMap(main);

            int imageCounter = 0;

            foreach (var element in body.Elements())
            {
                switch (element)
                {
                    case Paragraph p:
                        var paraMd = ProcessParagraph(p, main, styleHeadingMap, fileName, ref imageCounter, options);
                        if (!string.IsNullOrWhiteSpace(paraMd))
                        {
                            sb.AppendLine(paraMd);
                            sb.AppendLine();
                        }
                        break;

                    case Table t:
                        var tableMd = ProcessTable(t);
                        if (!string.IsNullOrWhiteSpace(tableMd))
                        {
                            sb.AppendLine(tableMd);
                            sb.AppendLine();
                        }
                        break;

                    default:
                        // ignore other elements for now
                        break;
                }
            }
        }

        return sb.ToString().TrimEnd();
    }
    private string ProcessParagraph(Paragraph p, MainDocumentPart? main, System.Collections.Generic.Dictionary<string, int> styleHeadingMap, string? fileName, ref int imageCounter, ConversionOptions? options)
    {
        var styleId = p.ParagraphProperties?.ParagraphStyleId?.Val?.Value ?? string.Empty;
        int headingLevel = 0;
        if (!string.IsNullOrEmpty(styleId) && styleHeadingMap.TryGetValue(styleId, out var mapped)) headingLevel = mapped;
        if (headingLevel == 0) headingLevel = GetHeadingLevelFromStyle(styleId);

        // Determine list prefix if any
        var (listPrefix, listLevel) = DetermineListPrefix(p, main);

        var runs = p.Elements<Run>();
        var sb = new StringBuilder();

        foreach (var r in runs)
        {
            // handle images inside runs
            var drawing = r.Descendants<DocumentFormat.OpenXml.Drawing.Blip>().FirstOrDefault();
            if (drawing != null && main != null)
            {
                var embedId = drawing.Embed?.Value;
                if (!string.IsNullOrEmpty(embedId))
                {
                    var imagePart = (ImagePart?)main.GetPartById(embedId);
                    if (imagePart != null)
                    {
                        using var imgStream = imagePart.GetStream();
                        using var msImg = new MemoryStream();
                        imgStream.CopyTo(msImg);
                        var bytes = msImg.ToArray();
                        var contentType = imagePart.ContentType;

                        if (options != null && options.ImageSaveMode == ImageSaveMode.SaveToFiles)
                        {
                            // save to file
                            imageCounter++;
                            var suggested = $"image-{imageCounter}.{GetExtensionForContentType(contentType)}";
                            string savedPath;
                            if (options.ImageSaveCallback != null)
                            {
                                savedPath = options.ImageSaveCallback(bytes, suggested);
                            }
                            else
                            {
                                var outDir = DetermineImageOutputDirectory(options, fileName);
                                Directory.CreateDirectory(outDir);
                                var filePath = Path.Combine(outDir, suggested);
                                File.WriteAllBytes(filePath, bytes);
                                // use relative path where possible
                                savedPath = Path.Combine(Path.GetFileName(outDir), Path.GetFileName(filePath)).Replace("\\", "/");
                            }

                            sb.Append($"![]({savedPath})");
                        }
                        else
                        {
                            // default inline data-uri
                            var base64 = Convert.ToBase64String(bytes);
                            sb.Append($"![](data:{contentType};base64,{base64})");
                        }
                    }
                }

                continue;
            }

            // normal text runs with basic formatting
            string text = string.Concat(r.Elements<Text>().Select(t => t.Text));
            if (string.IsNullOrEmpty(text)) continue;

            // If run is within a Hyperlink, wrap text accordingly
            var hyperlink = r.Ancestors<Hyperlink>().FirstOrDefault();
            string? href = null;
            if (hyperlink != null && main != null)
            {
                if (!string.IsNullOrEmpty(hyperlink.Anchor?.Value)) href = "#" + hyperlink.Anchor.Value;
                else if (!string.IsNullOrEmpty(hyperlink.Id?.Value))
                {
                    var hr = main.HyperlinkRelationships?.FirstOrDefault(h => h.Id == hyperlink.Id.Value);
                    if (hr != null) href = hr.Uri.ToString();
                }
            }

            var isBold = r.RunProperties?.Bold != null;
            var isItalic = r.RunProperties?.Italic != null;
            var isUnderline = r.RunProperties?.Underline != null;
            var isStrike = r.RunProperties?.Strike != null;
            var isCode = r.RunProperties?.RunFonts != null && !string.IsNullOrEmpty(r.RunProperties.RunFonts.Ascii?.Value) && r.RunProperties.RunFonts.Ascii.Value.Contains("Courier");

            var formatted = text;
            if (isCode) formatted = $"`{formatted}`";
            if (isBold && isItalic) formatted = $"***{formatted}***";
            else if (isBold) formatted = $"**{formatted}**";
            else if (isItalic) formatted = $"_{formatted}_";
            if (isUnderline) formatted = $"<u>{formatted}</u>";
            if (isStrike) formatted = $"~~{formatted}~~";

            if (href != null)
                sb.Append($"[{formatted}]({href})");
            else
                sb.Append(formatted);
        }

        var paragraphText = sb.ToString().Trim();
        if (string.IsNullOrWhiteSpace(paragraphText)) return string.Empty;

        if (headingLevel > 0)
        {
            var hashes = string.Concat(Enumerable.Repeat("#", Math.Min(6, headingLevel)));
            return $"{hashes} {paragraphText}";
        }

        if (!string.IsNullOrEmpty(listPrefix))
        {
            var indent = new string(' ', Math.Max(0, listLevel * 2));
            return $"{indent}{listPrefix} {paragraphText}";
        }

        return paragraphText;
    }

    private int GetHeadingLevelFromStyle(string styleId)
    {
        if (string.IsNullOrEmpty(styleId)) return 0;
        // Common style id patterns: Heading1, Heading 1, 标题1, Title
        var m = Regex.Match(styleId, @"(H|Heading|heading|标题)\s*[-_ ]?([0-9]+)", RegexOptions.IgnoreCase);
        if (m.Success && int.TryParse(m.Groups[2].Value, out var lvl)) return lvl;

        if (styleId.Equals("Title", StringComparison.OrdinalIgnoreCase)) return 1;
        return 0;
    }

    private System.Collections.Generic.Dictionary<string, int> BuildStyleHeadingMap(MainDocumentPart? main)
    {
        var map = new System.Collections.Generic.Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        if (main?.StyleDefinitionsPart?.Styles == null) return map;

        foreach (var style in main.StyleDefinitionsPart.Styles.Elements<Style>())
        {
            if (style.Type != null && style.Type.Value == StyleValues.Paragraph)
            {
                var styleId = style.StyleId?.Value;
                if (string.IsNullOrEmpty(styleId)) continue;

                int level = 0;
                var ol = style.StyleParagraphProperties?.OutlineLevel?.Val?.Value;
                if (ol != null) level = (int)ol + 1; // Outline level is zero-based

                if (level == 0)
                {
                    var name = style.StyleName?.Val?.Value ?? string.Empty;
                    var m = Regex.Match(name, @"[Hh]eading\s*([0-9]+)");
                    if (m.Success && int.TryParse(m.Groups[1].Value, out var n)) level = n;

                    var m2 = Regex.Match(styleId, @"(H|Heading|heading|标题)\s*[-_ ]?([0-9]+)", RegexOptions.IgnoreCase);
                    if (level == 0 && m2.Success && int.TryParse(m2.Groups[2].Value, out var mval)) level = mval;
                }

                if (level > 0)
                {
                    map[styleId] = level;
                }
            }
        }

        return map;
    }

    private (string? prefix, int level) DetermineListPrefix(Paragraph p, MainDocumentPart? main)
    {
        var np = p.ParagraphProperties?.NumberingProperties;
        if (np == null) return (null, 0);

        var ilvl = (int?)(np.NumberingLevelReference?.Val?.Value) ?? 0;
        var numIdVal = np.NumberingId?.Val?.Value;
        if (numIdVal == null || main?.NumberingDefinitionsPart == null) return ("-", ilvl);

        var numbering = main.NumberingDefinitionsPart.Numbering;
        if (numbering == null) return ("-", ilvl);

        var num = numbering.Elements<NumberingInstance>().FirstOrDefault(n => n.NumberID != null && n.NumberID.Value == numIdVal);
        if (num == null) return ("-", ilvl);

        var abstractId = num.AbstractNumId?.Val?.Value;
        if (abstractId == null) return ("-", ilvl);

        var abstractNum = numbering.Elements<AbstractNum>().FirstOrDefault(a => a.AbstractNumberId != null && a.AbstractNumberId.Value == abstractId);
        if (abstractNum == null) return ("-", ilvl);

        var lvl = abstractNum.Elements<Level>().FirstOrDefault(l => l.LevelIndex != null && l.LevelIndex.Value == ilvl);
        var fmtVal = lvl?.NumberingFormat?.Val?.Value;
        if (fmtVal == NumberFormatValues.Bullet) return ("-", ilvl);
        if (fmtVal == NumberFormatValues.Decimal) return ("1.", ilvl);

        // fallback
        return ("-", ilvl);
    }

    private string DetermineImageOutputDirectory(ConversionOptions? options, string? fileName)
    {
        if (options != null && !string.IsNullOrEmpty(options.ImageOutputDirectory)) return options.ImageOutputDirectory!;
        if (!string.IsNullOrEmpty(fileName))
        {
            var dir = Path.GetDirectoryName(fileName);
            var imagesDirName = Path.GetFileNameWithoutExtension(fileName) + "_images";
            if (string.IsNullOrEmpty(dir)) return Path.Combine(Directory.GetCurrentDirectory(), imagesDirName);
            return Path.Combine(dir, imagesDirName);
        }

        var tmp = Path.Combine(Path.GetTempPath(), "neuro_doc_images_");
        Directory.CreateDirectory(tmp);
        return tmp;
    }

    private string GetExtensionForContentType(string contentType)
    {
        try
        {
            var parts = contentType.Split('/');
            if (parts.Length == 2)
            {
                var ext = parts[1].Replace("jpeg", "jpg");
                if (ext.Contains("+")) ext = ext.Split('+')[0];
                if (ext.Contains(";")) ext = ext.Split(';')[0];
                return ext;
            }
        }
        catch { }
        return "bin";
    }

    private string ProcessTable(Table table)
    {
        var rows = table.Elements<TableRow>().ToList();
        if (!rows.Any()) return string.Empty;

        // Convert to markdown: use first row as header
        var headerCells = rows.First().Elements<TableCell>().Select(GetCellText).ToList();
        var sb = new StringBuilder();

        sb.AppendLine("| " + string.Join(" | ", headerCells) + " |");
        sb.AppendLine("| " + string.Join(" | ", headerCells.Select(_ => "---")) + " |");

        foreach (var r in rows.Skip(1))
        {
            var cells = r.Elements<TableCell>().Select(GetCellText).ToList();
            sb.AppendLine("| " + string.Join(" | ", cells) + " |");
        }

        return sb.ToString().TrimEnd();
    }

    private string GetCellText(TableCell cell)
    {
        var texts = cell.Descendants<Text>().Select(t => t.Text);
        var combined = string.Join(" ", texts).Trim();
        // collapse whitespace
        combined = Regex.Replace(combined, "\\s+", " ");
        return combined;
    }
}