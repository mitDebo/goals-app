using Microsoft.EntityFrameworkCore;

namespace GoalsApp.Api.Data;

// The app's EF Core context. No tables yet; entities arrive in later changes.
public class GoalsDbContext(DbContextOptions<GoalsDbContext> options) : DbContext(options)
{
    // Every goals-app table lives in this Postgres schema (shared Supabase project).
    public const string Schema = "goals";

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);
    }
}
