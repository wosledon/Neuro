using System.Collections.Generic;
using Neuro.Api.Entity;

namespace Neuro.Api.Services;

public interface IJwtService
{
    string GenerateAccessToken(User user);
    (string token, System.DateTime expiresAt) GenerateRefreshToken();
}