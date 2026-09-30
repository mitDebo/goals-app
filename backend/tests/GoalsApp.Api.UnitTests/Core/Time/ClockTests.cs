using GoalsApp.Api.Core.Time;
using Microsoft.Extensions.Time.Testing;

namespace GoalsApp.Api.UnitTests.Core.Time;

// Spec: user-profile / "Server-computed today": the user's calendar date in their
// profile time zone, never the server's or the request's.
public class ClockTests
{
    private static DateOnly TodayAt(string utcInstant, string timeZone)
    {
        var time = new FakeTimeProvider(DateTimeOffset.Parse(utcInstant));
        return new Clock(time).TodayIn(timeZone);
    }

    [Fact]
    public void Evening_in_New_York_is_still_the_previous_UTC_day()
    {
        Assert.Equal(new DateOnly(2026, 3, 9), TodayAt("2026-03-10T02:00:00Z", "America/New_York"));
    }

    [Theory]
    // US daylight saving starts Sun 2026-03-08 at 02:00 local (clocks jump to 03:00).
    [InlineData("2026-03-08T06:59:00Z", "2026-03-08")] // 01:59 EST
    [InlineData("2026-03-08T07:00:00Z", "2026-03-08")] // 03:00 EDT
    [InlineData("2026-03-09T03:59:00Z", "2026-03-08")] // 23:59 EDT, offset now -4
    [InlineData("2026-03-09T04:00:00Z", "2026-03-09")] // midnight EDT
    // US daylight saving ends Sun 2026-11-01 at 02:00 local (clocks fall back to 01:00).
    [InlineData("2026-11-02T04:59:00Z", "2026-11-01")] // 23:59 EST, offset back to -5
    [InlineData("2026-11-02T05:00:00Z", "2026-11-02")] // midnight EST
    public void Daylight_saving_changes_move_midnight_correctly(string utcInstant, string expectedDay)
    {
        Assert.Equal(DateOnly.Parse(expectedDay), TodayAt(utcInstant, "America/New_York"));
    }

    [Theory]
    [InlineData("2026-03-09T18:29:00Z", "Asia/Kolkata", "2026-03-09")]       // +05:30, 23:59
    [InlineData("2026-03-09T18:30:00Z", "Asia/Kolkata", "2026-03-10")]       // +05:30, midnight
    [InlineData("2026-03-09T10:00:00Z", "Pacific/Kiritimati", "2026-03-10")] // +14:00
    [InlineData("2026-03-09T10:00:00Z", "Pacific/Pago_Pago", "2026-03-08")]  // -11:00
    public void Works_for_zones_far_from_UTC_and_with_half_hour_offsets(string utcInstant, string timeZone, string expectedDay)
    {
        Assert.Equal(DateOnly.Parse(expectedDay), TodayAt(utcInstant, timeZone));
    }
}
