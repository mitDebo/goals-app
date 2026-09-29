namespace GoalsApp.Api.Profiles;

public enum WeekStart
{
    Sunday,
    Monday,
}

public static class WeekStartNames
{
    public const string Sunday = "sunday";
    public const string Monday = "monday";

    public static string ToName(this WeekStart weekStart) => weekStart switch
    {
        WeekStart.Sunday => Sunday,
        WeekStart.Monday => Monday,
        _ => throw new ArgumentOutOfRangeException(nameof(weekStart)),
    };

    public static bool TryParse(string? name, out WeekStart weekStart)
    {
        switch (name)
        {
            case Sunday: weekStart = WeekStart.Sunday; return true;
            case Monday: weekStart = WeekStart.Monday; return true;
            default: weekStart = default; return false;
        }
    }
}
