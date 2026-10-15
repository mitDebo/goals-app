using GoalsApp.Api.Data;
using GoalsApp.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace GoalsApp.Api.Repositories;

public sealed class PlanRepository(GoalsDbContext db) : IPlanRepository
{
    public Task<List<Plan>> ListAsync(CancellationToken ct) =>
        db.Plans
            .Include(p => p.Goals.OrderBy(g => g.Position)).ThenInclude(g => g.Goal)
            .OrderBy(p => p.CreatedAt)
            .ToListAsync(ct);

    public Task<Plan?> FindAsync(Guid id, CancellationToken ct) =>
        db.Plans
            .Include(p => p.Goals.OrderBy(g => g.Position)).ThenInclude(g => g.Goal)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

    public void Add(Plan plan) => db.Plans.Add(plan);

    public void RemoveGoal(PlanGoal planGoal) => db.PlanGoals.Remove(planGoal);

    public Task SaveChangesAsync(CancellationToken ct) => db.SaveChangesAsync(ct);
}
