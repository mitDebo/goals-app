using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;

namespace GoalsApp.Api.IntegrationTests.Infrastructure;

// Boots the real app in memory, configured to trust only TestJwt's key.
public class GoalsApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Same settings the app reads in production, pointed at test values.
        builder.UseSetting("Auth:Issuer", TestJwt.Issuer);
        builder.UseSetting("Auth:Audience", TestJwt.Audience);

        builder.ConfigureTestServices(services =>
        {
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
