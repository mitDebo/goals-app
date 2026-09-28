using GoalsApp.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace GoalsApp.Api.UnitTests.Data;

// EF's tools (migrations add / bundle) build the context through this factory,
// so it must work without any of the app's configuration (auth, secrets, etc.).
public class GoalsDbContextFactoryTests
{
    private static GoalsDbContext CreateContext() => new GoalsDbContextFactory().CreateDbContext([]);

    [Fact]
    public void Creates_a_postgres_context_without_app_configuration()
    {
        using var context = CreateContext();

        Assert.Equal("Npgsql.EntityFrameworkCore.PostgreSQL", context.Database.ProviderName);
    }

    [Fact]
    public void Uses_the_goals_schema_for_tables()
    {
        using var context = CreateContext();

        Assert.Equal(GoalsDbContext.Schema, context.Model.GetDefaultSchema());
    }

    [Fact]
    public void Keeps_migration_history_in_the_goals_schema()
    {
        using var context = CreateContext();

        var relational = RelationalOptionsExtension.Extract(context.GetService<IDbContextOptions>());
        Assert.Equal(GoalsDbContext.Schema, relational.MigrationsHistoryTableSchema);
        Assert.Equal("__EFMigrationsHistory", relational.MigrationsHistoryTableName);
    }
}
