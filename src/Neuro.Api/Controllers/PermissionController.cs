using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Neuro.Api.Entity;
using Neuro.EntityFrameworkCore.Extensions;
using Neuro.EntityFrameworkCore.Services;
using Neuro.Shared.Dtos;

namespace Neuro.Api.Controllers;

public class PermissionController : ApiControllerBase
{
    private readonly IUnitOfWork _db;
    public PermissionController(IUnitOfWork db) { _db = db; }

    [HttpGet]
    public async Task<IActionResult> List([FromBody] PermissionListRequest request)
    {
        request ??= new PermissionListRequest();
        var q = _db.Q<Permission>().AsNoTracking()
            .WhereNotNullOrWhiteSpace(request.Keyword, (src, k) => src.Where(p => EF.Functions.Like(p.Name, $"%{k}%") || EF.Functions.Like(p.Code, $"%{k}%")))
            .OrderByDescending(p => p.CreatedAt);

        var paged = await q.Select(p => new PermissionDetail
        {
            Id = p.Id,
            Name = p.Name,
            Code = p.Code,
            Description = p.Description,
            MenuId = p.MenuId,
            Action = p.Action,
            Method = p.Method
        }).ToPagedListAsync(request.Page, request.PageSize);
        return Success(paged);
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] Guid id)
    {
        var p = await _db.Q<Permission>().FirstOrDefaultAsync(x => x.Id == id);
        if (p is null) return Failure("Permission not found.", 404);
        var dto = new PermissionDetail { Id = p.Id, Name = p.Name, Code = p.Code, Description = p.Description, MenuId = p.MenuId, Action = p.Action, Method = p.Method };
        return Success(dto);
    }

    [HttpPost]
    public async Task<IActionResult> Upsert([FromBody] PermissionUpsertRequest req)
    {
        if (req == null) return Failure("Invalid request.");
        if (req.Id.HasValue && req.Id != Guid.Empty)
        {
            var ent = await _db.Q<Permission>().FirstOrDefaultAsync(x => x.Id == req.Id.Value);
            if (ent is null) return Failure("Permission not found.", 404);
            if (!string.IsNullOrWhiteSpace(req.Name)) ent.Name = req.Name;
            if (!string.IsNullOrWhiteSpace(req.Code)) ent.Code = req.Code;
            if (!string.IsNullOrWhiteSpace(req.Description)) ent.Description = req.Description;
            if (req.MenuId.HasValue) ent.MenuId = req.MenuId;
            if (!string.IsNullOrWhiteSpace(req.Action)) ent.Action = req.Action;
            if (!string.IsNullOrWhiteSpace(req.Method)) ent.Method = req.Method;

            await _db.UpdateAsync(ent);
            await _db.SaveChangesAsync();
            return Success(new UpsertResponse { Id = ent.Id });
        }

        if (string.IsNullOrWhiteSpace(req.Name)) return Failure("Name required.");
        var np = new Permission { Name = req.Name!, Code = req.Code ?? string.Empty, Description = req.Description ?? string.Empty, MenuId = req.MenuId, Action = req.Action ?? string.Empty, Method = req.Method ?? string.Empty };
        await _db.AddAsync(np);
        await _db.SaveChangesAsync();
        return Success(new UpsertResponse { Id = np.Id });
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] BatchDeleteRequest ids)
    {
        if (ids == null || ids.Ids == null || ids.Ids.Length == 0) return Failure("No ids provided.");
        await _db.RemoveByIdsAsync<Permission>(ids.Ids);
        await _db.SaveChangesAsync();
        return Success();
    }
}
