using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using GoalsApp.Api.IntegrationTests.Infrastructure;

namespace GoalsApp.Api.IntegrationTests;

// Spec: user-profile / "Profile created on first sign-in", "Edit settings",
// "Server-computed today". Each test uses a fresh user, so tests don't share data.
public class ProfileEndpointTests(GoalsApiFactory factory) : IClassFixture<GoalsApiFactory>
{
    private sealed record Profile(string TimeZone, string WeekStart, DateOnly Today);

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    private HttpClient SignedInClient()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestJwt.Create(userId: Guid.NewGuid()));
        return client;
    }

    private static async Task<Profile?> ReadProfile(HttpResponseMessage response) =>
        await response.Content.ReadFromJsonAsync<Profile>(Ct);

    [Fact]
    public async Task Get_before_the_profile_exists_returns_404()
    {
        var client = SignedInClient();

        var response = await client.GetAsync("/api/me", Ct);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Post_creates_the_profile_with_the_browser_time_zone_and_a_sunday_week_start()
    {
        var client = SignedInClient();

        var created = await client.PostAsJsonAsync("/api/me", new { timeZone = "America/Chicago" }, Ct);

        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var body = await ReadProfile(created);
        Assert.Equal("America/Chicago", body?.TimeZone);
        Assert.Equal("sunday", body?.WeekStart);

        var fetched = await ReadProfile(await client.GetAsync("/api/me", Ct));
        Assert.Equal("America/Chicago", fetched?.TimeZone);
        Assert.Equal("sunday", fetched?.WeekStart);
    }

    [Fact]
    public async Task Post_again_leaves_the_existing_profile_unchanged()
    {
        var client = SignedInClient();
        await client.PostAsJsonAsync("/api/me", new { timeZone = "America/Chicago" }, Ct);

        var again = await client.PostAsJsonAsync("/api/me", new { timeZone = "America/Los_Angeles" }, Ct);

        Assert.Equal(HttpStatusCode.OK, again.StatusCode);
        Assert.Equal("America/Chicago", (await ReadProfile(again))?.TimeZone);
        Assert.Equal("America/Chicago", (await ReadProfile(await client.GetAsync("/api/me", Ct)))?.TimeZone);
    }

    [Fact]
    public async Task Post_with_an_invalid_time_zone_is_rejected_and_creates_nothing()
    {
        var client = SignedInClient();

        var response = await client.PostAsJsonAsync("/api/me", new { timeZone = "Mars/Olympus" }, Ct);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync("/api/me", Ct)).StatusCode);
    }

    [Fact]
    public async Task Patch_updates_only_the_fields_sent()
    {
        var client = SignedInClient();
        await client.PostAsJsonAsync("/api/me", new { timeZone = "America/Chicago" }, Ct);

        var weekOnly = await client.PatchAsJsonAsync("/api/me", new { weekStart = "monday" }, Ct);
        Assert.Equal(HttpStatusCode.OK, weekOnly.StatusCode);
        var afterWeek = await ReadProfile(weekOnly);
        Assert.Equal("monday", afterWeek?.WeekStart);
        Assert.Equal("America/Chicago", afterWeek?.TimeZone);

        var zoneOnly = await client.PatchAsJsonAsync("/api/me", new { timeZone = "Europe/London" }, Ct);
        var afterZone = await ReadProfile(zoneOnly);
        Assert.Equal("Europe/London", afterZone?.TimeZone);
        Assert.Equal("monday", afterZone?.WeekStart);
    }

    [Fact]
    public async Task Patch_with_an_invalid_time_zone_is_rejected_and_changes_nothing()
    {
        var client = SignedInClient();
        await client.PostAsJsonAsync("/api/me", new { timeZone = "America/Chicago" }, Ct);

        var response = await client.PatchAsJsonAsync("/api/me", new { timeZone = "Mars/Olympus" }, Ct);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("America/Chicago", (await ReadProfile(await client.GetAsync("/api/me", Ct)))?.TimeZone);
    }

    [Fact]
    public async Task Patch_with_an_invalid_week_start_is_rejected_and_changes_nothing()
    {
        var client = SignedInClient();
        await client.PostAsJsonAsync("/api/me", new { timeZone = "America/Chicago" }, Ct);

        var response = await client.PatchAsJsonAsync("/api/me", new { weekStart = "wednesday" }, Ct);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("sunday", (await ReadProfile(await client.GetAsync("/api/me", Ct)))?.WeekStart);
    }

    [Fact]
    public async Task Patch_before_the_profile_exists_returns_404()
    {
        var client = SignedInClient();

        var response = await client.PatchAsJsonAsync("/api/me", new { weekStart = "monday" }, Ct);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // Spec: access-control / "Owner-only data access"
    [Fact]
    public async Task Each_user_only_ever_gets_their_own_profile()
    {
        var alice = SignedInClient();
        var bob = SignedInClient();
        await alice.PostAsJsonAsync("/api/me", new { timeZone = "America/Chicago" }, Ct);
        await bob.PostAsJsonAsync("/api/me", new { timeZone = "Asia/Kolkata" }, Ct);

        Assert.Equal("America/Chicago", (await ReadProfile(await alice.GetAsync("/api/me", Ct)))?.TimeZone);
        Assert.Equal("Asia/Kolkata", (await ReadProfile(await bob.GetAsync("/api/me", Ct)))?.TimeZone);
    }

    [Fact]
    public async Task Today_comes_from_the_profile_time_zone_not_UTC()
    {
        factory.TodayClock.SetUtcNow(DateTimeOffset.Parse("2026-03-10T02:00:00Z"));
        var client = SignedInClient();
        await client.PostAsJsonAsync("/api/me", new { timeZone = "America/New_York" }, Ct);

        var profile = await ReadProfile(await client.GetAsync("/api/me", Ct));

        Assert.Equal(new DateOnly(2026, 3, 9), profile?.Today);
    }
}
