using GoalsApp.Api.Core.Outcomes;

namespace GoalsApp.Api.Domain;

// All the rules for what makes a valid goal. Pure: no database, no HTTP.
// Errors are keyed by the field they belong to, e.g. "name", "range.max", "enum.options[1].label".
public static class GoalValidator
{
    public const int MaxNameLength = 100;
    public const int MaxRangeLabelLength = 40;
    public const int MaxUnitLength = 20;
    public const int MaxOptionLabelLength = 40;
    public const int MaxOptionNoteLength = 200;
    public const int MinOptions = 2;

    // Ranges with at most this many values default to buttons; larger ones to a slider.
    public const int MaxValuesForButtons = 11;

    public static Outcome<GoalDefinition> Validate(GoalDraft draft) => throw new NotImplementedException();
}
