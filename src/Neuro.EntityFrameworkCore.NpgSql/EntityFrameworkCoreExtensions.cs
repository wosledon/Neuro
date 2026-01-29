using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Npgsql.EntityFrameworkCore.PostgreSQL.Infrastructure;

namespace Neuro.EntityFrameworkCore.NpgSql;

public static class EntityFrameworkCoreExtensions
{
    extension(IHostApplicationBuilder builder)
    {
        public void AddNpgSql<TDbContext>(Action<NpgsqlDbContextOptionsBuilder>? npgsqlOptionsAction = null)
        where TDbContext : NeuroDbContext
        {
            builder.Services.AddDbContext<TDbContext>(options =>
            {
                options.UseNpgsql(npgsqlOptionsAction);
            });
        }
    }
}
