using GoalsApp.Api.Core.Enums;
using GoalsApp.Api.Core.Outcomes;
using static GoalsApp.Api.Domain.GoalDraft;

namespace GoalsApp.Api.Domain;

// All the rules for what makes a valid goal. Pure: no database, no HTTP.
// Errors are keyed by the field they belong to, e.g. "name", "range.max", "enum.options[1].label",
// and every problem is reported at once so a form can show them all.
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

    private static readonly DisplayStyle[] RangeStyles =
        [DisplayStyle.Slider, DisplayStyle.Dial, DisplayStyle.Buttons, DisplayStyle.Stepper, DisplayStyle.EmojiScale];

    public static Outcome<GoalDefinition> Validate(GoalDraft draft)
    {
        var errors = new ErrorList();

        var name = Clean(draft.Name);
        if (name is null)
            errors.Add("name", "A name is required.");
        else if (name.Length > MaxNameLength)
            errors.Add("name", $"Name must be at most {MaxNameLength} characters.");

        GoalSettings? settings = null;
        DisplayStyle? style = null;
        if (!EnumNames.TryParse<GoalType>(draft.Type, out var type))
        {
            errors.Add("type", "Type must be 'boolean', 'range', 'number' or 'enum'.");
        }
        else
        {
            RejectOtherTypesSettings(draft, type, errors);
            settings = type switch
            {
                GoalType.Boolean => ValidateBoolean(draft, errors),
                GoalType.Range => ValidateRange(draft, errors),
                GoalType.Number => ValidateNumber(draft, errors),
                _ => ValidateEnum(draft, errors),
            };
            style = ValidateStyle(draft.DisplayStyle, type, settings as RangeSettings, errors);
        }

        if (errors.Count > 0)
            return Outcome<GoalDefinition>.Invalid(errors.ToDictionary());

        return new GoalDefinition(name!, Clean(draft.Description), style!.Value, settings!);
    }

    private static void RejectOtherTypesSettings(GoalDraft draft, GoalType type, ErrorList errors)
    {
        if (draft.Range is not null && type != GoalType.Range)
            errors.Add("range", "Range settings are only for range goals.");
        if (draft.Number is not null && type != GoalType.Number)
            errors.Add("number", "Number settings are only for number goals.");
        if (draft.Enum is not null && type != GoalType.Enum)
            errors.Add("enum", "Options are only for enum goals.");
    }

    private static BooleanSettings ValidateBoolean(GoalDraft draft, ErrorList errors)
    {
        if (draft.Target is not null)
            errors.Add("target", "Yes/no goals don't take a target: yes is always a hit.");
        return new BooleanSettings();
    }

    private static RangeSettings? ValidateRange(GoalDraft draft, ErrorList errors)
    {
        if (draft.Range is not { } range)
        {
            errors.Add("range", "A range goal needs a minimum and a maximum.");
            return null;
        }

        var before = errors.Count;
        var min = WholeNumber(range.Min, "range.min", "Minimum", errors);
        var max = WholeNumber(range.Max, "range.max", "Maximum", errors);
        var validEnds = min is not null && max is not null && min < max;
        if (min is not null && max is not null && !validEnds)
            errors.Add("range", "Minimum must be less than maximum.");

        var minLabel = ShortText(range.MinLabel, MaxRangeLabelLength, "range.minLabel", "Label", errors);
        var maxLabel = ShortText(range.MaxLabel, MaxRangeLabelLength, "range.maxLabel", "Label", errors);
        var target = ValidateTarget(draft.Target, validEnds ? (min!.Value, max!.Value) : null, errors);

        return errors.Count == before ? new RangeSettings(min!.Value, max!.Value, minLabel, maxLabel, target) : null;
    }

    private static NumberSettings? ValidateNumber(GoalDraft draft, ErrorList errors)
    {
        var before = errors.Count;
        var unit = ShortText(draft.Number?.Unit, MaxUnitLength, "number.unit", "Unit", errors);
        var target = ValidateTarget(draft.Target, wholeNumbersWithin: null, errors);
        return errors.Count == before ? new NumberSettings(unit, target) : null;
    }

    private static EnumSettings? ValidateEnum(GoalDraft draft, ErrorList errors)
    {
        if (draft.Target is not null)
            errors.Add("target", "Enum targets are set by marking the good options.");

        if (draft.Enum is not { } settings)
        {
            errors.Add("enum", "An enum goal needs its options.");
            return null;
        }

        var before = errors.Count;
        var drafts = settings.Options ?? [];
        if (drafts.Count < MinOptions)
            errors.Add("enum.options", $"At least {MinOptions} options are required.");

        var options = new List<EnumOption>();
        for (var i = 0; i < drafts.Count; i++)
        {
            var label = Clean(drafts[i].Label);
            if (label is null)
                errors.Add($"enum.options[{i}].label", "Each option needs a label.");
            else if (label.Length > MaxOptionLabelLength)
                errors.Add($"enum.options[{i}].label", $"Labels must be at most {MaxOptionLabelLength} characters.");

            var note = ShortText(drafts[i].Note, MaxOptionNoteLength, $"enum.options[{i}].note", "Note", errors);
            options.Add(new EnumOption(label ?? "", note, drafts[i].IsTarget, drafts[i].Id));
        }

        var hasDuplicates = options
            .Where(o => o.Label != "")
            .GroupBy(o => o.Label, StringComparer.Ordinal)
            .Any(g => g.Count() > 1);
        if (hasDuplicates)
            errors.Add("enum.options", "Option labels must be unique.");

        return errors.Count == before ? new EnumSettings(settings.Ordered, options) : null;
    }

    // For range goals, wholeNumbersWithin is the valid range (null if the range itself is invalid,
    // in which case only the value's own shape is checked). For number goals it is null.
    private static Target? ValidateTarget(TargetDraft? target, (int Min, int Max)? wholeNumbersWithin, ErrorList errors)
    {
        if (target is null)
            return null;

        var before = errors.Count;
        if (!EnumNames.TryParse<TargetComparison>(target.Comparison, out var comparison))
            errors.Add("target.comparison", "Comparison must be 'at_least' or 'at_most'.");

        if (target.Value is not { } value)
            errors.Add("target.value", "A target value is required.");
        else if (wholeNumbersWithin is not null && value != decimal.Truncate(value))
            errors.Add("target.value", "A range target must be a whole number.");
        else if (wholeNumbersWithin is { } bounds && (value < bounds.Min || value > bounds.Max))
            errors.Add("target.value", $"Target must be between {bounds.Min} and {bounds.Max}.");

        return errors.Count == before ? new Target(comparison, target.Value!.Value) : null;
    }

    private static DisplayStyle? ValidateStyle(string? requested, GoalType type, RangeSettings? range, ErrorList errors)
    {
        if (requested is null)
            return DefaultStyle(type, range);

        if (EnumNames.TryParse<DisplayStyle>(requested, out var style) && AllowedStyles(type).Contains(style))
            return style;

        errors.Add("displayStyle", $"'{requested}' is not a display style for {type.ToName()} goals.");
        return null;
    }

    private static DisplayStyle? DefaultStyle(GoalType type, RangeSettings? range) => type switch
    {
        GoalType.Boolean => DisplayStyle.Toggle,
        GoalType.Number => DisplayStyle.Input,
        GoalType.Enum => DisplayStyle.Options,
        // An invalid range has already been reported; there is nothing to base a default on.
        _ when range is null => null,
        _ => (long)range.Max - range.Min + 1 <= MaxValuesForButtons ? DisplayStyle.Buttons : DisplayStyle.Slider,
    };

    private static DisplayStyle[] AllowedStyles(GoalType type) => type switch
    {
        GoalType.Boolean => [DisplayStyle.Toggle],
        GoalType.Number => [DisplayStyle.Input],
        GoalType.Enum => [DisplayStyle.Options],
        _ => RangeStyles,
    };

    // A required whole number that fits in an int, or null (with an error) if it isn't one.
    private static int? WholeNumber(decimal? value, string field, string label, ErrorList errors)
    {
        if (value is not { } number)
        {
            errors.Add(field, $"{label} is required.");
            return null;
        }

        if (number != decimal.Truncate(number) || number < int.MinValue || number > int.MaxValue)
        {
            errors.Add(field, $"{label} must be a whole number.");
            return null;
        }

        return (int)number;
    }

    // Optional text: trimmed, blank means not given, and at most maxLength characters.
    private static string? ShortText(string? value, int maxLength, string field, string label, ErrorList errors)
    {
        var text = Clean(value);
        if (text is not null && text.Length > maxLength)
            errors.Add(field, $"{label} must be at most {maxLength} characters.");
        return text;
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private sealed class ErrorList
    {
        private readonly Dictionary<string, List<string>> _errors = [];

        // Total messages, so "did this step add an error?" works even for a field that already had one.
        public int Count => _errors.Values.Sum(m => m.Count);

        public void Add(string field, string message)
        {
            if (!_errors.TryGetValue(field, out var messages))
                _errors[field] = messages = [];
            messages.Add(message);
        }

        public IReadOnlyDictionary<string, string[]> ToDictionary() =>
            _errors.ToDictionary(e => e.Key, e => e.Value.ToArray());
    }
}
