using GoalsApp.Api.Data.Entities;

namespace GoalsApp.Api.Repositories;

public interface IProfileRepository
{
    Task<Profile?> FindAsync(Guid userId, CancellationToken ct);
    void Add(Profile profile);
    Task SaveChangesAsync(CancellationToken ct);
}
