using System;
using Neuro.Api.Services;
using Xunit;

namespace Neuro.Api.Tests;

public class PasswordHasherTests
{
    [Fact]
    public void HashAndVerify_Works()
    {
        var password = "P@ssw0rd!";
        var hashed = PasswordHasher.Hash(password);
        Assert.False(string.IsNullOrEmpty(hashed));
        Assert.True(PasswordHasher.Verify(password, hashed));
        Assert.False(PasswordHasher.Verify("wrong", hashed));
    }

    [Fact]
    public void HashFormat_IsCorrect()
    {
        var hashed = PasswordHasher.Hash("abc");
        var parts = hashed.Split('.', 3);
        Assert.Equal(3, parts.Length);
        var iterations = int.Parse(parts[0]);
        Assert.True(iterations >= 1);
        Assert.False(string.IsNullOrEmpty(parts[1]));
        Assert.False(string.IsNullOrEmpty(parts[2]));
    }
}