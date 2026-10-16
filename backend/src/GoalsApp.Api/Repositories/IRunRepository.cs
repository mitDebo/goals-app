using GoalsApp.Api.Data.Entities;

namespace GoalsApp.Api.Repositories;

public interface IRunRepository
{
    // The signed-in user's runs, each with its plan (and the plan's goals) and its ticks, by start date.
    Task<List<Run>> ListAsync(CancellationToken ct);

    // One run with its plan, the plan's goals and its ticks, or null if missing or someone else's.
    Task<Run?> FindAsync(Guid id, CancellationToken ct);

    void Add(Run run);
    void RemoveAchievement(Achievement achievement);
    Task SaveChangesAsync(CancellationToken ct);
}
