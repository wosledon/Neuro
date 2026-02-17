using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Neuro.Api.Entity;
using DocumentEntity = Neuro.Api.Entity.MyDocument;
using Neuro.EntityFrameworkCore.Extensions;
using Neuro.EntityFrameworkCore.Services;
using Neuro.Shared.Dtos;

namespace Neuro.Api.Controllers;

public class UserDocumentController : ApiControllerBase
{
    private readonly IUnitOfWork _db;
    public UserDocumentController(IUnitOfWork db) { _db = db; }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] UserDocumentListRequest request)
    {
        request ??= new UserDocumentListRequest();
        var q = _db.Q<UserDocument>().AsNoTracking();

        if (request.UserId.HasValue)
            q = q.Where(ud => ud.UserId == request.UserId.Value);
        if (request.DocumentId.HasValue)
            q = q.Where(ud => ud.DocumentId == request.DocumentId.Value);

        var paged = await q
            .Join(_db.Q<User>(), ud => ud.UserId, u => u.Id, (ud, u) => new { ud, u })
            .Join(_db.Q<DocumentEntity>(), x => x.ud.DocumentId, d => d.Id, (x, d) => new { x.ud, x.u, d })
            .Select(x => new UserDocumentDetail
            {
                Id = x.ud.Id,
                UserId = x.u.Id,
                UserName = x.u.Name,
                DocumentId = x.d.Id,
                DocumentTitle = x.d.Title
            })
            .ToPagedListAsync(request.Page, request.PageSize);

        return Success(paged);
    }

    [HttpPost]
    public async Task<IActionResult> Assign([FromBody] UserDocumentAssignRequest request)
    {
        if (request == null || request.DocumentIds == null || request.DocumentIds.Length == 0)
            return Failure("DocumentIds 不能为空。");

        // 验证用户是否存在
        var user = await _db.Q<User>().FirstOrDefaultAsync(u => u.Id == request.UserId);
        if (user is null) return Failure("用户不存在。", 404);

        // 验证所有文档是否存在
        var existingDocumentIds = await _db.Q<DocumentEntity>()
            .Where(d => request.DocumentIds.Contains(d.Id))
            .Select(d => d.Id)
            .ToListAsync();

        var invalidDocumentIds = request.DocumentIds.Except(existingDocumentIds).ToArray();
        if (invalidDocumentIds.Length > 0)
            return Failure($"以下文档不存在: {string.Join(", ", invalidDocumentIds)}");

        // 获取用户当前已有的文档
        var existingUserDocuments = await _db.Q<UserDocument>()
            .Where(ud => ud.UserId == request.UserId)
            .ToListAsync();

        var existingDocumentIdSet = existingUserDocuments.Select(ud => ud.DocumentId).ToHashSet();
        var requestedDocumentIdSet = request.DocumentIds.ToHashSet();

        // 需要添加的文档
        var toAdd = request.DocumentIds.Where(did => !existingDocumentIdSet.Contains(did)).ToList();
        // 需要删除的文档
        var toRemove = existingUserDocuments.Where(ud => !requestedDocumentIdSet.Contains(ud.DocumentId)).ToList();

        foreach (var documentId in toAdd)
        {
            await _db.AddAsync(new UserDocument { UserId = request.UserId, DocumentId = documentId });
        }

        foreach (var ud in toRemove)
        {
            await _db.RemoveAsync(ud);
        }

        await _db.SaveChangesAsync();
        return Success(new { Added = toAdd.Count, Removed = toRemove.Count });
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] BatchDeleteRequest ids)
    {
        if (ids == null || ids.Ids == null || ids.Ids.Length == 0)
            return Failure("No ids provided.");

        await _db.RemoveByIdsAsync<UserDocument>(ids.Ids);
        await _db.SaveChangesAsync();
        return Success();
    }
}
