using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;

namespace GoalsApp.Api.IntegrationTests;

// Spec: platform-skeleton / "Hello endpoint"
// GET /api/hello, no auth, returns 200 with the plain-text body "hello, goals".
public class HelloEndpointTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task Get_hello_returns_200_with_hello_world_as_plain_text()
    {
        var ct = TestContext.Current.CancellationToken;
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/hello", ct);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/plain", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal("hello, goals", await response.Content.ReadAsStringAsync(ct));
    }
}
