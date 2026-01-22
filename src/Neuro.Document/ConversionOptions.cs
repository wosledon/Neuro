namespace Neuro.Document;

public enum ImageSaveMode { DataUri, SaveToFiles }

public class ConversionOptions
{
    /// <summary>
    /// How images are embedded. Default is DataUri (inline base64).
    /// </summary>
    public ImageSaveMode ImageSaveMode { get; set; } = ImageSaveMode.DataUri;

    /// <summary>
    /// When saving images to files, the directory where images will be written. If not provided and input file name is provided, a sibling "{docname}_images" folder is used; otherwise a temp folder is used.
    /// </summary>
    public string? ImageOutputDirectory { get; set; }

    /// <summary>
    /// Optional callback that will be invoked to persist image bytes. Parameters: bytes, suggestedFileName. Return value: path to use in Markdown (relative or absolute).
    /// If provided, it takes precedence over ImageOutputDirectory.
    /// </summary>
    public Func<byte[], string, string>? ImageSaveCallback { get; set; }
}