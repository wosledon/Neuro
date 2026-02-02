using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Neuro.Api.Controllers;

[Authorize(Policy = "SuperOnly")]
public class AdminController : ApiControllerBase
{
    [HttpGet]
    public IActionResult Ping()
    {
        return Success(new { message = "pong from admin" });
    }
}