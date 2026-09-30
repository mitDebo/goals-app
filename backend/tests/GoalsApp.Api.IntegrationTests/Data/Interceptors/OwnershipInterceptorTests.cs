using GoalsApp.Api.Data;
using GoalsApp.Api.Data.Entities;
using GoalsApp.Api.Data.Exceptions;
using GoalsApp.Api.IntegrationTests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Time.Testing;

namespace GoalsApp.Api.IntegrationTests.Data.Interceptors;

// Spec: access-control / "Owner-only data access", against the real test database.
// Every owned row is stamped with its owner and timestamps on save, and refused
// if it belongs to someone else. (The read side is in GoalsDbContextTests.)
public class OwnershipInterceptorTests
{
    private static readonly DateTimeOffset T0 = new(2026, 5, 1, 12, 0, 0, TimeSpan.Zero);
    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    private static GoalsDbContext As(Guid? userId, TimeProvider? clock = null) =>
        DatabaseFixture.CreateDbContext(new TestCurrentUser(userId), clock);

    [Fact]
    public async Task New_rows_are_stamped_with_the_current_user_and_timestamps()
    {
        var userA = Guid.NewGuid();
        await using (var db = As(userA, new FakeTimeProvider(T0)))
        {
            db.Profiles.Add(new Profile { TimeZone = "America/Chicago" }); // UserId left empty
            await db.SaveChangesAsync(Ct);
        }

        await using var check = As(userA);
        var saved = await check.Profiles.SingleOrDefaultAsync(p => p.UserId == userA, Ct);
        Assert.NotNull(saved);
        Assert.Equal(T0, saved.CreatedAt);
        Assert.Equal(T0, saved.UpdatedAt);
    }

    [Fact]
    public async Task Updating_bumps_updated_at_but_keeps_created_at()
    {
        var userA = Guid.NewGuid();
        var clock = new FakeTimeProvider(T0);
        await using (var db = As(userA, clock))
        {
            db.Profiles.Add(new Profile { UserId = userA, TimeZone = "America/Chicago" });
            await db.SaveChangesAsync(Ct);
        }

        clock.Advance(TimeSpan.FromHours(1));
        await using (var db = As(userA, clock))
        {
            var profile = await db.Profiles.SingleAsync(p => p.UserId == userA, Ct);
            profile.TimeZone = "Europe/London";
            await db.SaveChangesAsync(Ct);
        }

        await using var check = As(userA);
        var saved = await check.Profiles.SingleAsync(p => p.UserId == userA, Ct);
        Assert.Equal(T0, saved.CreatedAt);
        Assert.Equal(T0.AddHours(1), saved.UpdatedAt);
    }

    [Fact]
    public async Task Saving_a_row_owned_by_someone_else_is_refused()
    {
        var userA = Guid.NewGuid();
        var userB = Guid.NewGuid();

        await using (var db = As(userA))
        {
            db.Profiles.Add(new Profile { UserId = userB, TimeZone = "America/Chicago" });
            await Assert.ThrowsAsync<OwnershipViolationException>(() => db.SaveChangesAsync(Ct));
        }

        await using var asB = As(userB);
        Assert.False(await asB.Profiles.AnyAsync(Ct));
    }

    [Fact]
    public async Task Saving_owned_rows_with_nobody_signed_in_is_refused()
    {
        await using var anonymous = As(null);
        anonymous.Profiles.Add(new Profile { UserId = Guid.NewGuid(), TimeZone = "America/Chicago" });

        await Assert.ThrowsAsync<OwnershipViolationException>(() => anonymous.SaveChangesAsync(Ct));
    }
}
