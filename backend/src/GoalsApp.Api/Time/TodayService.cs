namespace GoalsApp.Api.Time;

// "Today" for a user: the current instant converted to their IANA time zone.
// Always uses the profile's zone, never the server's or the request's.
public sealed class TodayService(TimeProvider timeProvider)
{
    public DateOnly TodayIn(string ianaTimeZoneId)
    {
        var zone = TimeZoneInfo.FindSystemTimeZoneById(ianaTimeZoneId);
        var local = TimeZoneInfo.ConvertTime(timeProvider.GetUtcNow(), zone);
        return DateOnly.FromDateTime(local.DateTime);
    }
}
