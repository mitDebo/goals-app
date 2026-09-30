using GoalsApp.Api.Core.Results;
using GoalsApp.Api.Data.Entities;
using GoalsApp.Api.Repositories;

namespace GoalsApp.Api.Services;

public sealed class ProfileService(IProfileRepository profiles)
{
    // Created is true when this call made the profile, false when it already existed.
    public sealed record Ensured(Profile Profile, bool Created);

    public Task<Result<Profile>> GetAsync(Guid userId, CancellationToken ct) =>
        throw new NotImplementedException();

    // Idempotent: creates the profile on first sign-in, otherwise returns it unchanged.
    public Task<Result<Ensured>> EnsureAsync(Guid userId, string? timeZone, CancellationToken ct) =>
        throw new NotImplementedException();

    // Partial update: null means "leave as is".
    public Task<Result<Profile>> UpdateAsync(Guid userId, string? timeZone, string? weekStart, CancellationToken ct) =>
        throw new NotImplementedException();
}
