using GoalsApp.Api.Data;
using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;

[assembly: AssemblyFixture(typeof(GoalsApp.Api.IntegrationTests.Infrastructure.DatabaseFixture))]

namespace GoalsApp.Api.IntegrationTests.Infrastructure;

// One throwaway Postgres (in Docker) for the whole test run, with all EF
// migrations applied. Same major version as the Supabase project.
public sealed class DatabaseFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder("postgres:17-alpine").Build();

    // Read by GoalsApiFactory; set once the container is up.
    public static string ConnectionString { get; private set; } = "";

    public async ValueTask InitializeAsync()
    {
        await _container.StartAsync();
        ConnectionString = _container.GetConnectionString();

        await using var db = CreateDbContext();
        await db.Database.MigrateAsync();
    }

    public static GoalsDbContext CreateDbContext() =>
        new(new DbContextOptionsBuilder<GoalsDbContext>()
            .UseNpgsql(ConnectionString, GoalsDbContext.ConfigureNpgsql)
            .Options);

    public async ValueTask DisposeAsync() => await _container.DisposeAsync();
}
