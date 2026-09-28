using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace GoalsApp.Api.Data;

// Used by EF's tools (migrations add, migrations bundle) instead of running Program.cs,
// so migrations never depend on app configuration. The bundle supplies the real
// connection string at run time via --connection.
public class GoalsDbContextFactory : IDesignTimeDbContextFactory<GoalsDbContext>
{
    public GoalsDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<GoalsDbContext>()
            .UseNpgsql(GoalsDbContext.ConfigureNpgsql)
            .Options;

        return new GoalsDbContext(options);
    }
}
