var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

// Walking-skeleton endpoint: proves the API is reachable end to end.
// Returning a string from a minimal API endpoint writes it as text/plain.
app.MapGet("/api/hello", () => "hello, world");

app.Run();

// Makes the auto-generated Program class visible to the integration tests,
// which boot the app in-memory via WebApplicationFactory<Program>.
public partial class Program { }
