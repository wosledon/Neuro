using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Neuro.Api.Entity;
using Neuro.EntityFrameworkCore.Extensions;
using Neuro.EntityFrameworkCore.Services;
using Neuro.Shared.Dtos;

namespace Neuro.Api.Controllers;

public class FileResourceController : ApiControllerBase
{
    private readonly IUnitOfWork _db;
    public FileResourceController(IUnitOfWork db) { _db = db; }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] FileResourceListRequest request)
    {
        request ??= new FileResourceListRequest();
        var q = _db.Q<FileResource>().AsNoTracking()
            .WhereNotNullOrWhiteSpace(request.Keyword, (src, k) => src.Where(f => EF.Functions.Like(f.Name, $"%{k}%")))
            .OrderByDescending(f => f.CreatedAt);

        var paged = await q.Select(f => new FileResourceDetail
        {
            Id = f.Id,
            Name = f.Name,
            Location = f.Location,
            Description = f.Description,
            IsEnabled = f.IsEnabled
        }).ToPagedListAsync(request.Page, request.PageSize);
        return Success(paged);
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] Guid id)
    {
        var f = await _db.Q<FileResource>().FirstOrDefaultAsync(x => x.Id == id);
        if (f is null) return Failure("FileResource not found.", 404);
        var dto = new FileResourceDetail { Id = f.Id, Name = f.Name, Location = f.Location, Description = f.Description, IsEnabled = f.IsEnabled };
        return Success(dto);
    }

    [HttpPost]
    public async Task<IActionResult> Upsert([FromBody] FileResourceUpsertRequest req)
    {
        if (req == null) return Failure("Invalid request.");
        if (req.Id.HasValue && req.Id != Guid.Empty)
        {
            var ent = await _db.Q<FileResource>().FirstOrDefaultAsync(x => x.Id == req.Id.Value);
            if (ent is null) return Failure("FileResource not found.", 404);
            if (!string.IsNullOrWhiteSpace(req.Name)) ent.Name = req.Name;
            if (!string.IsNullOrWhiteSpace(req.Location)) ent.Location = req.Location;
            if (!string.IsNullOrWhiteSpace(req.Description)) ent.Description = req.Description;
            if (req.IsEnabled.HasValue) ent.IsEnabled = req.IsEnabled.Value;

            await _db.UpdateAsync(ent);
            await _db.SaveChangesAsync();
            return Success(new UpsertResponse { Id = ent.Id });
        }

        if (string.IsNullOrWhiteSpace(req.Name) || string.IsNullOrWhiteSpace(req.Location)) return Failure("Name and Location required.");
        var nf = new FileResource { Name = req.Name!, Location = req.Location!, Description = req.Description ?? string.Empty, IsEnabled = req.IsEnabled ?? true };
        await _db.AddAsync(nf);
        await _db.SaveChangesAsync();
        return Success(new UpsertResponse { Id = nf.Id });
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] BatchDeleteRequest ids)
    {
        if (ids == null || ids.Ids == null || ids.Ids.Length == 0) return Failure("No ids provided.");
        await _db.RemoveByIdsAsync<FileResource>(ids.Ids);
        await _db.SaveChangesAsync();
        return Success();
    }
}
