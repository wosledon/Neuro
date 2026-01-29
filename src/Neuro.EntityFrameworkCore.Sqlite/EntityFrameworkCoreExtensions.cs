using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Neuro.EntityFrameworkCore.Sqlite;

public static class EntityFrameworkCoreExtensions
{
    extension(IHostApplicationBuilder builder)
    {
        public void AddSqlite<TDbContext>(Action<SqliteDbContextOptionsBuilder>? sqliteOptionsAction = null)
        where TDbContext : NeuroDbContext
        {
            builder.Services.AddDbContext<TDbContext>(options =>
            {
                options.UseSqlite(sqliteOptionsAction);
            });
        }
    }
}