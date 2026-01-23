# Copilot / AI agent instructions for Neuro ✅

Purpose: short, actionable guidance so an AI coding agent can be productive quickly in this repository.

## Big picture 🔧

- Neuro is a small collection of focused .NET libraries (C#) that provide:
  - `Neuro.Api` — minimal ASP.NET Core host / example API (`Program.cs`, controllers under `Controllers/`).
  - `Neuro.Vector` — local vector store abstractions and small providers (see `Abstractions/`, `Providers/`, `Stores/`, `Extensions/`).
  - `Neuro.Vectorizer` — ONNX-based vectorizer (`OnnxVectorizer`, default model `models/bert_Opset18.onnx`).
  - `Neuro.Tokenizer` — tokenizer adapter using `Microsoft.ML.Tokenizers` (`TiktokenTokenizerAdapter`).
  - `Neuro.Document` — document -> markdown converters (`IDocumentConverter`, `NeuroConverter`).

## Key design patterns & conventions 🧭

- Dependency Injection via extension methods: prefer `AddVectorStore(...)` / `AddVectorStoreProvider(...)` (`src/Neuro.Vector/Extensions/VectorStoreExtensions.cs`).
- Factory registration: `VectorStoreFactory.RegisterProvider` + `VectorStoreFactory.Create*` are the canonical provider points (`src/Neuro.Vector/Providers/VectorStoreFactory.cs`).
- Small, well-scoped libraries where each project exposes a single abstraction (e.g., `IVectorStore`, `IVectorizer`, `ITokenizer`, `IDocumentConverter`). Implementations follow those interfaces.
- Public APIs and config are intentionally stable; prefer adding overloads or extension points over breaking changes.
- Repository contains Chinese comments/messages — new code may use Chinese for XML comments and exception messages to remain consistent.

## Running, building & tests ⚙️

- Solution file: `Neuro.slnx` (use `dotnet build Neuro.slnx` or `dotnet build` at repo root).
- Run the sample API: `cd src/Neuro.Api && dotnet run`.
- Tests: `dotnet test` (requires .NET 10 SDK as projects target `net10.0`).
- Vectorizer uses a large ONNX model tracked via Git LFS. Run `git lfs pull` to fetch `src/Neuro.Vectorizer/models/bert_Opset18.onnx` before running vectorizer tests or usage that requires the model.
  - Tests in `tests/Neuro.Vectorizer.Tests/VectorizerTests.cs` will skip if the model is not present (the test looks for common candidate paths), so explicit `git lfs pull` is recommended for deterministic CI.

## Project-specific gotchas & notes ⚠️

- `TiktokenTokenizerAdapter` (`src/Neuro.Tokenizer/TiktokenTokenizerAdapter.cs`) uses `EncodingName` and explicitly does NOT support local encoding files (`EncodingFilePath`). The adapter will throw if `EncodingFilePath` is set.
- `OnnxVectorizer` default `ModelPath` is `models/bert_Opset18.onnx` (see `src/Neuro.Vectorizer/OnnxVectorizer.cs`). Tests attempt multiple fallbacks to locate the model; prefer using `VectorizerOptions.ModelPath` in code or ensure model file presence.
- Vector store DI registration supports two modes: named provider (`ProviderName`) and factory (`ProviderFactory`). Unit tests exercising both patterns live under `tests/Neuro.Vector.Tests`.

## Where to make changes / how to add features ✍️

- Add new vector store providers by registering via `VectorStoreFactory.RegisterProvider` and exposing a DI helper via `AddVectorStoreProvider`.
- Implement new tokenizers or vectorizers by implementing `ITokenizer` / `IVectorizer` interfaces under respective projects and adding DI registration in `TokenizerExtensions` / `VectorizerExtensions`.
- Add converters by implementing `IDocumentConverter` and ensure `NeuroConverter` can discover or be configured to use it.

## Files & places to inspect for examples 📁

- `src/Neuro.Vector/Extensions/VectorStoreExtensions.cs` (DI + options pattern)
- `src/Neuro.Vector/Providers/VectorStoreFactory.cs` (provider registration pattern)
- `src/Neuro.Vectorizer/OnnxVectorizer.cs` (model loading / default path)
- `src/Neuro.Tokenizer/TiktokenTokenizerAdapter.cs` (tokenizer adapter behavior)
- `src/Neuro.Document/NeuroConverter.cs` and `src/Neuro.Document/Converters/` (document conversion examples)
- Tests under `tests/` show canonical usage and expectations (DI tests, provider registration, vectorizer model locate logic).

---

If any section is unclear or you'd like additional examples (unit-test-first patch, DI wiring sample, or a CodeAction to add a new provider), tell me which part to expand and I will iterate. 💡
