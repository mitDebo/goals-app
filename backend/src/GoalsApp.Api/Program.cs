using System.Security.Claims;
using GoalsApp.Api.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Database: connection string "ConnectionStrings:Goals" comes from user-secrets
// locally and from the GOALS_DB_CONNECTION env var (via docker compose) in production.
builder.Services.AddDbContext<GoalsDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Goals"), GoalsDbContext.ConfigureNpgsql));

// Authentication: validate Supabase access tokens (JWTs).
// Authority = the Supabase auth issuer; the handler reads its OpenID discovery
// document and public signing keys (JWKS) from there, so no secret is stored.
var authIssuer = builder.Configuration["Auth:Issuer"]
    ?? throw new InvalidOperationException("Auth:Issuer is not configured.");
var authAudience = builder.Configuration["Auth:Audience"] ?? "authenticated";

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = authIssuer;
        options.Audience = authAudience;
        options.TokenValidationParameters.ValidIssuer = authIssuer;
        options.TokenValidationParameters.ValidAudience = authAudience;
        // Keep JWT claim names as-is ("sub" stays "sub").
        options.MapInboundClaims = false;
    });

// Every endpoint requires a signed-in user unless it explicitly opts out.
builder.Services.AddAuthorizationBuilder()
    .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build());

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

// Walking-skeleton endpoint: public, proves the API is reachable end to end.
// Returning a string from a minimal API endpoint writes it as text/plain.
app.MapGet("/api/hello", () => "hello, goals").AllowAnonymous();

// Smallest protected endpoint: echoes the signed-in user's id (the token's "sub").
app.MapGet("/api/whoami", (ClaimsPrincipal user) =>
    Results.Ok(new { userId = user.FindFirstValue("sub") }));

app.Run();

// Makes the auto-generated Program class visible to the integration tests,
// which boot the app in-memory via WebApplicationFactory<Program>.
public partial class Program { }
