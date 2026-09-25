using GoalsApp.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Database: connection string "ConnectionStrings:Goals" comes from user-secrets
// locally and from the GOALS_DB_CONNECTION env var (via docker compose) in production.
// The migrations history table also lives in the goals schema.
builder.Services.AddDbContext<GoalsDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("Goals"),
        npgsql => npgsql.MigrationsHistoryTable("__EFMigrationsHistory", GoalsDbContext.Schema)));

var app = builder.Build();

// Walking-skeleton endpoint: proves the API is reachable end to end.
// Returning a string from a minimal API endpoint writes it as text/plain.
app.MapGet("/api/hello", () => "hello, goals");

app.Run();

// Makes the auto-generated Program class visible to the integration tests,
// which boot the app in-memory via WebApplicationFactory<Program>.
public partial class Program { }
