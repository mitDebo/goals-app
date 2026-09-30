namespace GoalsApp.Api.Domain;

public enum GoalType
{
    Boolean,
    Range,
    Number,
    Enum,
}

// Wire/database names: "boolean", "range", "number", "enum".
public static class GoalTypeNames
{
    public static string ToName(this GoalType type) => throw new NotImplementedException();

    public static bool TryParse(string? name, out GoalType type) => throw new NotImplementedException();
}
