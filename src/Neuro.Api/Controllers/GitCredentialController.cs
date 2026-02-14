using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Neuro.Api.Entity;
using Neuro.EntityFrameworkCore.Extensions;
using Neuro.EntityFrameworkCore.Services;
using Neuro.Shared.Dtos;
using Neuro.Shared.Enums;

namespace Neuro.Api.Controllers;

public class GitCredentialController : ApiControllerBase
{
    private readonly IUnitOfWork _db;
    public GitCredentialController(IUnitOfWork db) { _db = db; }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] KeywordListRequest request)
    {
        request ??= new KeywordListRequest();
        var q = _db.Q<GitCredential>().AsNoTracking()
            .WhereNotNullOrWhiteSpace(request.Keyword, (src, k) => src.Where(g => EF.Functions.Like(g.Name, $"%{k}%")))
            .OrderByDescending(g => g.IsActive)
            .ThenByDescending(g => g.LastUsedAt);

        var paged = await q.Select(g => new GitCredentialDetail
        {
            Id = g.Id,
            GitAccountId = g.GitAccountId,
            Type = g.Type,
            Name = g.Name,
            EncryptedSecret = g.EncryptedSecret,
            PublicKey = g.PublicKey,
            PassphraseEncrypted = g.PassphraseEncrypted,
            IsActive = g.IsActive,
            LastUsedAt = g.LastUsedAt,
            Notes = g.Notes
        }).ToPagedListAsync(request.Page, request.PageSize);

        return Success(paged);
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] Guid id)
    {
        var g = await _db.Q<GitCredential>().FirstOrDefaultAsync(x => x.Id == id);
        if (g is null) return Failure("Git Credential not found.", 404);
        return Success(new GitCredentialDetail
        {
            Id = g.Id,
            GitAccountId = g.GitAccountId,
            Type = g.Type,
            Name = g.Name,
            EncryptedSecret = g.EncryptedSecret,
            PublicKey = g.PublicKey,
            PassphraseEncrypted = g.PassphraseEncrypted,
            IsActive = g.IsActive,
            LastUsedAt = g.LastUsedAt,
            Notes = g.Notes
        });
    }

    [HttpPost]
    public async Task<IActionResult> Upsert([FromBody] GitCredentialUpsertRequest req)
    {
        if (req == null) return Failure("Invalid request.");
        if (req.Id.HasValue && req.Id != Guid.Empty)
        {
            var ent = await _db.Q<GitCredential>().FirstOrDefaultAsync(x => x.Id == req.Id.Value);
            if (ent is null) return Failure("Git Credential not found.", 404);
            if (req.GitAccountId.HasValue) ent.GitAccountId = req.GitAccountId.Value;
            if (req.Type.HasValue) ent.Type = req.Type.Value;
            if (!string.IsNullOrWhiteSpace(req.Name)) ent.Name = req.Name;
            if (!string.IsNullOrWhiteSpace(req.EncryptedSecret)) ent.EncryptedSecret = req.EncryptedSecret;
            if (!string.IsNullOrWhiteSpace(req.PublicKey)) ent.PublicKey = req.PublicKey;
            if (!string.IsNullOrWhiteSpace(req.PassphraseEncrypted)) ent.PassphraseEncrypted = req.PassphraseEncrypted;
            if (req.IsActive.HasValue) ent.IsActive = req.IsActive.Value;
            if (!string.IsNullOrWhiteSpace(req.Notes)) ent.Notes = req.Notes;

            await _db.UpdateAsync(ent);
            await _db.SaveChangesAsync();
            return Success(new UpsertResponse { Id = ent.Id });
        }

        if (string.IsNullOrWhiteSpace(req.Name)) return Failure("Name required.");
        if (!req.GitAccountId.HasValue) return Failure("GitAccountId required.");

        var ng = new GitCredential
        {
            GitAccountId = req.GitAccountId.Value,
            Type = req.Type ?? GitCredentialTypeEnum.Password,
            Name = req.Name!,
            EncryptedSecret = req.EncryptedSecret ?? string.Empty,
            PublicKey = req.PublicKey ?? string.Empty,
            PassphraseEncrypted = req.PassphraseEncrypted ?? string.Empty,
            IsActive = req.IsActive ?? true,
            Notes = req.Notes ?? string.Empty
        };

        await _db.AddAsync(ng);
        await _db.SaveChangesAsync();
        return Success(new UpsertResponse { Id = ng.Id });
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] BatchDeleteRequest ids)
    {
        if (ids == null || ids.Ids == null || ids.Ids.Length == 0) return Failure("No ids provided.");
        await _db.RemoveByIdsAsync<GitCredential>(ids.Ids);
        await _db.SaveChangesAsync();
        return Success();
    }
}
