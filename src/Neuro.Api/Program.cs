using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Neuro.Abstractions.Services;
using Neuro.Api.Middlewares;
using Neuro.Api.Services;
using Neuro.EntityFrameworkCore;
using Neuro.EntityFrameworkCore.Extensions;
using Neuro.EntityFrameworkCore.Sqlite;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();


// Current user service for auditing
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

// Auth services
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IPermissionService, PermissionService>();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});


// JWT Authentication
var jwt = builder.Configuration.GetSection("Jwt");
var secret = jwt["Key"] ?? "replace-with-secret-for-dev";
var key = Encoding.UTF8.GetBytes(secret);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwt["Issuer"] ?? "neuro",
        ValidateAudience = true,
        ValidAudience = jwt["Audience"] ?? "neuro",
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromSeconds(30)
    };
});

// Policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("SuperOnly", p => p.RequireClaim("is_super", "True"));
});

builder.AddSqlite<NeuroDbContext>("Data Source=neuro.db", o =>
{

});

var app = builder.Build();

// app.AutoInitDatabase<NeuroDbContext>(false);

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    app.MapScalarApiReference();
}

app.UseMiddleware<GlobalExceptionMiddleware>();

// app.UseHttpsRedirection();
app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
