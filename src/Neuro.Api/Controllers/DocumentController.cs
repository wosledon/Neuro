using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Neuro.Api.Entity;
using Neuro.EntityFrameworkCore.Extensions;
using Neuro.EntityFrameworkCore.Services;
using Neuro.Shared.Dtos;

namespace Neuro.Api.Controllers;

public class DocumentController : ApiControllerBase
{
    private readonly IUnitOfWork _db;
    public DocumentController(IUnitOfWork db) { _db = db; }

    [HttpGet]
    public async Task<IActionResult> List([FromBody] DocumentListRequest request)
    {
        request ??= new DocumentListRequest();
        var q = _db.Q<Document>().AsNoTracking()
            .WhereNotNullOrWhiteSpace(request.Keyword, (src, k) => src.Where(d => EF.Functions.Like(d.Title, $"%{k}%")))
            .OrderByDescending(d => d.CreatedAt);

        var paged = await q.Select(d => new DocumentDetail
        {
            Id = d.Id,
            ProjectId = d.ProjectId,
            Title = d.Title,
            Content = d.Content,
            ParentId = d.ParentId,
            Sort = d.Sort
        }).ToPagedListAsync(request.Page, request.PageSize);
        return Success(paged);
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] Guid id)
    {
        var d = await _db.Q<Document>().FirstOrDefaultAsync(x => x.Id == id);
        if (d is null) return Failure("Document not found.", 404);
        var dto = new DocumentDetail { Id = d.Id, ProjectId = d.ProjectId, Title = d.Title, Content = d.Content, ParentId = d.ParentId, Sort = d.Sort };
        return Success(dto);
    }

    [HttpPost]
    public async Task<IActionResult> Upsert([FromBody] DocumentUpsertRequest req)
    {
        if (req == null) return Failure("Invalid request.");
        if (req.Id.HasValue && req.Id != Guid.Empty)
        {
            var ent = await _db.Q<Document>().FirstOrDefaultAsync(x => x.Id == req.Id.Value);
            if (ent is null) return Failure("Document not found.", 404);
            if (req.ProjectId.HasValue) ent.ProjectId = req.ProjectId.Value;
            if (!string.IsNullOrWhiteSpace(req.Title)) ent.Title = req.Title;
            if (!string.IsNullOrWhiteSpace(req.Content)) ent.Content = req.Content;
            if (req.ParentId.HasValue) ent.ParentId = req.ParentId;
            if (req.Sort.HasValue) ent.Sort = req.Sort.Value;

            await _db.UpdateAsync(ent);
            await _db.SaveChangesAsync();
            return Success(new UpsertResponse { Id = ent.Id });
        }

        if (!req.ProjectId.HasValue || string.IsNullOrWhiteSpace(req.Title)) return Failure("ProjectId and Title required.");
        var nd = new Document { ProjectId = req.ProjectId.Value, Title = req.Title!, Content = req.Content ?? string.Empty, ParentId = req.ParentId, Sort = req.Sort ?? 0 };
        await _db.AddAsync(nd);
        await _db.SaveChangesAsync();
        return Success(new UpsertResponse { Id = nd.Id });
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] BatchDeleteRequest ids)
    {
        if (ids == null || ids.Ids == null || ids.Ids.Length == 0) return Failure("No ids provided.");
        await _db.RemoveByIdsAsync<Document>(ids.Ids);
        await _db.SaveChangesAsync();
        return Success();
    }
}
