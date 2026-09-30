using System.Globalization;
using GoalsApp.Api.Core.Outcomes;
using GoalsApp.Api.Domain;
using static GoalsApp.Api.Domain.GoalDraft;

namespace GoalsApp.Api.UnitTests.Domain;

// Spec: goals / "Create a goal", "Range settings", "Number settings", "Enum settings",
// "Display style" and "Optional per-day target". Pure rules, no database.
public class GoalValidatorTests
{
    // ---- helpers ----

    private static GoalDraft BooleanGoal(string? name = "Read") => new(name, null, "boolean");

    private static GoalDraft RangeGoal(decimal? min, decimal? max, string? style = null, TargetDraft? target = null,
        string? minLabel = null, string? maxLabel = null) =>
        new("Focus", null, "range", style, Range: new RangeDraft(min, max, minLabel, maxLabel), Target: target);

    private static GoalDraft NumberGoal(string? unit = null, string? style = null, TargetDraft? target = null) =>
        new("Running", null, "number", style, Number: new NumberDraft(unit), Target: target);

    private static GoalDraft EnumGoal(params OptionDraft[] options) =>
        new("Mood", null, "enum", Enum: new EnumDraft(Ordered: true, options));

    private static OptionDraft[] Labels(params string[] labels) => [.. labels.Select(l => new OptionDraft(l))];

    private static GoalDefinition Valid(GoalDraft draft)
    {
        var outcome = GoalValidator.Validate(draft);
        Assert.True(outcome.IsSuccess,
            "Expected valid, got: " + string.Join("; ", outcome.Errors.Select(e => $"{e.Key}: {string.Join(" ", e.Value)}")));
        return outcome.Value;
    }

    private static IReadOnlyDictionary<string, string[]> Errors(GoalDraft draft)
    {
        var outcome = GoalValidator.Validate(draft);
        Assert.Equal(OutcomeStatus.Invalid, outcome.Status);
        return outcome.Errors;
    }

    // ---- name, description, type ----

    [Fact]
    public void A_boolean_goal_needs_only_a_name_and_type()
    {
        var goal = Valid(BooleanGoal("Read"));

        Assert.Equal("Read", goal.Name);
        Assert.Null(goal.Description);
        Assert.Equal(GoalType.Boolean, goal.Type);
        Assert.Null(goal.Range);
        Assert.Null(goal.Number);
        Assert.Null(goal.Enum);
        Assert.Null(goal.NumericTarget);
    }

