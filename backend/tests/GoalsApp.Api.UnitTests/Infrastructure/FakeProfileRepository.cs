using GoalsApp.Api.Data.Entities;
using GoalsApp.Api.Repositories;

namespace GoalsApp.Api.UnitTests.Infrastructure;

// In-memory stand-in for the database; records what the service asked it to do.
public sealed class FakeProfileRepository : IProfileRepository
{
    private readonly Dictionary<Guid, Profile> _saved = [];
    private readonly List<Profile> _pending = [];

    public int SaveCount { get; private set; }
    public IReadOnlyList<Profile> Added { get; private set; } = [];

    public FakeProfileRepository With(Profile profile)
    {
        _saved[profile.UserId] = profile;
        return this;
    }

    public Task<Profile?> FindAsync(Guid userId, CancellationToken ct) =>
        Task.FromResult(_saved.GetValueOrDefault(userId));

    public void Add(Profile profile) => _pending.Add(profile);

    public Task SaveChangesAsync(CancellationToken ct)
    {
        SaveCount++;
        foreach (var profile in _pending)
            _saved[profile.UserId] = profile;
        Added = [.. Added, .. _pending];
        _pending.Clear();
        return Task.CompletedTask;
    }
}
