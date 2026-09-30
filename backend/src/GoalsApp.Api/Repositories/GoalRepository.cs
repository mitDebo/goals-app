using GoalsApp.Api.Data;
using GoalsApp.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace GoalsApp.Api.Repositories;

// Owner-only access is enforced underneath by GoalsDbContext's query filter and the
// ownership interceptor, so these only ever see the signed-in user's goals.
public sealed class GoalRepository(GoalsDbContext db) : IGoalRepository
{
    public Task<List<Goal>> ListAsync(CancellationToken ct) =>
        db.Goals
            .Include(g => g.Options.OrderBy(o => o.Position))
            .Where(g => g.ArchivedAt == null)
            .OrderBy(g => g.Position)
            .ToListAsync(ct);

    public Task<Goal?> FindAsync(Guid id, CancellationToken ct) =>
        db.Goals
            .Include(g => g.Options.OrderBy(o => o.Position))
            .FirstOrDefaultAsync(g => g.Id == id, ct);

    public void Add(Goal goal) => db.Goals.Add(goal);

    public void RemoveOption(GoalEnumOption option) => db.GoalEnumOptions.Remove(option);

    public Task SaveChangesAsync(CancellationToken ct) => db.SaveChangesAsync(ct);
}
