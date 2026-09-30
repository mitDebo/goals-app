namespace GoalsApp.Api.Domain;

// A goal's type-specific settings. The concrete record *is* the goal's type, so a goal can only
// ever carry the settings (and target) that make sense for it.
public abstract record GoalSettings
{
    public abstract GoalType Type { get; }
}

// Yes/no. Its target is implicit: yes is a hit.
public sealed record BooleanSettings : GoalSettings
{
    public override GoalType Type => GoalType.Boolean;
}

// Whole numbers from Min to Max (Min < Max), optionally labelled at each end.
public sealed record RangeSettings(int Min, int Max, string? MinLabel, string? MaxLabel, Target? Target) : GoalSettings
{
    public override GoalType Type => GoalType.Range;
}

// Any decimal value, optionally with a unit ("miles").
public sealed record NumberSettings(string? Unit, Target? Target) : GoalSettings
{
    public override GoalType Type => GoalType.Number;
}

// Pick one option. When Ordered, the list order is the ranking from lowest (first) to highest
// (last). The target is the set of options marked IsTarget (none marked = no target).
public sealed record EnumSettings(bool Ordered, IReadOnlyList<EnumOption> Options) : GoalSettings
{
    public override GoalType Type => GoalType.Enum;
}

// Id is set for an option that already exists.
public sealed record EnumOption(string Label, string? Note, bool IsTarget, Guid? Id);

// A per-day target for range and number goals.
public sealed record Target(TargetComparison Comparison, decimal Value);
