using System.Reflection;
using GoalsApp.Api.Auth;
using GoalsApp.Api.Profiles;
using Microsoft.EntityFrameworkCore;
using Npgsql.EntityFrameworkCore.PostgreSQL.Infrastructure;

namespace GoalsApp.Api.Data;

public class GoalsDbContext(DbContextOptions<GoalsDbContext> options, ICurrentUser currentUser) : DbContext(options)
{
    // Every goals-app table lives in this Postgres schema (shared Supabase project).
    public const string Schema = "goals";

    // Npgsql settings shared by the running app and EF's design-time tools.
    public static void ConfigureNpgsql(NpgsqlDbContextOptionsBuilder npgsql) =>
        npgsql.MigrationsHistoryTable("__EFMigrationsHistory", Schema);

    public DbSet<Profile> Profiles => Set<Profile>();

    // Read by the owner query filter each time a query runs.
    private Guid? CurrentUserId => currentUser.UserId;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(GoalsDbContext).Assembly);

        // Every IOwnedEntity is automatically filtered to the current user's rows
        // (none at all when nobody is signed in).
        var applyOwnerFilter = typeof(GoalsDbContext)
            .GetMethod(nameof(ApplyOwnerFilter), BindingFlags.NonPublic | BindingFlags.Instance)!;
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(IOwnedEntity).IsAssignableFrom(entityType.ClrType))
                applyOwnerFilter.MakeGenericMethod(entityType.ClrType).Invoke(this, [modelBuilder]);
        }
    }

    private void ApplyOwnerFilter<TEntity>(ModelBuilder modelBuilder) where TEntity : class, IOwnedEntity =>
        modelBuilder.Entity<TEntity>().HasQueryFilter(e => (Guid?)e.UserId == CurrentUserId);
}
