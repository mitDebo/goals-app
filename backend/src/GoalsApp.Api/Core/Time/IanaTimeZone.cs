namespace GoalsApp.Api.Core.Time;

public static class IanaTimeZone
{
    // .NET on Linux also resolves Windows ids ("Eastern Standard Time"),
    // so require the zone to actually carry an IANA id.
    public static bool IsValid(string? timeZoneId) =>
        !string.IsNullOrWhiteSpace(timeZoneId)
        && TimeZoneInfo.TryFindSystemTimeZoneById(timeZoneId, out var zone)
        && zone.HasIanaId;
}
