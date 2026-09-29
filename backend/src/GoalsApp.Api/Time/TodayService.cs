namespace GoalsApp.Api.Time;

public sealed class TodayService(TimeProvider timeProvider)
{
    public DateOnly TodayIn(string ianaTimeZoneId) =>
        throw new NotImplementedException();
}
