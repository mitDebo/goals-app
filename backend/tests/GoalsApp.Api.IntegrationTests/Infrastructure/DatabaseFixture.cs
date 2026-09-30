using GoalsApp.Api.Core.Auth;
using GoalsApp.Api.Data;
using GoalsApp.Api.Data.Interceptors;
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

    // A context acting as the given user (or as nobody), wired like the app's.
    public static GoalsDbContext CreateDbContext(ICurrentUser? currentUser = null, TimeProvider? clock = null)
    {
        var user = currentUser ?? NoCurrentUser.Instance;
        var options = new DbContextOptionsBuilder<GoalsDbContext>()
            .UseNpgsql(ConnectionString, GoalsDbContext.ConfigureNpgsql)
            .AddInterceptors(new OwnershipInterceptor(user, clock ?? TimeProvider.System))
            .Options;
        return new GoalsDbContext(options, user);
    }

    public async ValueTask DisposeAsync() => await _container.DisposeAsync();
}
