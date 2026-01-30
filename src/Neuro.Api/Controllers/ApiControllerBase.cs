using System;
using System.Net;
using Microsoft.AspNetCore.Mvc;
using Neuro.Shared;

namespace Neuro.Api.Controllers;

[ApiController]
[Route("api/[controller]/[action]")]
public class ApiControllerBase : ControllerBase
{
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
