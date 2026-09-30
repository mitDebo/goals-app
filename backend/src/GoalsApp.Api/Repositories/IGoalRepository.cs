using GoalsApp.Api.Data.Entities;

namespace GoalsApp.Api.Repositories;

public interface IGoalRepository
{
    // The signed-in user's non-archived goals with their options, in position order.
    Task<List<Goal>> ListAsync(CancellationToken ct);

    // One goal with its options, or null if it doesn't exist or isn't the signed-in user's.
    Task<Goal?> FindAsync(Guid id, CancellationToken ct);

    void Add(Goal goal);
    void RemoveOption(GoalEnumOption option);
    Task SaveChangesAsync(CancellationToken ct);
}
