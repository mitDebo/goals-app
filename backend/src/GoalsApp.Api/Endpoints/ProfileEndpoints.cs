using System.Security.Claims;
using GoalsApp.Api.Core.Auth;
using GoalsApp.Api.Core.Results;
using GoalsApp.Api.Core.Time;
using GoalsApp.Api.Data.Entities;
using GoalsApp.Api.Services;

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
        ClaimsPrincipal user, ProfileService profiles, Clock clock, CancellationToken ct)
    {
        var result = await profiles.GetAsync(user.GetUserId(), ct);
        return result.ToHttp(profile => Results.Ok(ToResponse(profile, clock)));
    }

    // 201 when this call created the profile, 200 when it already existed.
    private static async Task<IResult> CreateProfile(
        CreateProfileRequest request, ClaimsPrincipal user, ProfileService profiles, Clock clock, CancellationToken ct)
    {
        var result = await profiles.EnsureAsync(user.GetUserId(), request.TimeZone, ct);
        return result.ToHttp(ensured => ensured.Created
            ? Results.Created("/api/me", ToResponse(ensured.Profile, clock))
            : Results.Ok(ToResponse(ensured.Profile, clock)));
    }

    private static async Task<IResult> UpdateProfile(
        UpdateProfileRequest request, ClaimsPrincipal user, ProfileService profiles, Clock clock, CancellationToken ct)
    {
        var result = await profiles.UpdateAsync(user.GetUserId(), request.TimeZone, request.WeekStart, ct);
        return result.ToHttp(profile => Results.Ok(ToResponse(profile, clock)));
    }

    private static ProfileResponse ToResponse(Profile profile, Clock clock) =>
        new(profile.TimeZone, profile.WeekStart.ToName(), clock.TodayIn(profile.TimeZone));
}
