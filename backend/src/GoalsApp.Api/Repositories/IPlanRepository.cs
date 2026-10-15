using GoalsApp.Api.Data.Entities;

namespace GoalsApp.Api.Repositories;

public interface IPlanRepository
{
    // The signed-in user's plans with their goals, oldest first.
    Task<List<Plan>> ListAsync(CancellationToken ct);

    // One plan with its goals, or null if it doesn't exist or isn't the signed-in user's.
    Task<Plan?> FindAsync(Guid id, CancellationToken ct);

    void Add(Plan plan);
    void RemoveGoal(PlanGoal planGoal);
    Task SaveChangesAsync(CancellationToken ct);
}
