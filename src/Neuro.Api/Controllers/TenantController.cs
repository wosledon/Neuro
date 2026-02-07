using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Neuro.Api.Entity;
using Neuro.EntityFrameworkCore.Extensions;
using Neuro.EntityFrameworkCore.Services;
using Neuro.Shared.Dtos;

namespace Neuro.Api.Controllers;

public class TenantController : ApiControllerBase
{
    private readonly IUnitOfWork _db;
    public TenantController(IUnitOfWork db) { _db = db; }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] TenantListRequest request)
    {
        request ??= new TenantListRequest();
        var q = _db.Q<Tenant>().AsNoTracking()
            .WhereNotNullOrWhiteSpace(request.Keyword, (src, k) => src.Where(t => EF.Functions.Like(t.Name, $"%{k}%") || EF.Functions.Like(t.Code, $"%{k}%")))
            .OrderByDescending(t => t.CreatedAt);

        var paged = await q.Select(t => new TenantDetail
        {
            Id = t.Id,
            Name = t.Name,
            Code = t.Code,
            Logo = t.Logo,
            Description = t.Description,
            IsEnabled = t.IsEnabled,
            ExpiredAt = t.ExpiredAt
        }).ToPagedListAsync(request.Page, request.PageSize);

        return Success(paged);
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] Guid id)
    {
        var t = await _db.Q<Tenant>().FirstOrDefaultAsync(x => x.Id == id);
        if (t is null) return Failure("Tenant not found.", 404);
        return Success(new TenantDetail
        {
            Id = t.Id,
            Name = t.Name,
            Code = t.Code,
            Logo = t.Logo,
            Description = t.Description,
            IsEnabled = t.IsEnabled,
            ExpiredAt = t.ExpiredAt
        });
    }

    [HttpPost]
    public async Task<IActionResult> Upsert([FromBody] TenantUpsertRequest req)
    {
        if (req == null) return Failure("Invalid request.");

        if (req.Id.HasValue && req.Id != Guid.Empty)
        {
            var ent = await _db.Q<Tenant>().FirstOrDefaultAsync(x => x.Id == req.Id.Value);
            if (ent is null) return Failure("Tenant not found.", 404);
            if (!string.IsNullOrWhiteSpace(req.Name)) ent.Name = req.Name;
            if (!string.IsNullOrWhiteSpace(req.Code)) ent.Code = req.Code;
            if (!string.IsNullOrWhiteSpace(req.Logo)) ent.Logo = req.Logo;
            if (!string.IsNullOrWhiteSpace(req.Description)) ent.Description = req.Description;
            if (req.IsEnabled.HasValue) ent.IsEnabled = req.IsEnabled.Value;
            if (req.ExpiredAt.HasValue) ent.ExpiredAt = req.ExpiredAt;

            await _db.UpdateAsync(ent);
            await _db.SaveChangesAsync();
            return Success(new UpsertResponse { Id = ent.Id });
        }

        if (string.IsNullOrWhiteSpace(req.Name)) return Failure("Name required.");

        var nt = new Tenant
        {
            Name = req.Name!,
            Code = req.Code ?? string.Empty,
            Logo = req.Logo ?? string.Empty,
            Description = req.Description ?? string.Empty,
            IsEnabled = req.IsEnabled ?? true,
            ExpiredAt = req.ExpiredAt
        };

        await _db.AddAsync(nt);
        await _db.SaveChangesAsync();
        return Success(new UpsertResponse { Id = nt.Id });
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] BatchDeleteRequest ids)
    {
        if (ids == null || ids.Ids == null || ids.Ids.Length == 0) return Failure("No ids provided.");
        await _db.RemoveByIdsAsync<Tenant>(ids.Ids);
        await _db.SaveChangesAsync();
        return Success();
    }
}
