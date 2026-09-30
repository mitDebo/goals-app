using GoalsApp.Api.Core.Enums;
using GoalsApp.Api.Core.Time;

namespace GoalsApp.Api.UnitTests.Core.Time;

public class WeekStartTests
{
    [Theory]
    [InlineData(WeekStart.Sunday, "sunday")]
    [InlineData(WeekStart.Monday, "monday")]
    public void Names_round_trip(WeekStart weekStart, string name)
    {
        Assert.Equal(name, EnumNames.ToName(weekStart));
        Assert.True(EnumNames.TryParse<WeekStart>(name, out var parsed));
        Assert.Equal(weekStart, parsed);
    }
}
