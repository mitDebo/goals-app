using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using GoalsApp.Api.IntegrationTests.Infrastructure;

namespace GoalsApp.Api.IntegrationTests.Endpoints;

// Spec: goals / all requirements, through the HTTP API against the real test database.
// Each test signs in as a fresh user, so tests don't see each other's goals.
public class GoalEndpointsTests(GoalsApiFactory factory) : IClassFixture<GoalsApiFactory>
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
        (await response.Content.ReadFromJsonAsync<JsonElement>(Ct));

    private static async Task<JsonElement> Create(HttpClient client, string json)
    {
        var response = await client.PostAsync("/api/goals", Json(json), Ct);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return await Body(response);
    }

    private static async Task<JsonElement> List(HttpClient client) =>
        await Body(await client.GetAsync("/api/goals", Ct));

    private static string[] Names(JsonElement goals) => [.. goals.EnumerateArray().Select(g => g.GetProperty("name").GetString()!)];

    private static string Id(JsonElement goal) => goal.GetProperty("id").GetString()!;

    // ---- create and get ----

    [Fact]
    public async Task A_boolean_goal_is_created_with_only_the_fields_it_uses()
    {
        var client = SignedInClient();

        var response = await client.PostAsync("/api/goals", Json("""{ "name": "Read", "type": "boolean" }"""), Ct);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var goal = await Body(response);
        Assert.Equal($"/api/goals/{Id(goal)}", response.Headers.Location?.OriginalString);
        Assert.Equal("Read", goal.GetProperty("name").GetString());
        Assert.Equal("boolean", goal.GetProperty("type").GetString());
        Assert.Equal("toggle", goal.GetProperty("displayStyle").GetString());
        Assert.Equal(0, goal.GetProperty("position").GetInt32());
        foreach (var absent in new[] { "description", "range", "number", "enum", "target" })
            Assert.False(goal.TryGetProperty(absent, out _), $"'{absent}' should be left out");
    }

    [Fact]
    public async Task A_range_goal_keeps_its_ends_labels_style_and_target()
    {
        var goal = await Create(SignedInClient(), """
            { "name": "Focus", "type": "range",
              "range": { "min": -5, "max": 5, "minLabel": "😫", "maxLabel": "🤩" },
              "target": { "comparison": "at_least", "value": 3 } }
            """);

        Assert.Equal("buttons", goal.GetProperty("displayStyle").GetString());
        var range = goal.GetProperty("range");
        Assert.Equal(-5, range.GetProperty("min").GetInt32());
        Assert.Equal(5, range.GetProperty("max").GetInt32());
        Assert.Equal("😫", range.GetProperty("minLabel").GetString());
        Assert.Equal("🤩", range.GetProperty("maxLabel").GetString());
        Assert.Equal("at_least", goal.GetProperty("target").GetProperty("comparison").GetString());
        Assert.Equal(3m, goal.GetProperty("target").GetProperty("value").GetDecimal());
        Assert.False(goal.TryGetProperty("enum", out _));
    }

    [Fact]
    public async Task A_number_goal_keeps_its_unit_and_a_decimal_target()
    {
        var goal = await Create(SignedInClient(), """
            { "name": "Drinks", "type": "number", "number": { "unit": "glasses" },
              "target": { "comparison": "at_most", "value": 2.5 } }
            """);

        Assert.Equal("input", goal.GetProperty("displayStyle").GetString());
        Assert.Equal("glasses", goal.GetProperty("number").GetProperty("unit").GetString());
        Assert.Equal("at_most", goal.GetProperty("target").GetProperty("comparison").GetString());
        Assert.Equal(2.5m, goal.GetProperty("target").GetProperty("value").GetDecimal());
    }

    [Fact]
    public async Task An_enum_goal_keeps_its_options_in_order_with_ids_notes_and_targets()
    {
        var goal = await Create(SignedInClient(), """
            { "name": "Mood", "type": "enum",
              "enum": { "ordered": true, "options": [
                { "label": "😞", "note": "bad" },
                { "label": "😐", "note": "meh", "isTarget": true },
                { "label": "😀", "note": "good", "isTarget": true } ] } }
            """);

        var settings = goal.GetProperty("enum");
        Assert.True(settings.GetProperty("ordered").GetBoolean());
        var options = settings.GetProperty("options").EnumerateArray().ToList();
        Assert.Equal(["😞", "😐", "😀"], options.Select(o => o.GetProperty("label").GetString()));
        Assert.Equal(["bad", "meh", "good"], options.Select(o => o.GetProperty("note").GetString()));
        Assert.Equal([false, true, true], options.Select(o => o.GetProperty("isTarget").GetBoolean()));
        Assert.All(options, o => Assert.True(Guid.TryParse(o.GetProperty("id").GetString(), out _)));
        Assert.False(goal.TryGetProperty("target", out _));
    }

    [Fact]
    public async Task A_created_goal_can_be_fetched_by_id()
    {
        var client = SignedInClient();
        var created = await Create(client, """{ "name": "Running", "type": "number", "number": { "unit": "miles" } }""");

        var response = await client.GetAsync($"/api/goals/{Id(created)}", Ct);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(created.GetRawText(), (await Body(response)).GetRawText());
    }

    [Theory]
    [InlineData("""{ "name": "", "type": "boolean" }""", "name")]
    [InlineData("""{ "name": "Read", "type": "checklist" }""", "type")]
    [InlineData("""{ "name": "Focus", "type": "range", "range": { "min": 1, "max": 7.5 } }""", "range.max")]
    [InlineData("""{ "name": "Focus", "type": "range", "range": { "min": 10, "max": 10 } }""", "range")]
    [InlineData("""{ "name": "Mood", "type": "enum", "enum": { "ordered": false, "options": [ { "label": "😀" } ] } }""", "enum.options")]
    [InlineData("""{ "name": "Mood", "type": "enum", "enum": { "ordered": false, "options": [ { "label": "😀" }, { "label": "😀" } ] } }""", "enum.options")]
    [InlineData("""{ "name": "Miles", "type": "number", "displayStyle": "dial" }""", "displayStyle")]
    [InlineData("""{ "name": "Focus", "type": "range", "range": { "min": 1, "max": 10 }, "target": { "comparison": "at_least", "value": 12 } }""", "target.value")]
    [InlineData("""{ "name": "Read", "type": "boolean", "target": { "comparison": "at_least", "value": 1 } }""", "target")]
    public async Task An_invalid_goal_is_rejected_with_the_field_that_is_wrong(string json, string field)
    {
        var client = SignedInClient();

        var response = await client.PostAsync("/api/goals", Json(json), Ct);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.True((await Body(response)).GetProperty("errors").TryGetProperty(field, out _), $"expected an error for '{field}'");
        Assert.Equal(0, (await List(client)).GetArrayLength());
    }

    // ---- list and order ----

    [Fact]
    public async Task Goals_are_listed_in_order_with_new_goals_last()
    {
        var client = SignedInClient();
        foreach (var name in new[] { "A", "B", "C" })
            await Create(client, $$"""{ "name": "{{name}}", "type": "boolean" }""");

        var goals = await List(client);

        Assert.Equal(["A", "B", "C"], Names(goals));
        Assert.Equal([0, 1, 2], goals.EnumerateArray().Select(g => g.GetProperty("position").GetInt32()));
    }

    [Fact]
    public async Task A_new_order_is_saved()
    {
        var client = SignedInClient();
        var a = await Create(client, """{ "name": "A", "type": "boolean" }""");
        var b = await Create(client, """{ "name": "B", "type": "boolean" }""");
        var c = await Create(client, """{ "name": "C", "type": "boolean" }""");

        var response = await client.PutAsJsonAsync("/api/goals/order", new { goalIds = new[] { Id(c), Id(a), Id(b) } }, Ct);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(["C", "A", "B"], Names(await Body(response)));
        Assert.Equal(["C", "A", "B"], Names(await List(client)));
    }

    [Fact]
    public async Task An_order_that_does_not_list_exactly_your_goals_is_rejected()
    {
        var client = SignedInClient();
        var a = await Create(client, """{ "name": "A", "type": "boolean" }""");
        var b = await Create(client, """{ "name": "B", "type": "boolean" }""");
        var someoneElses = await Create(SignedInClient(), """{ "name": "X", "type": "boolean" }""");

        string[][] badOrders = [[Id(b)], [Id(b), Id(a), Id(a)], [Id(b), Id(a), Id(someoneElses)]];
        foreach (var ids in badOrders)
        {
            var response = await client.PutAsJsonAsync("/api/goals/order", new { goalIds = ids }, Ct);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.True((await Body(response)).GetProperty("errors").TryGetProperty("goalIds", out _));
        }

        Assert.Equal(["A", "B"], Names(await List(client)));
    }

    // ---- edit ----

    [Fact]
    public async Task Put_replaces_the_goal_including_removing_its_target()
    {
        var client = SignedInClient();
        var created = await Create(client, """
            { "name": "Focus", "type": "range", "range": { "min": 1, "max": 5 },
              "target": { "comparison": "at_least", "value": 3 } }
            """);

        var response = await client.PutAsync($"/api/goals/{Id(created)}", Json("""
            { "name": "Deep focus", "type": "range", "displayStyle": "slider", "range": { "min": 0, "max": 20 } }
            """), Ct);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var fetched = await Body(await client.GetAsync($"/api/goals/{Id(created)}", Ct));
        Assert.Equal("Deep focus", fetched.GetProperty("name").GetString());
        Assert.Equal("slider", fetched.GetProperty("displayStyle").GetString());
        Assert.Equal(20, fetched.GetProperty("range").GetProperty("max").GetInt32());
        Assert.False(fetched.TryGetProperty("target", out _));
    }

    [Fact]
    public async Task Put_keeps_reorders_adds_and_removes_enum_options()
    {
        var client = SignedInClient();
        var created = await Create(client, """
            { "name": "Mood", "type": "enum", "enum": { "ordered": true, "options": [
                { "label": "😞" }, { "label": "😐" }, { "label": "😀" } ] } }
            """);
        var ids = created.GetProperty("enum").GetProperty("options").EnumerateArray()
            .ToDictionary(o => o.GetProperty("label").GetString()!, o => o.GetProperty("id").GetString()!);

        var response = await client.PutAsync($"/api/goals/{Id(created)}", Json($$"""
            { "name": "Mood", "type": "enum", "enum": { "ordered": true, "options": [
                { "id": "{{ids["😀"]}}", "label": "😀" },
                { "label": "🤔", "note": "unsure" },
                { "id": "{{ids["😞"]}}", "label": "😞", "note": "awful" } ] } }
            """), Ct);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var options = (await Body(await client.GetAsync($"/api/goals/{Id(created)}", Ct)))
            .GetProperty("enum").GetProperty("options").EnumerateArray().ToList();
        Assert.Equal(["😀", "🤔", "😞"], options.Select(o => o.GetProperty("label").GetString()));
        Assert.Equal(ids["😀"], options[0].GetProperty("id").GetString());
        Assert.Equal(ids["😞"], options[2].GetProperty("id").GetString());
        Assert.Equal("awful", options[2].GetProperty("note").GetString());
        Assert.DoesNotContain(ids["😐"], options.Select(o => o.GetProperty("id").GetString()));
    }

    [Fact]
    public async Task An_invalid_put_is_rejected_and_changes_nothing()
    {
        var client = SignedInClient();
        var created = await Create(client, """{ "name": "Read", "type": "boolean" }""");

        var response = await client.PutAsync($"/api/goals/{Id(created)}", Json("""{ "name": " ", "type": "boolean" }"""), Ct);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(["Read"], Names(await List(client)));
    }

    // ---- ownership ----

    [Fact]
    public async Task Another_users_goal_behaves_as_if_it_does_not_exist()
    {
        var owner = SignedInClient();
        var goal = await Create(owner, """{ "name": "Read", "type": "boolean" }""");
        var someoneElse = SignedInClient();

        Assert.Equal(HttpStatusCode.NotFound, (await someoneElse.GetAsync($"/api/goals/{Id(goal)}", Ct)).StatusCode);
        var put = await someoneElse.PutAsync($"/api/goals/{Id(goal)}", Json("""{ "name": "Mine now", "type": "boolean" }"""), Ct);
        Assert.Equal(HttpStatusCode.NotFound, put.StatusCode);

        Assert.Equal(0, (await List(someoneElse)).GetArrayLength());
        Assert.Equal(["Read"], Names(await List(owner)));
    }

    [Fact]
    public async Task An_unknown_goal_is_not_found()
    {
        var response = await SignedInClient().GetAsync($"/api/goals/{Guid.NewGuid()}", Ct);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
