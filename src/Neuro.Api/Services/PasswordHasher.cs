using System;
using System.Security.Cryptography;

namespace Neuro.Api.Services;

public static class PasswordHasher
{
    // Format: iterations.saltBase64.hashBase64
    public static string Hash(string password, int iterations = 100_000)
    {
        ArgumentNullException.ThrowIfNull(password);

        var salt = RandomNumberGenerator.GetBytes(16);
        var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, HashAlgorithmName.SHA256, 32);
        return $"{iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }

    public static bool Verify(string password, string hashed)
    {
        try
        {
            if (string.IsNullOrEmpty(hashed) || string.IsNullOrEmpty(password)) return false;
            var parts = hashed.Split('.', 3);
            if (parts.Length != 3) return false;
            var iterations = int.Parse(parts[0]);
            var salt = Convert.FromBase64String(parts[1]);
            var expected = Convert.FromBase64String(parts[2]);

            var actual = Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, HashAlgorithmName.SHA256, expected.Length);
            return CryptographicOperations.FixedTimeEquals(actual, expected);
        }
        catch
        {
            return false;
        }
    }
}