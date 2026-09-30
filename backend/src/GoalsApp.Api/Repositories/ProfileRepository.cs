using GoalsApp.Api.Data;
using GoalsApp.Api.Data.Entities;

namespace GoalsApp.Api.Repositories;

// Owner-only access is enforced underneath by GoalsDbContext's query filter and the
// ownership interceptor, so a lookup here can only ever find the signed-in user's row.
public sealed class ProfileRepository(GoalsDbContext db) : IProfileRepository
{
    public async Task<Profile?> FindAsync(Guid userId, CancellationToken ct) =>
        await db.Profiles.FindAsync([userId], ct);

    public void Add(Profile profile) => db.Profiles.Add(profile);

    public Task SaveChangesAsync(CancellationToken ct) => db.SaveChangesAsync(ct);
}
