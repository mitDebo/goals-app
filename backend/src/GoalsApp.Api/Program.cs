using GoalsApp.Api.Core.Extensions;
using GoalsApp.Api.Endpoints;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddGoalsCore()
    .AddGoalsData(builder.Configuration)
    .AddGoalsAuth(builder.Configuration)
    .AddGoalsServices();

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

app.MapHealthEndpoints();
app.MapAuthEndpoints();
app.MapProfileEndpoints();

app.Run();

// Makes the auto-generated Program class visible to the integration tests,
// which boot the app in-memory via WebApplicationFactory<Program>.
public partial class Program { }
