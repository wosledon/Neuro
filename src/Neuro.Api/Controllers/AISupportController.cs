using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Neuro.Api.Entity;
using Neuro.EntityFrameworkCore.Extensions;
using Neuro.EntityFrameworkCore.Services;
using Neuro.Shared.Dtos;
using Neuro.Shared.Enums;

namespace Neuro.Api.Controllers;

public class AISupportController : ApiControllerBase
{
    private readonly IUnitOfWork _db;
    public AISupportController(IUnitOfWork db) { _db = db; }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] KeywordListRequest request)
    {
        request ??= new KeywordListRequest();
        var q = _db.Q<AISupport>().AsNoTracking()
            .WhereNotNullOrWhiteSpace(request.Keyword, (src, k) => src.Where(a => EF.Functions.Like(a.Name, $"%{k}%")))
            .OrderByDescending(a => a.IsPin)
            .ThenBy(a => a.Sort);

        var paged = await q.Select(a => new AISupportDetail
        {
            Id = a.Id,
            Name = a.Name,
            Provider = a.Provider,
            ApiKey = a.ApiKey,
            Endpoint = a.Endpoint,
            Description = a.Description,
            IsEnabled = a.IsEnabled,
            IsPin = a.IsPin,
            ModelName = a.ModelName,
            MaxTokens = a.MaxTokens,
            Temperature = a.Temperature,
            TopP = a.TopP,
            FrequencyPenalty = a.FrequencyPenalty,
            PresencePenalty = a.PresencePenalty,
            CustomParameters = a.CustomParameters,
            Sort = a.Sort
        }).ToPagedListAsync(request.Page, request.PageSize);

        return Success(paged);
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] Guid id)
    {
        var a = await _db.Q<AISupport>().FirstOrDefaultAsync(x => x.Id == id);
        if (a is null) return Failure("AI Support not found.", 404);
        return Success(new AISupportDetail
        {
            Id = a.Id,
            Name = a.Name,
            Provider = a.Provider,
            ApiKey = a.ApiKey,
            Endpoint = a.Endpoint,
            Description = a.Description,
            IsEnabled = a.IsEnabled,
            IsPin = a.IsPin,
            ModelName = a.ModelName,
            MaxTokens = a.MaxTokens,
            Temperature = a.Temperature,
            TopP = a.TopP,
            FrequencyPenalty = a.FrequencyPenalty,
            PresencePenalty = a.PresencePenalty,
            CustomParameters = a.CustomParameters,
            Sort = a.Sort
        });
    }

    [HttpPost]
    public async Task<IActionResult> Upsert([FromBody] AISupportUpsertRequest req)
    {
        if (req == null) return Failure("Invalid request.");
        if (req.Id.HasValue && req.Id != Guid.Empty)
        {
            var ent = await _db.Q<AISupport>().FirstOrDefaultAsync(x => x.Id == req.Id.Value);
            if (ent is null) return Failure("AI Support not found.", 404);
            if (!string.IsNullOrWhiteSpace(req.Name)) ent.Name = req.Name;
            if (req.Provider.HasValue) ent.Provider = req.Provider.Value;
            if (!string.IsNullOrWhiteSpace(req.ApiKey)) ent.ApiKey = req.ApiKey;
            if (!string.IsNullOrWhiteSpace(req.Endpoint)) ent.Endpoint = req.Endpoint;
            if (!string.IsNullOrWhiteSpace(req.Description)) ent.Description = req.Description;
            if (req.IsEnabled.HasValue) ent.IsEnabled = req.IsEnabled.Value;
            if (req.IsPin.HasValue) ent.IsPin = req.IsPin.Value;
            if (!string.IsNullOrWhiteSpace(req.ModelName)) ent.ModelName = req.ModelName;
            if (req.MaxTokens.HasValue) ent.MaxTokens = req.MaxTokens.Value;
            if (req.Temperature.HasValue) ent.Temperature = req.Temperature.Value;
            if (req.TopP.HasValue) ent.TopP = req.TopP.Value;
            if (req.FrequencyPenalty.HasValue) ent.FrequencyPenalty = req.FrequencyPenalty.Value;
            if (req.PresencePenalty.HasValue) ent.PresencePenalty = req.PresencePenalty.Value;
            if (!string.IsNullOrWhiteSpace(req.CustomParameters)) ent.CustomParameters = req.CustomParameters;
            if (req.Sort.HasValue) ent.Sort = req.Sort.Value;

            await _db.UpdateAsync(ent);
            await _db.SaveChangesAsync();
            return Success(new UpsertResponse { Id = ent.Id });
        }

        if (string.IsNullOrWhiteSpace(req.Name)) return Failure("Name required.");

        var na = new AISupport
        {
            Name = req.Name!,
            Provider = req.Provider ?? AIProviderEnum.OpenAI,
            ApiKey = req.ApiKey ?? string.Empty,
            Endpoint = req.Endpoint ?? string.Empty,
            Description = req.Description ?? string.Empty,
            IsEnabled = req.IsEnabled ?? true,
            IsPin = req.IsPin ?? false,
            ModelName = req.ModelName ?? "gpt-4",
            MaxTokens = req.MaxTokens ?? 2048,
            Temperature = req.Temperature ?? 0.7,
            TopP = req.TopP ?? 1.0,
            FrequencyPenalty = req.FrequencyPenalty ?? 0.0,
            PresencePenalty = req.PresencePenalty ?? 0.0,
            CustomParameters = req.CustomParameters ?? string.Empty,
            Sort = req.Sort ?? 0
        };

        await _db.AddAsync(na);
        await _db.SaveChangesAsync();
        return Success(new UpsertResponse { Id = na.Id });
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] BatchDeleteRequest ids)
    {
        if (ids == null || ids.Ids == null || ids.Ids.Length == 0) return Failure("No ids provided.");
        await _db.RemoveByIdsAsync<AISupport>(ids.Ids);
        await _db.SaveChangesAsync();
        return Success();
    }
}
