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

builder.AddSqlite<NeuroDbContext>("Data Source=neuro.db", o =>
{

});

var app = builder.Build();

app.AutoInitDatabase<NeuroDbContext>(false);

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    app.MapScalarApiReference();
}

app.UseMiddleware<GlobalExceptionMiddleware>();

// app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
