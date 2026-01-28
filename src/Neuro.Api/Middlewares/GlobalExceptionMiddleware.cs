using System;

namespace Neuro.Api.Middlewares;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    public GlobalExceptionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            context.Response.StatusCode = 500;
            context.Response.ContentType = "application/json";

            var response = new
            {
                Message = "An unexpected error occurred.",
                Details = ex.Message
            };

            var json = System.Text.Json.JsonSerializer.Serialize(response);
            await context.Response.WriteAsync(json);
        }
    }
}
