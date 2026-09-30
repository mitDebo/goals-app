using GoalsApp.Api.Core.Results;
using GoalsApp.Api.Core.Time;
using GoalsApp.Api.Data.Entities;
using GoalsApp.Api.Services;
using GoalsApp.Api.UnitTests.Infrastructure;

namespace GoalsApp.Api.UnitTests.Services;

// Spec: user-profile / "Profile created on first sign-in" and "Edit settings".
public class ProfileServiceTests
{
    private static readonly Guid UserId = Guid.NewGuid();
    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    private static Profile Existing(string timeZone = "America/Chicago", WeekStart weekStart = WeekStart.Monday) =>
        new() { UserId = UserId, TimeZone = timeZone, WeekStart = weekStart };

    [Fact]
    public async Task Get_returns_the_profile()
    {
        var profile = Existing();
        var service = new ProfileService(new FakeProfileRepository().With(profile));

        var result = await service.GetAsync(UserId, Ct);

        Assert.Same(profile, result.Value);
    }

    [Fact]
    public async Task Get_without_a_profile_is_not_found()
    {
        var service = new ProfileService(new FakeProfileRepository());

        var result = await service.GetAsync(UserId, Ct);

        Assert.Equal(ResultStatus.NotFound, result.Status);
    }

    [Fact]
    public async Task Ensure_creates_the_profile_with_the_time_zone_and_a_sunday_week_start()
    {
        var repository = new FakeProfileRepository();
        var service = new ProfileService(repository);

        var result = await service.EnsureAsync(UserId, "America/Chicago", Ct);

        Assert.True(result.Value.Created);
        var saved = Assert.Single(repository.Added);
        Assert.Equal(UserId, saved.UserId);
        Assert.Equal("America/Chicago", saved.TimeZone);
        Assert.Equal(WeekStart.Sunday, saved.WeekStart);
        Assert.Equal(1, repository.SaveCount);
    }

    [Fact]
    public async Task Ensure_returns_an_existing_profile_unchanged()
    {
        var profile = Existing(timeZone: "Europe/London");
        var repository = new FakeProfileRepository().With(profile);
        var service = new ProfileService(repository);

        var result = await service.EnsureAsync(UserId, "America/Chicago", Ct);

        Assert.False(result.Value.Created);
        Assert.Same(profile, result.Value.Profile);
        Assert.Equal("Europe/London", profile.TimeZone);
        Assert.Empty(repository.Added);
        Assert.Equal(0, repository.SaveCount);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("Mars/Olympus")]
    [InlineData("Eastern Standard Time")]
    public async Task Ensure_rejects_an_invalid_time_zone_and_saves_nothing(string? timeZone)
    {
        var repository = new FakeProfileRepository();
        var service = new ProfileService(repository);

        var result = await service.EnsureAsync(UserId, timeZone, Ct);

        Assert.Equal(ResultStatus.Invalid, result.Status);
        Assert.Contains("timeZone", result.Errors.Keys);
        Assert.Equal(0, repository.SaveCount);
    }

    [Fact]
    public async Task Update_changes_only_the_fields_given()
    {
        var profile = Existing(timeZone: "America/Chicago", weekStart: WeekStart.Sunday);
        var repository = new FakeProfileRepository().With(profile);
        var service = new ProfileService(repository);

        var afterWeek = await service.UpdateAsync(UserId, timeZone: null, weekStart: "monday", Ct);
        Assert.Equal("America/Chicago", afterWeek.Value.TimeZone);
        Assert.Equal(WeekStart.Monday, afterWeek.Value.WeekStart);

        var afterZone = await service.UpdateAsync(UserId, timeZone: "Europe/London", weekStart: null, Ct);
        Assert.Equal("Europe/London", afterZone.Value.TimeZone);
        Assert.Equal(WeekStart.Monday, afterZone.Value.WeekStart);

        Assert.Equal(2, repository.SaveCount);
    }

    [Fact]
    public async Task Update_without_a_profile_is_not_found()
    {
        var service = new ProfileService(new FakeProfileRepository());

        var result = await service.UpdateAsync(UserId, "Europe/London", null, Ct);

        Assert.Equal(ResultStatus.NotFound, result.Status);
    }

    [Fact]
    public async Task Update_rejects_an_invalid_time_zone_and_changes_nothing()
    {
        var profile = Existing(timeZone: "America/Chicago");
        var repository = new FakeProfileRepository().With(profile);
        var service = new ProfileService(repository);

        var result = await service.UpdateAsync(UserId, "Mars/Olympus", "sunday", Ct);

        Assert.Equal(ResultStatus.Invalid, result.Status);
        Assert.Contains("timeZone", result.Errors.Keys);
        Assert.Equal("America/Chicago", profile.TimeZone);
        Assert.Equal(WeekStart.Monday, profile.WeekStart);
        Assert.Equal(0, repository.SaveCount);
    }

    [Fact]
    public async Task Update_rejects_an_invalid_week_start_and_changes_nothing()
    {
        var profile = Existing(timeZone: "America/Chicago");
        var repository = new FakeProfileRepository().With(profile);
        var service = new ProfileService(repository);

        var result = await service.UpdateAsync(UserId, "Europe/London", "wednesday", Ct);

        Assert.Equal(ResultStatus.Invalid, result.Status);
        Assert.Contains("weekStart", result.Errors.Keys);
        Assert.Equal("America/Chicago", profile.TimeZone);
        Assert.Equal(0, repository.SaveCount);
    }
}
