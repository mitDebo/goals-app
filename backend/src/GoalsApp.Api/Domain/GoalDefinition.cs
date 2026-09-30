namespace GoalsApp.Api.Domain;

// A goal that has passed validation: trimmed, typed and complete.
public sealed record GoalDefinition(string Name, string? Description, DisplayStyle DisplayStyle, GoalSettings Settings)
{
    public GoalType Type => Settings.Type;
}
