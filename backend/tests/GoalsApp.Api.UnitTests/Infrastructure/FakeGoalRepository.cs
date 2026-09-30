using GoalsApp.Api.Data.Entities;
using GoalsApp.Api.Repositories;

namespace GoalsApp.Api.UnitTests.Infrastructure;

// In-memory stand-in for the database; records what the service asked it to do.
public sealed class FakeGoalRepository : IGoalRepository
{
    private readonly List<Goal> _saved = [];
    private readonly List<Goal> _pending = [];

    public int SaveCount { get; private set; }
    public List<GoalEnumOption> RemovedOptions { get; } = [];

    public FakeGoalRepository With(params Goal[] goals)
    {
        _saved.AddRange(goals);
        return this;
    }

    public Task<List<Goal>> ListAsync(CancellationToken ct) =>
        Task.FromResult(_saved.Where(g => g.ArchivedAt is null).OrderBy(g => g.Position).ToList());

    public Task<Goal?> FindAsync(Guid id, CancellationToken ct) =>
        Task.FromResult(_saved.FirstOrDefault(g => g.Id == id));

    public void Add(Goal goal) => _pending.Add(goal);

    public void RemoveOption(GoalEnumOption option) => RemovedOptions.Add(option);

    public Task SaveChangesAsync(CancellationToken ct)
    {
        SaveCount++;
        _saved.AddRange(_pending);
        _pending.Clear();
        return Task.CompletedTask;
    }
}
