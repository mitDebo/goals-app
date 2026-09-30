using GoalsApp.Api.Core.Auth;
using GoalsApp.Api.Core.Time;
using GoalsApp.Api.Data;
using GoalsApp.Api.Data.Interceptors;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace GoalsApp.Api.Core.Extensions;

public static class ServiceCollectionExtensions
{
    // Cross-cutting helpers: who is signed in, and what time it is.
    public static IServiceCollection AddGoalsCore(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUser, HttpCurrentUser>();
        services.AddSingleton(TimeProvider.System);
        services.AddSingleton<Clock>();
        return services;
    }

    // Database: connection string "ConnectionStrings:Goals" comes from user-secrets
    // locally and from the GOALS_DB_CONNECTION env var (via docker compose) in production.
    // The interceptor enforces row ownership and fills in timestamps on every save.
    public static IServiceCollection AddGoalsData(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<OwnershipInterceptor>();
        services.AddDbContext<GoalsDbContext>((provider, options) =>
            options.UseNpgsql(configuration.GetConnectionString("Goals"), GoalsDbContext.ConfigureNpgsql)
                .AddInterceptors(provider.GetRequiredService<OwnershipInterceptor>()));
        return services;
    }

    // Authentication: validate Supabase access tokens (JWTs).
    // Authority = the Supabase auth issuer; the handler reads its OpenID discovery
    // document and public signing keys (JWKS) from there, so no secret is stored.
    // Every endpoint requires a signed-in user unless it explicitly opts out.
    public static IServiceCollection AddGoalsAuth(this IServiceCollection services, IConfiguration configuration)
    {
        var issuer = configuration["Auth:Issuer"]
            ?? throw new InvalidOperationException("Auth:Issuer is not configured.");
        var audience = configuration["Auth:Audience"] ?? "authenticated";

        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.Authority = issuer;
                options.Audience = audience;
                options.TokenValidationParameters.ValidIssuer = issuer;
                options.TokenValidationParameters.ValidAudience = audience;
                // Keep JWT claim names as-is ("sub" stays "sub").
                options.MapInboundClaims = false;
            });

        services.AddAuthorizationBuilder()
            .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build());

        return services;
    }
}
