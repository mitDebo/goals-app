using GoalsApp.Api.Data;
using GoalsApp.Api.IntegrationTests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace GoalsApp.Api.IntegrationTests;

// Proves the in-memory app is wired to the test database and migrations ran.
public class DatabaseSmokeTests(GoalsApiFactory factory) : IClassFixture<GoalsApiFactory>
{
    [Fact]
    public async Task App_reaches_the_test_database_with_migrations_applied()
    {
        var ct = TestContext.Current.CancellationToken;
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<GoalsDbContext>();

        var applied = await db.Database.GetAppliedMigrationsAsync(ct);

        Assert.Contains(applied, id => id.EndsWith("_Init"));
    }
}
