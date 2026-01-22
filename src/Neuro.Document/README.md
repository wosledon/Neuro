# Neuro.Document

A lightweight document-to-Markdown converter library.

Supported input formats:
- .md (pass-through)
- .txt
- .html / .htm
- .docx (via OpenXml -> HTML -> Markdown)
- .pdf (text extraction)
- .rtf (via RtfPipe -> HTML -> Markdown)

Basic usage:

```csharp
using System.IO;
using Neuro.Document;

var md = NeuroConverter.ConvertFileToMarkdown("example.docx");

// or with a Stream:
using var fs = File.OpenRead("example.pdf");
var md2 = NeuroConverter.ConvertToMarkdown(fs, "example.pdf");
```

Notes:
- The library is intentionally small and designed to be extensible by adding new implementations of `IDocumentConverter`.
- Converting complex Word documents or PDFs may lose layout or advanced formatting. The goal is readable markdown, not perfect fidelity.
