using GoalsApp.Api.Time;

namespace GoalsApp.Api.UnitTests.Time;

// Spec: user-profile / "Edit settings": time zones must be valid IANA names.
public class IanaTimeZoneTests
{
    [Theory]
    [InlineData("America/New_York")]
    [InlineData("America/Chicago")]
    [InlineData("Europe/London")]
    [InlineData("Asia/Kolkata")]
    [InlineData("Etc/UTC")]
    public void Accepts_real_IANA_time_zones(string timeZone)
    {
        Assert.True(IanaTimeZone.IsValid(timeZone));
    }

    [Theory]
    [InlineData("Mars/Olympus")]
    [InlineData("Eastern Standard Time")] // a Windows id, not IANA
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Rejects_unknown_empty_and_Windows_ids(string? timeZone)
    {
        Assert.False(IanaTimeZone.IsValid(timeZone));
    }
}
