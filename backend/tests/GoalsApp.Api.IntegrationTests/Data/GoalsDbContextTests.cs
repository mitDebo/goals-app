using GoalsApp.Api.Data;
using GoalsApp.Api.Data.Entities;
using GoalsApp.Api.IntegrationTests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace GoalsApp.Api.IntegrationTests.Data;

public class GoalsDbContextTests(GoalsApiFactory factory) : IClassFixture<GoalsApiFactory>
{
    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    private static GoalsDbContext As(Guid? userId) =>
        DatabaseFixture.CreateDbContext(new TestCurrentUser(userId));

    private static async Task CreateProfile(Guid owner)
    {
        await using var db = As(owner);
        db.Profiles.Add(new Profile { UserId = owner, TimeZone = "America/Chicago" });
        await db.SaveChangesAsync(Ct);
    }

    // Proves the in-memory app is wired to the test database and migrations ran.
    [Fact]
    public async Task App_reaches_the_test_database_with_migrations_applied()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<GoalsDbContext>();

        var applied = await db.Database.GetAppliedMigrationsAsync(Ct);

        Assert.Contains(applied, id => id.EndsWith("_Init"));
    }

    // Spec: access-control / "Owner-only data access": every owned table is
    // filtered to the current user's rows by the context's query filter.
    [Fact]
    public async Task Users_only_see_their_own_rows()
    {
        var userA = Guid.NewGuid();
        var userB = Guid.NewGuid();
        await CreateProfile(userA);
        await CreateProfile(userB);

        await using var asA = As(userA);
        await using var asB = As(userB);
        Assert.Equal([userA], await asA.Profiles.Select(p => p.UserId).ToListAsync(Ct));
        Assert.Equal([userB], await asB.Profiles.Select(p => p.UserId).ToListAsync(Ct));
    }

    [Fact]
    public async Task Nobody_signed_in_sees_nothing()
    {
        await CreateProfile(Guid.NewGuid());

        await using var anonymous = As(null);
        Assert.False(await anonymous.Profiles.AnyAsync(Ct));
    }
}
