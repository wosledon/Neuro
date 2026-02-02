using System;

namespace Neuro.Shared.Dtos;

public record RegisterRequest
{
    public required string Account { get; init; }
    public required string Password { get; init; }
    public string? Name { get; init; }
    public string? Email { get; init; }
}
