using System.Security.Claims;
using GoalsApp.Api.Core.Auth;
using GoalsApp.Api.Core.Time;
using GoalsApp.Api.Data;
using GoalsApp.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace GoalsApp.Api.Endpoints;

public static class ProfileEndpoints
{
    public sealed record ProfileResponse(string TimeZone, string WeekStart, DateOnly Today);
    public sealed record CreateProfileRequest(string? TimeZone);
    public sealed record UpdateProfileRequest(string? TimeZone, string? WeekStart);

    public static IEndpointRouteBuilder MapProfileEndpoints(this IEndpointRouteBuilder app)
    {
        var me = app.MapGroup("/api/me");
        me.MapGet("", GetProfile);
        me.MapPost("", CreateProfile);
        me.MapPatch("", UpdateProfile);
        return app;
    }

    private static async Task<IResult> GetProfile(
        ClaimsPrincipal user, GoalsDbContext db, Clock clock, CancellationToken ct)
    {
        var profile = await db.Profiles.FindAsync([user.GetUserId()], ct);
        return profile is null ? Results.NotFound() : Results.Ok(ToResponse(profile, clock));
    }

    // Idempotent: creates the profile on first sign-in, otherwise returns it unchanged.
    private static async Task<IResult> CreateProfile(
        CreateProfileRequest request, ClaimsPrincipal user, GoalsDbContext db,
        Clock clock, CancellationToken ct)
    {
        if (!IanaTimeZone.IsValid(request.TimeZone))
            return InvalidTimeZone();

        var existing = await db.Profiles.FindAsync([user.GetUserId()], ct);
        if (existing is not null)
            return Results.Ok(ToResponse(existing, clock));

        var profile = new Profile
        {
            UserId = user.GetUserId(),
            TimeZone = request.TimeZone!,
            WeekStart = WeekStart.Sunday,
        };
        db.Profiles.Add(profile);
        await db.SaveChangesAsync(ct);

        return Results.Created("/api/me", ToResponse(profile, clock));
    }

    // Partial update: only fields present in the request change.
    private static async Task<IResult> UpdateProfile(
        UpdateProfileRequest request, ClaimsPrincipal user, GoalsDbContext db,
        Clock clock, CancellationToken ct)
    {
        var profile = await db.Profiles.FindAsync([user.GetUserId()], ct);
        if (profile is null)
            return Results.NotFound();

        if (request.TimeZone is not null && !IanaTimeZone.IsValid(request.TimeZone))
            return InvalidTimeZone();

        var weekStart = profile.WeekStart;
        if (request.WeekStart is not null && !WeekStartNames.TryParse(request.WeekStart, out weekStart))
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["weekStart"] = ["Week start must be 'sunday' or 'monday'."],
            });

        profile.TimeZone = request.TimeZone ?? profile.TimeZone;
        profile.WeekStart = weekStart;
        await db.SaveChangesAsync(ct);

        return Results.Ok(ToResponse(profile, clock));
    }

    private static ProfileResponse ToResponse(Profile profile, Clock clock) =>
        new(profile.TimeZone, profile.WeekStart.ToName(), clock.TodayIn(profile.TimeZone));

    private static IResult InvalidTimeZone() =>
        Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["timeZone"] = ["Time zone must be a valid IANA time zone, e.g. 'America/New_York'."],
        });
}
