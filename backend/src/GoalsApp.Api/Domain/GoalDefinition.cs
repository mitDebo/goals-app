namespace GoalsApp.Api.Domain;

// A goal that has passed validation: trimmed, typed and complete. Only the settings for its own
// type are set (e.g. Range is null unless Type is Range).
public sealed record GoalDefinition(
    string Name,
    string? Description,
    GoalType Type,
    DisplayStyle DisplayStyle,
    GoalDefinition.RangeSettings? Range,
    GoalDefinition.NumberSettings? Number,
    GoalDefinition.EnumSettings? Enum,
    GoalDefinition.Target? NumericTarget)
{
    public sealed record RangeSettings(int Min, int Max, string? MinLabel, string? MaxLabel);

    public sealed record NumberSettings(string? Unit);

    // When Ordered, the list order is the ranking from lowest (first) to highest (last).
    public sealed record EnumSettings(bool Ordered, IReadOnlyList<EnumOption> Options);

    public sealed record EnumOption(string Label, string? Note, bool IsTarget, Guid? Id);

    public sealed record Target(TargetComparison Comparison, decimal Value);
}
