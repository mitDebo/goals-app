using GoalsApp.Api.Core.Time;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Time.Testing;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;

namespace GoalsApp.Api.IntegrationTests.Infrastructure;

// Boots the real app in memory against the test database, trusting only TestJwt's key.
public class GoalsApiFactory : WebApplicationFactory<Program>
{
    // Controls what "today" is for the app, without touching the clock used for token expiry.
    // Starts early so tests can move it forward to any date they need.
    public FakeTimeProvider FakeTime { get; } = new(new DateTimeOffset(2000, 1, 1, 0, 0, 0, TimeSpan.Zero));

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Same settings the app reads in production, pointed at test values.
        builder.UseSetting("Auth:Issuer", TestJwt.Issuer);
        builder.UseSetting("Auth:Audience", TestJwt.Audience);
        builder.UseSetting("ConnectionStrings:Goals", DatabaseFixture.ConnectionString);

        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<Clock>();
            services.AddSingleton(new Clock(FakeTime));

            services.PostConfigure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, options =>
            {
                // Never contact Supabase from tests: hand the handler a fixed
                // configuration containing only the test signing key.
                var configuration = new OpenIdConnectConfiguration { Issuer = TestJwt.Issuer };
                configuration.SigningKeys.Add(TestJwt.SigningKey);
                options.Configuration = configuration;
                options.ConfigurationManager = null!;
                options.TokenValidationParameters.IssuerSigningKeyResolver = null!;
                options.TokenValidationParameters.IssuerSigningKeys = [TestJwt.SigningKey];
            });
        });
    }
}
