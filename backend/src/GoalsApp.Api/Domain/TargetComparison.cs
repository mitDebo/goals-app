namespace GoalsApp.Api.Domain;

public enum TargetComparison
{
    AtLeast,
    AtMost,
}

// Wire/database names: "at_least", "at_most".
public static class TargetComparisonNames
{
    public static string ToName(this TargetComparison comparison) => throw new NotImplementedException();

    public static bool TryParse(string? name, out TargetComparison comparison) => throw new NotImplementedException();
}
