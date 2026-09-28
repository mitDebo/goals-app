using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using GoalsApp.Api.IntegrationTests.Infrastructure;

namespace GoalsApp.Api.IntegrationTests;

// Spec: access-control / "Authentication required"
// Every API endpoint except GET /api/hello requires a valid, unexpired access
// token from the auth provider; otherwise 401.
// GET /api/whoami is the simplest protected endpoint: it echoes the caller's user id.
public class AuthenticationTests(GoalsApiFactory factory) : IClassFixture<GoalsApiFactory>
{
    private const string ProtectedPath = "/api/whoami";

    private sealed record WhoAmI(Guid UserId);

    private async Task<HttpResponseMessage> GetAsync(string path, string? token)
    {
        var client = factory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Get, path);
        if (token is not null)
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return await client.SendAsync(request, TestContext.Current.CancellationToken);
    }

    [Fact]
    public async Task Missing_token_is_rejected_with_401()
    {
        var response = await GetAsync(ProtectedPath, token: null);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Expired_token_is_rejected_with_401()
    {
        // Well past the default 5-minute clock-skew allowance.
        var token = TestJwt.Create(expires: DateTimeOffset.UtcNow.AddMinutes(-10));

        var response = await GetAsync(ProtectedPath, token);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Token_signed_with_an_untrusted_key_is_rejected_with_401()
    {
        var token = TestJwt.Create(signingKey: TestJwt.UntrustedKey);

        var response = await GetAsync(ProtectedPath, token);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Token_from_another_issuer_is_rejected_with_401()
    {
        var token = TestJwt.Create(issuer: "https://some-other-project.supabase.co/auth/v1");

        var response = await GetAsync(ProtectedPath, token);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Token_for_another_audience_is_rejected_with_401()
    {
        var token = TestJwt.Create(audience: "anon");

        var response = await GetAsync(ProtectedPath, token);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Valid_token_is_accepted_and_identifies_the_user()
    {
        var userId = Guid.NewGuid();
        var token = TestJwt.Create(userId: userId);

        var response = await GetAsync(ProtectedPath, token);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<WhoAmI>(TestContext.Current.CancellationToken);
        Assert.Equal(userId, body?.UserId);
    }

    [Fact]
    public async Task Hello_endpoint_stays_open_without_a_token()
    {
        var response = await GetAsync("/api/hello", token: null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
