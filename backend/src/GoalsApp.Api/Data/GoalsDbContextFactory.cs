using Microsoft.EntityFrameworkCore.Design;

namespace GoalsApp.Api.Data;

public class GoalsDbContextFactory : IDesignTimeDbContextFactory<GoalsDbContext>
{
    public GoalsDbContext CreateDbContext(string[] args) =>
        throw new NotImplementedException();
}
