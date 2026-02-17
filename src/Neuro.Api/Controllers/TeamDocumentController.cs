using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Neuro.Api.Entity;
using DocumentEntity = Neuro.Api.Entity.MyDocument;
using Neuro.EntityFrameworkCore.Extensions;
using Neuro.EntityFrameworkCore.Services;
using Neuro.Shared.Dtos;

namespace Neuro.Api.Controllers;

public class TeamDocumentController : ApiControllerBase
{
    private readonly IUnitOfWork _db;
    public TeamDocumentController(IUnitOfWork db) { _db = db; }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] TeamDocumentListRequest request)
    {
        request ??= new TeamDocumentListRequest();
        var q = _db.Q<TeamDocument>().AsNoTracking();

        if (request.TeamId.HasValue)
            q = q.Where(td => td.TeamId == request.TeamId.Value);
        if (request.DocumentId.HasValue)
            q = q.Where(td => td.DocumentId == request.DocumentId.Value);

        var paged = await q
            .Join(_db.Q<Team>(), td => td.TeamId, t => t.Id, (td, t) => new { td, t })
            .Join(_db.Q<DocumentEntity>(), x => x.td.DocumentId, d => d.Id, (x, d) => new { x.td, x.t, d })
            .Select(x => new TeamDocumentDetail
            {
                Id = x.td.Id,
                TeamId = x.t.Id,
                TeamName = x.t.Name,
                DocumentId = x.d.Id,
                DocumentTitle = x.d.Title
            })
            .ToPagedListAsync(request.Page, request.PageSize);

        return Success(paged);
    }

    [HttpPost]
    public async Task<IActionResult> Assign([FromBody] TeamDocumentAssignRequest request)
    {
        if (request == null || request.DocumentIds == null || request.DocumentIds.Length == 0)
            return Failure("DocumentIds 不能为空。");

        // 验证团队是否存在
        var team = await _db.Q<Team>().FirstOrDefaultAsync(t => t.Id == request.TeamId);
        if (team is null) return Failure("团队不存在。", 404);

        // 验证所有文档是否存在
        var existingDocumentIds = await _db.Q<DocumentEntity>()
            .Where(d => request.DocumentIds.Contains(d.Id))
            .Select(d => d.Id)
            .ToListAsync();

        var invalidDocumentIds = request.DocumentIds.Except(existingDocumentIds).ToArray();
        if (invalidDocumentIds.Length > 0)
            return Failure($"以下文档不存在: {string.Join(", ", invalidDocumentIds)}");

        // 获取团队当前已有的文档
        var existingTeamDocuments = await _db.Q<TeamDocument>()
            .Where(td => td.TeamId == request.TeamId)
            .ToListAsync();

        var existingDocumentIdSet = existingTeamDocuments.Select(td => td.DocumentId).ToHashSet();
        var requestedDocumentIdSet = request.DocumentIds.ToHashSet();

        // 需要添加的文档
        var toAdd = request.DocumentIds.Where(did => !existingDocumentIdSet.Contains(did)).ToList();
        // 需要删除的文档
        var toRemove = existingTeamDocuments.Where(td => !requestedDocumentIdSet.Contains(td.DocumentId)).ToList();

        foreach (var documentId in toAdd)
        {
            await _db.AddAsync(new TeamDocument { TeamId = request.TeamId, DocumentId = documentId });
        }

        foreach (var td in toRemove)
        {
            await _db.RemoveAsync(td);
        }

        await _db.SaveChangesAsync();
        return Success(new { Added = toAdd.Count, Removed = toRemove.Count });
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] BatchDeleteRequest ids)
    {
        if (ids == null || ids.Ids == null || ids.Ids.Length == 0)
            return Failure("No ids provided.");

        await _db.RemoveByIdsAsync<TeamDocument>(ids.Ids);
        await _db.SaveChangesAsync();
        return Success();
    }
}
