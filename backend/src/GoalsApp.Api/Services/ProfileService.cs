using GoalsApp.Api.Core.Results;
using GoalsApp.Api.Core.Time;
using GoalsApp.Api.Data.Entities;
using GoalsApp.Api.Repositories;

namespace GoalsApp.Api.Services;

public sealed class ProfileService(IProfileRepository profiles)
{
    private const string InvalidTimeZone = "Time zone must be a valid IANA time zone, e.g. 'America/New_York'.";
    private const string InvalidWeekStart = "Week start must be 'sunday' or 'monday'.";

    // Created is true when this call made the profile, false when it already existed.
    public sealed record Ensured(Profile Profile, bool Created);

    public async Task<Result<Profile>> GetAsync(Guid userId, CancellationToken ct)
    {
        var profile = await profiles.FindAsync(userId, ct);
        return profile is null ? Result<Profile>.NotFound() : profile;
    }

    // Idempotent: creates the profile on first sign-in, otherwise returns it unchanged.
    public async Task<Result<Ensured>> EnsureAsync(Guid userId, string? timeZone, CancellationToken ct)
    {
        if (!IanaTimeZone.IsValid(timeZone))
            return Result<Ensured>.Invalid("timeZone", InvalidTimeZone);

        var existing = await profiles.FindAsync(userId, ct);
        if (existing is not null)
            return new Ensured(existing, Created: false);

        var profile = new Profile { UserId = userId, TimeZone = timeZone!, WeekStart = WeekStart.Sunday };
        profiles.Add(profile);
        await profiles.SaveChangesAsync(ct);
        return new Ensured(profile, Created: true);
    }

    // Partial update: null means "leave as is". Nothing changes unless every field is valid.
    public async Task<Result<Profile>> UpdateAsync(Guid userId, string? timeZone, string? weekStart, CancellationToken ct)
    {
        var profile = await profiles.FindAsync(userId, ct);
        if (profile is null)
            return Result<Profile>.NotFound();

        if (timeZone is not null && !IanaTimeZone.IsValid(timeZone))
            return Result<Profile>.Invalid("timeZone", InvalidTimeZone);

        var newWeekStart = profile.WeekStart;
        if (weekStart is not null && !WeekStartNames.TryParse(weekStart, out newWeekStart))
            return Result<Profile>.Invalid("weekStart", InvalidWeekStart);

        profile.TimeZone = timeZone ?? profile.TimeZone;
        profile.WeekStart = newWeekStart;
        await profiles.SaveChangesAsync(ct);
        return profile;
    }
}
