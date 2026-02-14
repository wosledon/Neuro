using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Neuro.Api.Entity;
using Neuro.EntityFrameworkCore.Extensions;
using Neuro.EntityFrameworkCore.Services;
using Neuro.Shared.Dtos;

namespace Neuro.Api.Controllers;

public class RoleDocumentController : ApiControllerBase
{
    private readonly IUnitOfWork _db;
    public RoleDocumentController(IUnitOfWork db) { _db = db; }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] RoleDocumentListRequest request)
    {
        request ??= new RoleDocumentListRequest();
        var q = _db.Q<RoleDocument>().AsNoTracking();

        if (request.RoleId.HasValue)
            q = q.Where(rd => rd.RoleId == request.RoleId.Value);
        if (request.DocumentId.HasValue)
            q = q.Where(rd => rd.DocumentId == request.DocumentId.Value);

        var paged = await q
            .Join(_db.Q<Role>(), rd => rd.RoleId, r => r.Id, (rd, r) => new { rd, r })
            .Join(_db.Q<Document>(), x => x.rd.DocumentId, d => d.Id, (x, d) => new { x.rd, x.r, d })
            .Select(x => new RoleDocumentDetail
            {
                Id = x.rd.Id,
                RoleId = x.r.Id,
                RoleName = x.r.Name,
                DocumentId = x.d.Id,
                DocumentTitle = x.d.Title
            })
            .ToPagedListAsync(request.Page, request.PageSize);

        return Success(paged);
    }

    [HttpPost]
    public async Task<IActionResult> Assign([FromBody] RoleDocumentAssignRequest request)
    {
        if (request == null || request.DocumentIds == null || request.DocumentIds.Length == 0)
            return Failure("DocumentIds 不能为空。");

        // 验证角色是否存在
        var role = await _db.Q<Role>().FirstOrDefaultAsync(r => r.Id == request.RoleId);
        if (role is null) return Failure("角色不存在。", 404);

        // 验证所有文档是否存在
        var existingDocumentIds = await _db.Q<Document>()
            .Where(d => request.DocumentIds.Contains(d.Id))
            .Select(d => d.Id)
            .ToListAsync();

        var invalidDocumentIds = request.DocumentIds.Except(existingDocumentIds).ToArray();
        if (invalidDocumentIds.Length > 0)
            return Failure($"以下文档不存在: {string.Join(", ", invalidDocumentIds)}");

        // 获取角色当前已有的文档
        var existingRoleDocuments = await _db.Q<RoleDocument>()
            .Where(rd => rd.RoleId == request.RoleId)
            .ToListAsync();

        var existingDocumentIdSet = existingRoleDocuments.Select(rd => rd.DocumentId).ToHashSet();
        var requestedDocumentIdSet = request.DocumentIds.ToHashSet();

        // 需要添加的文档
        var toAdd = request.DocumentIds.Where(did => !existingDocumentIdSet.Contains(did)).ToList();
        // 需要删除的文档
        var toRemove = existingRoleDocuments.Where(rd => !requestedDocumentIdSet.Contains(rd.DocumentId)).ToList();

        foreach (var documentId in toAdd)
        {
            await _db.AddAsync(new RoleDocument { RoleId = request.RoleId, DocumentId = documentId });
        }

        foreach (var rd in toRemove)
        {
            await _db.RemoveAsync(rd);
        }

        await _db.SaveChangesAsync();
        return Success(new { Added = toAdd.Count, Removed = toRemove.Count });
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] BatchDeleteRequest ids)
    {
        if (ids == null || ids.Ids == null || ids.Ids.Length == 0)
            return Failure("No ids provided.");

        await _db.RemoveByIdsAsync<RoleDocument>(ids.Ids);
        await _db.SaveChangesAsync();
        return Success();
    }
}
