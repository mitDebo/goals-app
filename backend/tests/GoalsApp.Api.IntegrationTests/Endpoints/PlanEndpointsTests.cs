using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using GoalsApp.Api.IntegrationTests.Infrastructure;

namespace GoalsApp.Api.IntegrationTests.Endpoints;

// Prototype: one pass through the plan API against the real test database, mainly to catch
// mapping mistakes (e.g. the days array) that unit tests can't see.
public class PlanEndpointsTests(GoalsApiFactory factory) : IClassFixture<GoalsApiFactory>
{
    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    private HttpClient SignedInClient()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestJwt.Create(userId: Guid.NewGuid()));
        return client;
    }

    private static StringContent Json(string json) => new(json, Encoding.UTF8, "application/json");

    private static async Task<JsonElement> Body(HttpResponseMessage response) =>
        await response.Content.ReadFromJsonAsync<JsonElement>(Ct);

    private static async Task<string> CreateGoal(HttpClient client, string name, string type = "boolean")
    {
        var json = type == "boolean"
            ? $$"""{ "name": "{{name}}", "type": "boolean" }"""
            : $$"""{ "name": "{{name}}", "type": "number" }""";
        var response = await client.PostAsync("/api/goals", Json(json), Ct);
        return (await Body(response)).GetProperty("id").GetString()!;
    }

    [Fact]
    public async Task A_plan_is_created_read_and_replaced()
    {
        var client = SignedInClient();
        var read = await CreateGoal(client, "Read");
        var gym = await CreateGoal(client, "Gym");

        var created = await client.PostAsync("/api/plans", Json($$"""
            { "name": "Work", "lengthDays": 7, "goals": [
                { "goalId": "{{read}}", "days": [4, 1, 3] },
                { "goalId": "{{gym}}", "times": 3 } ] }
            """), Ct);

        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var id = (await Body(created)).GetProperty("id").GetString();

        var plan = await Body(await client.GetAsync($"/api/plans/{id}", Ct));
        Assert.Equal("Work", plan.GetProperty("name").GetString());
        Assert.Equal(7, plan.GetProperty("lengthDays").GetInt32());
        var goals = plan.GetProperty("goals").EnumerateArray().ToList();
        Assert.Equal("Read", goals[0].GetProperty("goalName").GetString());
        Assert.Equal([1, 3, 4], goals[0].GetProperty("days").EnumerateArray().Select(d => d.GetInt32()));
        Assert.False(goals[0].TryGetProperty("times", out _));
        Assert.Equal(3, goals[1].GetProperty("times").GetInt32());

        var replaced = await client.PutAsync($"/api/plans/{id}", Json($$"""
            { "name": "Work", "lengthDays": 5, "goals": [
                { "goalId": "{{gym}}", "days": [2] },
                { "goalId": "{{read}}", "times": 1 } ] }
            """), Ct);

        Assert.Equal(HttpStatusCode.OK, replaced.StatusCode);
        var list = await Body(await client.GetAsync("/api/plans", Ct));
        var after = list[0].GetProperty("goals").EnumerateArray().ToList();
        Assert.Equal(["Gym", "Read"], after.Select(g => g.GetProperty("goalName").GetString()));
        Assert.Equal([2], after[0].GetProperty("days").EnumerateArray().Select(d => d.GetInt32()));
        Assert.Equal(1, after[1].GetProperty("times").GetInt32());
    }

    [Fact]
    public async Task Only_your_own_yes_no_goals_can_be_in_a_plan()
    {
        var client = SignedInClient();
        var someoneElses = await CreateGoal(SignedInClient(), "Theirs");
        var number = await CreateGoal(client, "Miles", "number");

        var response = await client.PostAsync("/api/plans", Json($$"""
            { "name": "Work", "lengthDays": 7, "goals": [
                { "goalId": "{{someoneElses}}", "times": 1 },
                { "goalId": "{{number}}", "times": 1 } ] }
            """), Ct);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = (await Body(response)).GetProperty("errors");
        Assert.True(errors.TryGetProperty("goals[0].goalId", out _));
        Assert.True(errors.TryGetProperty("goals[1].goalId", out _));
    }

    [Fact]
    public async Task Another_users_plan_is_not_found()
    {
        var owner = SignedInClient();
        var created = await owner.PostAsync("/api/plans", Json("""{ "name": "Mine", "lengthDays": 7, "goals": [] }"""), Ct);
        var id = (await Body(created)).GetProperty("id").GetString();

        Assert.Equal(HttpStatusCode.NotFound, (await SignedInClient().GetAsync($"/api/plans/{id}", Ct)).StatusCode);
    }
}
