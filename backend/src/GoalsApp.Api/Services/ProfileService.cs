using GoalsApp.Api.Core.Outcomes;
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

    public async Task<Outcome<Profile>> GetAsync(Guid userId, CancellationToken ct)
    {
        var profile = await profiles.FindAsync(userId, ct);
        return profile is null ? Outcome<Profile>.NotFound() : profile;
    }

    // Idempotent: creates the profile on first sign-in, otherwise returns it unchanged.
    public async Task<Outcome<Ensured>> EnsureAsync(Guid userId, string? timeZone, CancellationToken ct)
    {
        if (!IanaTimeZone.IsValid(timeZone))
            return Outcome<Ensured>.Invalid("timeZone", InvalidTimeZone);

        var existing = await profiles.FindAsync(userId, ct);
        if (existing is not null)
            return new Ensured(existing, Created: false);

        var profile = new Profile { UserId = userId, TimeZone = timeZone!, WeekStart = WeekStart.Sunday };
        profiles.Add(profile);
        await profiles.SaveChangesAsync(ct);
        return new Ensured(profile, Created: true);
    }

    // Partial update: null means "leave as is". Nothing changes unless every field is valid.
    public async Task<Outcome<Profile>> UpdateAsync(Guid userId, string? timeZone, string? weekStart, CancellationToken ct)
    {
        var profile = await profiles.FindAsync(userId, ct);
        if (profile is null)
            return Outcome<Profile>.NotFound();

        if (timeZone is not null && !IanaTimeZone.IsValid(timeZone))
            return Outcome<Profile>.Invalid("timeZone", InvalidTimeZone);

        var newWeekStart = profile.WeekStart;
        if (weekStart is not null && !WeekStartNames.TryParse(weekStart, out newWeekStart))
            return Outcome<Profile>.Invalid("weekStart", InvalidWeekStart);

        profile.TimeZone = timeZone ?? profile.TimeZone;
        profile.WeekStart = newWeekStart;
        await profiles.SaveChangesAsync(ct);
        return profile;
    }
}
