using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Neuro.Api.Entity;
using Neuro.EntityFrameworkCore.Extensions;
using Neuro.EntityFrameworkCore.Services;
using Neuro.Shared.Dtos;

namespace Neuro.Api.Controllers;

public class TeamController : ApiControllerBase
{
    private readonly IUnitOfWork _db;
    public TeamController(IUnitOfWork db) { _db = db; }

    [HttpGet]
    public async Task<IActionResult> List([FromBody] TeamListRequest request)
    {
        request ??= new TeamListRequest();
        var q = _db.Q<Team>().AsNoTracking()
            .WhereNotNullOrWhiteSpace(request.Keyword, (src, k) => src.Where(t => EF.Functions.Like(t.Name, $"%{k}%") || EF.Functions.Like(t.Code, $"%{k}%")))
            .OrderByDescending(t => t.CreatedAt);

        var paged = await q.Select(t => new TeamDetail
        {
            Id = t.Id,
            Name = t.Name,
            Code = t.Code,
            Description = t.Description,
            IsEnabled = t.IsEnabled,
            ParentId = t.ParentId,
            Sort = t.Sort
        }).ToPagedListAsync(request.Page, request.PageSize);

        return Success(paged);
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] Guid id)
    {
        var t = await _db.Q<Team>().FirstOrDefaultAsync(x => x.Id == id);
        if (t is null) return Failure("Team not found.", 404);
        var dto = new TeamDetail { Id = t.Id, Name = t.Name, Code = t.Code, Description = t.Description, IsEnabled = t.IsEnabled, ParentId = t.ParentId, Sort = t.Sort };
        return Success(dto);
    }

    [HttpPost]
    public async Task<IActionResult> Upsert([FromBody] TeamUpsertRequest req)
    {
        if (req == null) return Failure("Invalid request.");
        if (req.Id.HasValue && req.Id != Guid.Empty)
        {
            var ent = await _db.Q<Team>().FirstOrDefaultAsync(x => x.Id == req.Id.Value);
            if (ent is null) return Failure("Team not found.", 404);
            if (!string.IsNullOrWhiteSpace(req.Name)) ent.Name = req.Name;
            if (!string.IsNullOrWhiteSpace(req.Code)) ent.Code = req.Code;
            if (!string.IsNullOrWhiteSpace(req.Description)) ent.Description = req.Description;
            if (req.IsEnabled.HasValue) ent.IsEnabled = req.IsEnabled.Value;
            if (req.ParentId.HasValue) ent.ParentId = req.ParentId;
            if (req.Sort.HasValue) ent.Sort = req.Sort.Value;

            await _db.UpdateAsync(ent);
            await _db.SaveChangesAsync();
            return Success(new UpsertResponse { Id = ent.Id });
        }

        if (string.IsNullOrWhiteSpace(req.Name)) return Failure("Name required.");
        var nt = new Team { Name = req.Name!, Code = req.Code ?? string.Empty, Description = req.Description ?? string.Empty, IsEnabled = req.IsEnabled ?? true, ParentId = req.ParentId, Sort = req.Sort ?? 0 };
        await _db.AddAsync(nt);
        await _db.SaveChangesAsync();
        return Success(new UpsertResponse { Id = nt.Id });
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] BatchDeleteRequest ids)
    {
        if (ids == null || ids.Ids == null || ids.Ids.Length == 0) return Failure("No ids provided.");
        await _db.RemoveByIdsAsync<Team>(ids.Ids);
        await _db.SaveChangesAsync();
        return Success();
    }
}
