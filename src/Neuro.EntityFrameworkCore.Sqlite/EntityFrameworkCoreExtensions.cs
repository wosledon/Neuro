using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Neuro.EntityFrameworkCore.Services;

namespace Neuro.EntityFrameworkCore.Sqlite;

public static class EntityFrameworkCoreExtensions
{
    extension(IHostApplicationBuilder builder)
    {
        public void AddSqlite<TDbContext>(string connectionString, Action<SqliteDbContextOptionsBuilder>? sqliteOptionsAction = null)
        where TDbContext : NeuroDbContext
        {
            ArgumentException.ThrowIfNullOrWhiteSpace(connectionString);

            builder.Services.AddScoped<IUnitOfWork, UnitOfWork<TDbContext>>();

            builder.Services.AddDbContext<TDbContext>(options =>
            {
                options.UseSqlite(connectionString, sqliteOptionsAction);
            });
        }
    }
}