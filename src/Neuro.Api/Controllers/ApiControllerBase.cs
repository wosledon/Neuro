using System;
using System.Net;
using Microsoft.AspNetCore.Mvc;
using Neuro.Shared;

namespace Neuro.Api.Controllers;

[ApiController]
[Route("api/[controller]/[action]")]
public class ApiControllerBase : ControllerBase
{
    private Guid? _userId;

    public Guid UserId
    {
        get
        {
            if (_userId.HasValue) return _userId.Value;

            var userIdClaim = User.FindFirst("user_id")?.Value;
            if (userIdClaim is null)
            {
                throw new UnauthorizedAccessException("User is not authenticated.");
            }

            _userId = Guid.Parse(userIdClaim);
            return _userId.Value;
        }
    }


    [NonAction]
    public IActionResult Success(object? data = null)
    {
        return Ok(NeuroResult.Success(data));
    }

    [NonAction]
    public IActionResult Failure(string message, int code = 400)
    {
        return BadRequest(NeuroResult.Failure(message, (HttpStatusCode)code));
    }
}
