using System.Security.Claims;

namespace GoalsApp.Api.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        // Smallest protected endpoint: echoes the signed-in user's id (the token's "sub").
        app.MapGet("/api/whoami", (ClaimsPrincipal user) =>
            Results.Ok(new { userId = user.FindFirstValue("sub") }));
        return app;
    }
}
