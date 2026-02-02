using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Neuro.Api.Entity;

namespace Neuro.Api.Services;

public class JwtService : IJwtService
{
    private readonly IConfiguration _config;

    public JwtService(IConfiguration config)
    {
        _config = config;
    }

    public string GenerateAccessToken(User user)
    {
        var jwt = _config.GetSection("Jwt");
        var key = jwt["Key"] ?? throw new InvalidOperationException("Jwt:Key is not configured");
        var issuer = jwt["Issuer"] ?? "neuro";
        var audience = jwt["Audience"] ?? "neuro";
        var minutes = int.TryParse(jwt["ExpiryMinutes"], out var m) ? m : 60;

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, string.IsNullOrEmpty(user.Name) ? user.Account : user.Name),
            new Claim("is_super", user.IsSuper.ToString())
        };

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var creds = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer,
            audience,
            claims,
            expires: DateTime.UtcNow.AddMinutes(minutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public (string token, DateTime expiresAt) GenerateRefreshToken()
    {
        var jwt = _config.GetSection("Jwt");
        var days = int.TryParse(jwt["RefreshTokenExpiryDays"], out var d) ? d : 30;

        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        var token = Convert.ToBase64String(randomBytes);
        return (token, DateTime.UtcNow.AddDays(days));
    }
}