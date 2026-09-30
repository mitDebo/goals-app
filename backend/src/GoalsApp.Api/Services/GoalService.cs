using GoalsApp.Api.Core.Outcomes;
using GoalsApp.Api.Data.Entities;
using GoalsApp.Api.Domain;
using GoalsApp.Api.Repositories;

namespace GoalsApp.Api.Services;

public sealed class GoalService(IGoalRepository goals)
{
    public Task<List<Goal>> ListAsync(CancellationToken ct) => throw new NotImplementedException();

    public Task<Outcome<Goal>> GetAsync(Guid id, CancellationToken ct) => throw new NotImplementedException();

    // New goals go to the bottom of the list.
    public Task<Outcome<Goal>> CreateAsync(GoalDraft draft, CancellationToken ct) => throw new NotImplementedException();

    // Full replace. Enum options with an Id are updated, ones without are created, missing ones are removed.
    public Task<Outcome<Goal>> UpdateAsync(Guid id, GoalDraft draft, CancellationToken ct) =>
        throw new NotImplementedException();

    // goalIds must be exactly the user's goals, each once, in the new order.
    public Task<Outcome<List<Goal>>> ReorderAsync(IReadOnlyList<Guid> goalIds, CancellationToken ct) =>
        throw new NotImplementedException();
}
