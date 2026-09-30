namespace GoalsApp.Api.Domain;

// A goal as the user submitted it: raw and unchecked. GoalValidator turns it into a GoalDefinition.
// Numbers are decimals so that "7.5" can be rejected with a proper message instead of failing to parse.
public sealed record GoalDraft(
    string? Name,
    string? Description,
    string? Type,
    string? DisplayStyle = null,
    GoalDraft.RangeDraft? Range = null,
    GoalDraft.NumberDraft? Number = null,
    GoalDraft.EnumDraft? Enum = null,
    GoalDraft.TargetDraft? Target = null)
{
    public sealed record RangeDraft(decimal? Min, decimal? Max, string? MinLabel = null, string? MaxLabel = null);

    public sealed record NumberDraft(string? Unit);

    public sealed record EnumDraft(bool Ordered, IReadOnlyList<OptionDraft> Options);

    // Id is set for an existing option being kept; IsTarget marks it as a "good" option.
    public sealed record OptionDraft(string? Label, string? Note = null, bool IsTarget = false, Guid? Id = null);

    // For range and number goals only. Enum targets are chosen with OptionDraft.IsTarget.
    public sealed record TargetDraft(string? Comparison, decimal? Value);
}
