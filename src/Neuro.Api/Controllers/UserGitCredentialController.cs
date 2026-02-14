using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Neuro.Api.Entity;
using Neuro.EntityFrameworkCore.Extensions;
using Neuro.EntityFrameworkCore.Services;
using Neuro.Shared.Dtos;

namespace Neuro.Api.Controllers;

public class UserGitCredentialController : ApiControllerBase
{
    private readonly IUnitOfWork _db;
    public UserGitCredentialController(IUnitOfWork db) { _db = db; }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] KeywordListRequest request)
    {
        request ??= new KeywordListRequest();
        var q = _db.Q<UserGitCredential>().AsNoTracking();

        var paged = await q
            .Join(_db.Q<User>(), ug => ug.UserId, u => u.Id, (ug, u) => new { ug, u })
            .Join(_db.Q<GitCredential>(), x => x.ug.GitCredentialId, g => g.Id, (x, g) => new { x.ug, x.u, g })
            .Select(x => new UserGitCredentialDetail
            {
                Id = x.ug.Id,
                UserId = x.u.Id,
                UserName = x.u.Name,
                GitCredentialId = x.g.Id,
                GitCredentialName = x.g.Name
            })
            .ToPagedListAsync(request.Page, request.PageSize);

        return Success(paged);
    }

    [HttpPost]
    public async Task<IActionResult> Assign([FromBody] UserGitCredentialAssignRequest request)
    {
        if (request == null || request.GitCredentialIds == null || request.GitCredentialIds.Length == 0)
            return Failure("GitCredentialIds 不能为空。");

        // 验证用户是否存在
        var user = await _db.Q<User>().FirstOrDefaultAsync(u => u.Id == request.UserId);
        if (user is null) return Failure("用户不存在。", 404);

        // 验证所有 Git Credential 是否存在
        var existingIds = await _db.Q<GitCredential>()
            .Where(g => request.GitCredentialIds.Contains(g.Id))
            .Select(g => g.Id)
            .ToListAsync();

        var invalidIds = request.GitCredentialIds.Except(existingIds).ToArray();
        if (invalidIds.Length > 0)
            return Failure($"以下 Git Credential 不存在: {string.Join(", ", invalidIds)}");

        // 获取用户当前已有的 Git Credential
        var existing = await _db.Q<UserGitCredential>()
            .Where(ug => ug.UserId == request.UserId)
            .ToListAsync();

        var existingIdSet = existing.Select(ug => ug.GitCredentialId).ToHashSet();
        var requestedIdSet = request.GitCredentialIds.ToHashSet();

        // 需要添加的
        var toAdd = request.GitCredentialIds.Where(id => !existingIdSet.Contains(id)).ToList();
        // 需要删除的
        var toRemove = existing.Where(ug => !requestedIdSet.Contains(ug.GitCredentialId)).ToList();

        foreach (var id in toAdd)
        {
            await _db.AddAsync(new UserGitCredential { UserId = request.UserId, GitCredentialId = id });
        }

        foreach (var ug in toRemove)
        {
            await _db.RemoveAsync(ug);
        }

        await _db.SaveChangesAsync();
        return Success(new { Added = toAdd.Count, Removed = toRemove.Count });
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] BatchDeleteRequest ids)
    {
        if (ids == null || ids.Ids == null || ids.Ids.Length == 0)
            return Failure("No ids provided.");

        await _db.RemoveByIdsAsync<UserGitCredential>(ids.Ids);
        await _db.SaveChangesAsync();
        return Success();
    }
}
