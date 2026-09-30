namespace GoalsApp.Api.Endpoints;

public static class HealthEndpoints
{
    public static IEndpointRouteBuilder MapHealthEndpoints(this IEndpointRouteBuilder app)
    {
        // Walking-skeleton endpoint: public, proves the API is reachable end to end.
        // Returning a string from a minimal API endpoint writes it as text/plain.
        app.MapGet("/api/hello", () => "hello, goals").AllowAnonymous();
        return app;
    }
}
