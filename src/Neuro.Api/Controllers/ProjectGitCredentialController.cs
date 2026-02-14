using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Neuro.Api.Entity;
using Neuro.EntityFrameworkCore.Extensions;
using Neuro.EntityFrameworkCore.Services;
using Neuro.Shared.Dtos;

namespace Neuro.Api.Controllers;

public class ProjectGitCredentialController : ApiControllerBase
{
    private readonly IUnitOfWork _db;
    public ProjectGitCredentialController(IUnitOfWork db) { _db = db; }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] KeywordListRequest request)
    {
        request ??= new KeywordListRequest();
        var q = _db.Q<ProjectGitCredential>().AsNoTracking();

        var paged = await q
            .Join(_db.Q<Project>(), pg => pg.ProjectId, p => p.Id, (pg, p) => new { pg, p })
            .Join(_db.Q<GitCredential>(), x => x.pg.GitCredentialId, g => g.Id, (x, g) => new { x.pg, x.p, g })
            .Select(x => new ProjectGitCredentialDetail
            {
                Id = x.pg.Id,
                ProjectId = x.p.Id,
                ProjectName = x.p.Name,
                GitCredentialId = x.g.Id,
                GitCredentialName = x.g.Name
            })
            .ToPagedListAsync(request.Page, request.PageSize);

        return Success(paged);
    }

    [HttpPost]
    public async Task<IActionResult> Assign([FromBody] ProjectGitCredentialAssignRequest request)
    {
        if (request == null || request.GitCredentialIds == null || request.GitCredentialIds.Length == 0)
            return Failure("GitCredentialIds 不能为空。");

        // 验证项目是否存在
        var project = await _db.Q<Project>().FirstOrDefaultAsync(p => p.Id == request.ProjectId);
        if (project is null) return Failure("项目不存在。", 404);

        // 验证所有 Git Credential 是否存在
        var existingIds = await _db.Q<GitCredential>()
            .Where(g => request.GitCredentialIds.Contains(g.Id))
            .Select(g => g.Id)
            .ToListAsync();

        var invalidIds = request.GitCredentialIds.Except(existingIds).ToArray();
        if (invalidIds.Length > 0)
            return Failure($"以下 Git Credential 不存在: {string.Join(", ", invalidIds)}");

        // 获取项目当前已有的 Git Credential
        var existing = await _db.Q<ProjectGitCredential>()
            .Where(pg => pg.ProjectId == request.ProjectId)
            .ToListAsync();

        var existingIdSet = existing.Select(pg => pg.GitCredentialId).ToHashSet();
        var requestedIdSet = request.GitCredentialIds.ToHashSet();

        // 需要添加的
        var toAdd = request.GitCredentialIds.Where(id => !existingIdSet.Contains(id)).ToList();
        // 需要删除的
        var toRemove = existing.Where(pg => !requestedIdSet.Contains(pg.GitCredentialId)).ToList();

        foreach (var id in toAdd)
        {
            await _db.AddAsync(new ProjectGitCredential { ProjectId = request.ProjectId, GitCredentialId = id });
        }

        foreach (var pg in toRemove)
        {
            await _db.RemoveAsync(pg);
        }

        await _db.SaveChangesAsync();
        return Success(new { Added = toAdd.Count, Removed = toRemove.Count });
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] BatchDeleteRequest ids)
    {
        if (ids == null || ids.Ids == null || ids.Ids.Length == 0)
            return Failure("No ids provided.");

        await _db.RemoveByIdsAsync<ProjectGitCredential>(ids.Ids);
        await _db.SaveChangesAsync();
        return Success();
    }
}