    [Fact]
    public void Name_and_description_are_trimmed_and_a_blank_description_is_dropped()
    {
        Assert.Equal("Read", Valid(BooleanGoal("  Read  ")).Name);
        Assert.Equal("20 pages", Valid(BooleanGoal() with { Description = "  20 pages " }).Description);
        Assert.Null(Valid(BooleanGoal() with { Description = "   " }).Description);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void A_name_is_required(string? name)
    {
        Assert.Contains("name", Errors(BooleanGoal(name)).Keys);
    }

    [Fact]
    public void A_name_can_be_at_most_100_characters()
    {
        Valid(BooleanGoal(new string('a', 100)));
        Assert.Contains("name", Errors(BooleanGoal(new string('a', 101))).Keys);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("checklist")]
    [InlineData("Boolean")]
    public void The_type_must_be_one_of_the_four_kinds(string? type)
    {
        Assert.Contains("type", Errors(BooleanGoal() with { Type = type }).Keys);
    }

    [Fact]
    public void Settings_for_a_different_type_are_rejected()
    {
        Assert.Contains("range", Errors(BooleanGoal() with { Range = new RangeDraft(1, 5) }).Keys);
        Assert.Contains("number", Errors(RangeGoal(1, 5) with { Number = new NumberDraft("miles") }).Keys);
        Assert.Contains("enum", Errors(NumberGoal() with { Enum = new EnumDraft(false, Labels("a", "b")) }).Keys);
    }

    [Fact]
    public void Every_problem_is_reported_at_once()
    {
        var errors = Errors(new GoalDraft("", null, "checklist"));

        Assert.Contains("name", errors.Keys);
        Assert.Contains("type", errors.Keys);
    }

    // ---- range ----

    [Fact]
    public void A_range_can_be_negative_and_have_labels_at_each_end()
    {
        var goal = Valid(RangeGoal(-5, 5, minLabel: "😫", maxLabel: "🤩"));

        Assert.Equal(GoalType.Range, goal.Type);
        Assert.Equal(new GoalDefinition.RangeSettings(-5, 5, "😫", "🤩"), goal.Range);
    }

    [Fact]
    public void A_range_goal_needs_its_range_settings()
    {
        Assert.Contains("range", Errors(new GoalDraft("Focus", null, "range")).Keys);
    }

    [Fact]
    public void Both_ends_are_required()
    {
        Assert.Contains("range.min", Errors(RangeGoal(null, 10)).Keys);
        Assert.Contains("range.max", Errors(RangeGoal(1, null)).Keys);
    }

    [Fact]
    public void Both_ends_must_be_whole_numbers()
    {
        Assert.Contains("range.max", Errors(RangeGoal(1, 7.5m)).Keys);
        Assert.Contains("range.min", Errors(RangeGoal(0.5m, 10)).Keys);
        Assert.Contains("range.max", Errors(RangeGoal(1, 3_000_000_000m)).Keys);
    }

    [Theory]
    [InlineData(10, 10)]
    [InlineData(10, 1)]
    public void The_minimum_must_be_below_the_maximum(int min, int max)
    {
        Assert.Contains("range", Errors(RangeGoal(min, max)).Keys);
    }

    [Fact]
    public void End_labels_are_trimmed_optional_and_short()
    {
        var goal = Valid(RangeGoal(1, 10, minLabel: " wasted the day ", maxLabel: "  "));
        Assert.Equal("wasted the day", goal.Range!.MinLabel);
        Assert.Null(goal.Range.MaxLabel);

        Valid(RangeGoal(1, 10, minLabel: new string('a', 40)));
        Assert.Contains("range.minLabel", Errors(RangeGoal(1, 10, minLabel: new string('a', 41))).Keys);
        Assert.Contains("range.maxLabel", Errors(RangeGoal(1, 10, maxLabel: new string('a', 41))).Keys);
    }

    // ---- number ----

    [Fact]
    public void A_number_goal_can_have_a_unit()
    {
        var goal = Valid(NumberGoal(" miles "));

        Assert.Equal(GoalType.Number, goal.Type);
        Assert.Equal("miles", goal.Number!.Unit);
    }

    [Fact]
    public void A_number_goal_does_not_need_a_unit()
    {
        Assert.Null(Valid(NumberGoal(unit: null)).Number!.Unit);
        Assert.Null(Valid(NumberGoal(unit: "  ")).Number!.Unit);
        Assert.Null(Valid(new GoalDraft("Running", null, "number")).Number!.Unit);
    }

    [Fact]
    public void A_unit_can_be_at_most_20_characters()
    {
        Valid(NumberGoal(new string('a', 20)));
        Assert.Contains("number.unit", Errors(NumberGoal(new string('a', 21))).Keys);
    }

    // ---- enum ----

    [Fact]
    public void Enum_options_keep_their_order_labels_and_notes()
    {
        var goal = Valid(EnumGoal(new OptionDraft("😞", "bad"), new OptionDraft("😐", "meh"), new OptionDraft("😀", "good")));

        Assert.Equal(GoalType.Enum, goal.Type);
        Assert.True(goal.Enum!.Ordered);
        Assert.Equal(["😞", "😐", "😀"], goal.Enum.Options.Select(o => o.Label));
        Assert.Equal(["bad", "meh", "good"], goal.Enum.Options.Select(o => o.Note));
    }

    [Fact]
    public void An_enum_can_be_unordered()
    {
        var draft = EnumGoal(Labels("tea", "coffee")) with { Enum = new EnumDraft(Ordered: false, Labels("tea", "coffee")) };

        Assert.False(Valid(draft).Enum!.Ordered);
    }

    [Fact]
    public void Existing_option_ids_are_kept()
    {
        var id = Guid.NewGuid();

        var goal = Valid(EnumGoal(new OptionDraft("a", Id: id), new OptionDraft("b")));

        Assert.Equal([id, null], goal.Enum!.Options.Select(o => o.Id));
    }

    [Fact]
    public void An_enum_goal_needs_its_enum_settings()
    {
        Assert.Contains("enum", Errors(new GoalDraft("Mood", null, "enum")).Keys);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    public void An_enum_needs_at_least_two_options(int count)
    {
        var options = Labels("a", "b")[..count];

        Assert.Contains("enum.options", Errors(EnumGoal(options)).Keys);
    }

    [Fact]
    public void Option_labels_are_required_trimmed_and_short()
    {
        Assert.Equal(["a", "b"], Valid(EnumGoal(Labels(" a ", "b"))).Enum!.Options.Select(o => o.Label));
        Assert.Contains("enum.options[1].label", Errors(EnumGoal(Labels("a", "  "))).Keys);
        Assert.Contains("enum.options[0].label", Errors(EnumGoal(new OptionDraft(null), new OptionDraft("b"))).Keys);

        Valid(EnumGoal(Labels(new string('a', 40), "b")));
        Assert.Contains("enum.options[0].label", Errors(EnumGoal(Labels(new string('a', 41), "b"))).Keys);
    }

    [Fact]
    public void Option_notes_are_optional_and_at_most_200_characters()
    {
        Assert.Null(Valid(EnumGoal(new OptionDraft("a", "  "), new OptionDraft("b"))).Enum!.Options[0].Note);

        Valid(EnumGoal(new OptionDraft("a", new string('n', 200)), new OptionDraft("b")));
        Assert.Contains("enum.options[0].note",
            Errors(EnumGoal(new OptionDraft("a", new string('n', 201)), new OptionDraft("b"))).Keys);
    }

    [Fact]
    public void Option_labels_must_be_unique()
    {
        Assert.Contains("enum.options", Errors(EnumGoal(Labels("😀", "😐", "😀"))).Keys);
        Assert.Contains("enum.options", Errors(EnumGoal(Labels("😀", " 😀 "))).Keys);
    }

    // ---- display style ----

    [Theory]
    [InlineData(1, 5, DisplayStyle.Buttons)]
    [InlineData(1, 11, DisplayStyle.Buttons)]
    [InlineData(0, 10, DisplayStyle.Buttons)]
    [InlineData(1, 12, DisplayStyle.Slider)]
    [InlineData(-50, 50, DisplayStyle.Slider)]
    public void A_range_without_a_style_gets_buttons_for_up_to_11_values_else_a_slider(int min, int max, DisplayStyle expected)
    {
        Assert.Equal(expected, Valid(RangeGoal(min, max)).DisplayStyle);
    }

    [Theory]
    [InlineData("slider", DisplayStyle.Slider)]
    [InlineData("dial", DisplayStyle.Dial)]
    [InlineData("buttons", DisplayStyle.Buttons)]
    [InlineData("stepper", DisplayStyle.Stepper)]
    [InlineData("emoji_scale", DisplayStyle.EmojiScale)]
    public void A_range_can_use_any_range_style(string style, DisplayStyle expected)
    {
        Assert.Equal(expected, Valid(RangeGoal(1, 100, style)).DisplayStyle);
    }

    [Fact]
    public void Other_types_get_their_single_style()
    {
        Assert.Equal(DisplayStyle.Toggle, Valid(BooleanGoal()).DisplayStyle);
        Assert.Equal(DisplayStyle.Input, Valid(NumberGoal()).DisplayStyle);
        Assert.Equal(DisplayStyle.Options, Valid(EnumGoal(Labels("a", "b"))).DisplayStyle);
        Assert.Equal(DisplayStyle.Toggle, Valid(BooleanGoal() with { DisplayStyle = "toggle" }).DisplayStyle);
    }

    [Theory]
    [InlineData("number", "dial")]
    [InlineData("boolean", "slider")]
    [InlineData("range", "toggle")]
    [InlineData("range", "sparkles")]
    public void A_style_must_suit_the_type(string type, string style)
    {
        var draft = type switch
        {
            "number" => NumberGoal(style: style),
            "boolean" => BooleanGoal() with { DisplayStyle = style },
            _ => RangeGoal(1, 5, style),
        };

        Assert.Contains("displayStyle", Errors(draft).Keys);
    }

    // ---- targets ----

    [Fact]
    public void Goals_have_no_target_unless_one_is_given()
    {
        Assert.Null(Valid(NumberGoal()).NumericTarget);
        Assert.Null(Valid(RangeGoal(1, 10)).NumericTarget);
        Assert.All(Valid(EnumGoal(Labels("a", "b"))).Enum!.Options, o => Assert.False(o.IsTarget));
    }

    [Theory]
    [InlineData("at_most", "2", TargetComparison.AtMost)]
    [InlineData("at_least", "2.5", TargetComparison.AtLeast)]
    [InlineData("at_least", "-3", TargetComparison.AtLeast)]
    public void A_number_target_is_a_comparison_and_any_value(string comparison, string valueText, TargetComparison expected)
    {
        var value = decimal.Parse(valueText, CultureInfo.InvariantCulture);
        var goal = Valid(NumberGoal(target: new TargetDraft(comparison, value)));

        Assert.Equal(new GoalDefinition.Target(expected, value), goal.NumericTarget);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(7)]
    [InlineData(10)]
    public void A_range_target_is_a_whole_number_within_the_range(int value)
    {
        var goal = Valid(RangeGoal(1, 10, target: new TargetDraft("at_least", value)));

        Assert.Equal(new GoalDefinition.Target(TargetComparison.AtLeast, value), goal.NumericTarget);
    }

    [Theory]
    [InlineData("12")]
    [InlineData("0")]
    [InlineData("7.5")]
    public void A_range_target_outside_the_range_or_fractional_is_rejected(string valueText)
    {
        var value = decimal.Parse(valueText, CultureInfo.InvariantCulture);
        Assert.Contains("target.value", Errors(RangeGoal(1, 10, target: new TargetDraft("at_least", value))).Keys);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("exactly")]
    public void A_target_needs_a_known_comparison(string? comparison)
    {
        Assert.Contains("target.comparison", Errors(NumberGoal(target: new TargetDraft(comparison, 2))).Keys);
    }

    [Fact]
    public void A_target_needs_a_value()
    {
        Assert.Contains("target.value", Errors(NumberGoal(target: new TargetDraft("at_most", null))).Keys);
    }

    [Fact]
    public void Boolean_goals_do_not_take_a_target()
    {
        Assert.Contains("target", Errors(BooleanGoal() with { Target = new TargetDraft("at_least", 1) }).Keys);
    }

    [Fact]
    public void Enum_targets_are_the_options_marked_good()
    {
        var goal = Valid(EnumGoal(new OptionDraft("😞"), new OptionDraft("😐", IsTarget: true), new OptionDraft("😀", IsTarget: true)));

        Assert.Equal([false, true, true], goal.Enum!.Options.Select(o => o.IsTarget));
        Assert.Null(goal.NumericTarget);
    }

    [Fact]
    public void Enum_goals_do_not_take_a_comparison_target()
    {
        var draft = EnumGoal(Labels("a", "b")) with { Target = new TargetDraft("at_least", 1) };

        Assert.Contains("target", Errors(draft).Keys);
    }
}
