using System.Net;
using GoalsApp.Api.IntegrationTests.Infrastructure;
using Microsoft.AspNetCore.Hosting;

namespace GoalsApp.Api.IntegrationTests.Endpoints;

public class HealthEndpointsTests(GoalsApiFactory factory) : IClassFixture<GoalsApiFactory>
{
    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    // Same app, but pointed at a database that isn't there.
    private sealed class UnreachableDatabaseFactory : GoalsApiFactory
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.UseSetting("ConnectionStrings:Goals",
                "Host=127.0.0.1;Port=1;Database=goals;Username=nobody;Password=nothing;Timeout=2");
        }
    }

    // Spec: platform-skeleton / "Hello endpoint"
    // GET /api/hello, no auth, returns 200 with the plain-text body "hello, goals".
    [Fact]
    public async Task Get_hello_returns_200_with_hello_world_as_plain_text()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/hello", Ct);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/plain", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal("hello, goals", await response.Content.ReadAsStringAsync(Ct));
    }

    // GET /api/health, no auth: 200 only when the app can actually reach its database,
    // so a deploy with a broken connection string is caught straight away.
    [Fact]
    public async Task Health_is_200_when_the_database_is_reachable()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/health", Ct);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Health_is_503_when_the_database_is_unreachable()
    {
        await using var unreachable = new UnreachableDatabaseFactory();
        var client = unreachable.CreateClient();

        var response = await client.GetAsync("/api/health", Ct);

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
    }
}
