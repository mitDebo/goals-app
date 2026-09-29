using GoalsApp.Api.Auth;
using GoalsApp.Api.Profiles;
using Microsoft.EntityFrameworkCore;
using Npgsql.EntityFrameworkCore.PostgreSQL.Infrastructure;

namespace GoalsApp.Api.Data;

public class GoalsDbContext(DbContextOptions<GoalsDbContext> options, ICurrentUser currentUser) : DbContext(options)
{
    private readonly ICurrentUser _currentUser = currentUser;

    // Every goals-app table lives in this Postgres schema (shared Supabase project).
    public const string Schema = "goals";

    // Npgsql settings shared by the running app and EF's design-time tools.
    public static void ConfigureNpgsql(NpgsqlDbContextOptionsBuilder npgsql) =>
        npgsql.MigrationsHistoryTable("__EFMigrationsHistory", Schema);

    public DbSet<Profile> Profiles => Set<Profile>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(GoalsDbContext).Assembly);
    }
}
