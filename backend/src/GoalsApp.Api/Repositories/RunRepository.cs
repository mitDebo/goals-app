using GoalsApp.Api.Data;
using GoalsApp.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace GoalsApp.Api.Repositories;

public sealed class RunRepository(GoalsDbContext db) : IRunRepository
{
    public Task<List<Run>> ListAsync(CancellationToken ct) =>
        WithDetails()
            .OrderBy(r => r.StartDate).ThenBy(r => r.CreatedAt)
            .AsSplitQuery()
            .ToListAsync(ct);

    public Task<Run?> FindAsync(Guid id, CancellationToken ct) =>
        WithDetails().AsSplitQuery().FirstOrDefaultAsync(r => r.Id == id, ct);

    public void Add(Run run) => db.Runs.Add(run);

    public void Remove(Run run) => db.Runs.Remove(run);

    public void RemoveAchievement(Achievement achievement) => db.Achievements.Remove(achievement);

    public Task SaveChangesAsync(CancellationToken ct) => db.SaveChangesAsync(ct);

    private IQueryable<Run> WithDetails() =>
        db.Runs
            .Include(r => r.Plan).ThenInclude(p => p.Goals.OrderBy(g => g.Position)).ThenInclude(g => g.Goal)
            .Include(r => r.Achievements);
}
