using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using GoalsApp.Api.IntegrationTests.Infrastructure;

namespace GoalsApp.Api.IntegrationTests.Endpoints;

// Prototype: the run rules that are easy to break without noticing — "today" in the user's
// own time zone, the default end date, and ticks surviving a goal leaving and rejoining a plan.
public class RunEndpointsTests : IClassFixture<GoalsApiFactory>
{
    private readonly GoalsApiFactory _factory;

    public RunEndpointsTests(GoalsApiFactory factory)
    {
        _factory = factory;
        // 03:00 UTC on 10 March is still 9 March in New York, where these users live.
        _factory.FakeTime.SetUtcNow(new DateTimeOffset(2026, 3, 10, 3, 0, 0, TimeSpan.Zero));
    }

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    private static StringContent Json(string json) => new(json, Encoding.UTF8, "application/json");

    private static async Task<JsonElement> Body(HttpResponseMessage response) =>
        await response.Content.ReadFromJsonAsync<JsonElement>(Ct);

    private async Task<HttpClient> SignedInClient()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestJwt.Create(userId: Guid.NewGuid()));
        await client.PostAsync("/api/me", Json("""{ "timeZone": "America/New_York" }"""), Ct);
        return client;
    }

    private static async Task<string> CreateGoal(HttpClient client, string name)
    {
        var response = await client.PostAsync("/api/goals", Json($$"""{ "name": "{{name}}", "type": "boolean" }"""), Ct);
        return (await Body(response)).GetProperty("id").GetString()!;
    }

    private static async Task<string> CreatePlan(HttpClient client, string goalsJson, int length = 7)
    {
        var response = await client.PostAsync("/api/plans",
            Json($$"""{ "name": "Work", "lengthDays": {{length}}, "goals": [{{goalsJson}}] }"""), Ct);
        return (await Body(response)).GetProperty("id").GetString()!;
    }

    private static async Task<string> StartRun(HttpClient client, string planId, string start, string? end = null)
    {
        var endJson = end is null ? "" : $$""", "endDate": "{{end}}" """;
        var response = await client.PostAsync("/api/runs",
            Json($$"""{ "planId": "{{planId}}", "startDate": "{{start}}"{{endJson}} }"""), Ct);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await Body(response)).GetProperty("id").GetString()!;
    }

    private static Task<HttpResponseMessage> Tick(HttpClient client, string run, string goal, string date) =>
        client.PutAsync($"/api/runs/{run}/achievements/{goal}/{date}", null, Ct);

    private static async Task<JsonElement> OnlyRun(HttpClient client) =>
        (await Body(await client.GetAsync("/api/runs", Ct))).GetProperty("runs")[0];

    private static List<string> TickedDates(JsonElement run, string goal) =>
        [.. run.GetProperty("achievements").EnumerateArray()
            .Where(a => a.GetProperty("goalId").GetString() == goal)
            .Select(a => a.GetProperty("date").GetString()!)];

    [Fact]
    public async Task A_run_ends_on_the_plans_last_day_unless_told_otherwise()
    {
        var client = await SignedInClient();
        var plan = await CreatePlan(client, "", length: 7);

        await StartRun(client, plan, "2026-03-01");
        await StartRun(client, plan, "2026-03-01", end: "2026-03-20");

        var list = await Body(await client.GetAsync("/api/runs", Ct));
        Assert.Equal("2026-03-09", list.GetProperty("today").GetString());
        var runs = list.GetProperty("runs").EnumerateArray().ToList();
        Assert.Equal(["2026-03-07", "2026-03-20"], runs.Select(r => r.GetProperty("endDate").GetString()));
        Assert.Equal("Work", runs[0].GetProperty("planName").GetString());
    }

    [Fact]
    public async Task Any_day_up_to_today_can_be_ticked_and_unticked()
    {
        var client = await SignedInClient();
        var read = await CreateGoal(client, "Read");
        var plan = await CreatePlan(client, $$"""{ "goalId": "{{read}}", "days": [1] }""");
        var run = await StartRun(client, plan, "2026-03-05");

        // Day 1 is due; day 2 isn't (a bonus tick); 9 March is today in New York.
        Assert.Equal(HttpStatusCode.NoContent, (await Tick(client, run, read, "2026-03-05")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await Tick(client, run, read, "2026-03-06")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await Tick(client, run, read, "2026-03-09")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await Tick(client, run, read, "2026-03-09")).StatusCode);

        // Tomorrow (already 10 March in UTC) and days outside the run can't be ticked.
        Assert.Equal(HttpStatusCode.BadRequest, (await Tick(client, run, read, "2026-03-10")).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await Tick(client, run, read, "2026-03-04")).StatusCode);

        var untick = await client.DeleteAsync($"/api/runs/{run}/achievements/{read}/2026-03-06", Ct);
        Assert.Equal(HttpStatusCode.NoContent, untick.StatusCode);

        Assert.Equal(["2026-03-05", "2026-03-09"], TickedDates(await OnlyRun(client), read));
    }

    [Fact]
    public async Task Ticks_are_hidden_while_their_goal_is_out_of_the_plan_and_return_with_it()
    {
        var client = await SignedInClient();
        var read = await CreateGoal(client, "Read");
        var gym = await CreateGoal(client, "Gym");
        var withRead = $$"""{ "goalId": "{{read}}", "times": 2 }, { "goalId": "{{gym}}", "times": 1 }""";
        var plan = await CreatePlan(client, withRead);
        var run = await StartRun(client, plan, "2026-03-05");
        await Tick(client, run, read, "2026-03-06");

        await client.PutAsync($"/api/plans/{plan}",
            Json($$"""{ "name": "Work", "lengthDays": 7, "goals": [{ "goalId": "{{gym}}", "times": 1 }] }"""), Ct);
        var without = await OnlyRun(client);
        Assert.Equal(["Gym"], without.GetProperty("goals").EnumerateArray().Select(g => g.GetProperty("goalName").GetString()));
        Assert.Empty(TickedDates(without, read));
        Assert.Equal(HttpStatusCode.BadRequest, (await Tick(client, run, read, "2026-03-07")).StatusCode);

        await client.PutAsync($"/api/plans/{plan}",
            Json($$"""{ "name": "Work", "lengthDays": 7, "goals": [{{withRead}}] }"""), Ct);
        Assert.Equal(["2026-03-06"], TickedDates(await OnlyRun(client), read));
    }

    [Fact]
    public async Task Another_users_run_is_not_found()
    {
        var owner = await SignedInClient();
        var read = await CreateGoal(owner, "Read");
        var plan = await CreatePlan(owner, $$"""{ "goalId": "{{read}}", "times": 1 }""");
        var run = await StartRun(owner, plan, "2026-03-05");

        var stranger = await SignedInClient();
        Assert.Equal(HttpStatusCode.NotFound, (await Tick(stranger, run, read, "2026-03-05")).StatusCode);
        var strangersPlanStart = await stranger.PostAsync("/api/runs",
            Json($$"""{ "planId": "{{plan}}", "startDate": "2026-03-05" }"""), Ct);
        Assert.Equal(HttpStatusCode.BadRequest, strangersPlanStart.StatusCode);
    }
}
