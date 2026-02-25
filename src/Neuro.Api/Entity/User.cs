using System;
using Neuro.Abstractions.Entity;

namespace Neuro.Api.Entity;

public class User : EntityBase
{
    public string Account { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;

    public string Avatar { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public bool IsSuper { get; set; } = false;
}
