using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Neuro.Api.Entity;
using Neuro.EntityFrameworkCore.Extensions;
using Neuro.EntityFrameworkCore.Services;
using Neuro.Shared.Dtos;

namespace Neuro.Api.Controllers;

public class MenuController : ApiControllerBase
{
    private readonly IUnitOfWork _db;
    public MenuController(IUnitOfWork db) { _db = db; }

    [HttpGet]
    public async Task<IActionResult> List([FromBody] MenuListRequest request)
    {
        request ??= new MenuListRequest();
        var q = _db.Q<Menu>().AsNoTracking()
            .WhereNotNullOrWhiteSpace(request.Keyword, (src, k) => src.Where(m => EF.Functions.Like(m.Name, $"%{k}%") || EF.Functions.Like(m.Code, $"%{k}%")))
            .OrderByDescending(m => m.CreatedAt);

        var paged = await q.Select(m => new MenuDetail
        {
            Id = m.Id,
            Name = m.Name,
            Code = m.Code,
            Description = m.Description,
            ParentId = m.ParentId,
            Url = m.Url,
            Icon = m.Icon,
            Sort = m.Sort
        }).ToPagedListAsync(request.Page, request.PageSize);
        return Success(paged);
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] Guid id)
    {
        var m = await _db.Q<Menu>().FirstOrDefaultAsync(x => x.Id == id);
        if (m is null) return Failure("Menu not found.", 404);
        var dto = new MenuDetail { Id = m.Id, Name = m.Name, Code = m.Code, Description = m.Description, ParentId = m.ParentId, Url = m.Url, Icon = m.Icon, Sort = m.Sort };
        return Success(dto);
    }

    [HttpPost]
    public async Task<IActionResult> Upsert([FromBody] MenuUpsertRequest req)
    {
        if (req == null) return Failure("Invalid request.");
        if (req.Id.HasValue && req.Id != Guid.Empty)
        {
            var ent = await _db.Q<Menu>().FirstOrDefaultAsync(x => x.Id == req.Id.Value);
            if (ent is null) return Failure("Menu not found.", 404);
            if (!string.IsNullOrWhiteSpace(req.Name)) ent.Name = req.Name;
            if (!string.IsNullOrWhiteSpace(req.Code)) ent.Code = req.Code;
            if (!string.IsNullOrWhiteSpace(req.Description)) ent.Description = req.Description;
            if (req.ParentId.HasValue) ent.ParentId = req.ParentId;
            if (!string.IsNullOrWhiteSpace(req.Url)) ent.Url = req.Url;
            if (!string.IsNullOrWhiteSpace(req.Icon)) ent.Icon = req.Icon;
            if (req.Sort.HasValue) ent.Sort = req.Sort.Value;

            await _db.UpdateAsync(ent);
            await _db.SaveChangesAsync();
            return Success(new UpsertResponse { Id = ent.Id });
        }

        if (string.IsNullOrWhiteSpace(req.Name)) return Failure("Name required.");
        var nm = new Menu { Name = req.Name!, Code = req.Code ?? string.Empty, Description = req.Description ?? string.Empty, ParentId = req.ParentId, Url = req.Url ?? string.Empty, Icon = req.Icon ?? string.Empty, Sort = req.Sort ?? 0 };
        await _db.AddAsync(nm);
        await _db.SaveChangesAsync();
        return Success(new UpsertResponse { Id = nm.Id });
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] BatchDeleteRequest ids)
    {
        if (ids == null || ids.Ids == null || ids.Ids.Length == 0) return Failure("No ids provided.");
        await _db.RemoveByIdsAsync<Menu>(ids.Ids);
        await _db.SaveChangesAsync();
        return Success();
    }
}
