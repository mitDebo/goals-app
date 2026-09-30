using GoalsApp.Api.Core.Outcomes;
using GoalsApp.Api.Data.Entities;
using GoalsApp.Api.Domain;
using GoalsApp.Api.Services;
using GoalsApp.Api.UnitTests.Infrastructure;
using static GoalsApp.Api.Domain.GoalDraft;

namespace GoalsApp.Api.UnitTests.Services;

// Spec: goals / "Create a goal", "Edit a goal", "Goal order". The validation rules themselves
// are covered in GoalValidatorTests; these check what the service does with a valid goal.
public class GoalServiceTests
{
    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    private static Goal ExistingGoal(string name, int position) =>
        new() { Id = Guid.NewGuid(), Name = name, Type = GoalType.Boolean, DisplayStyle = DisplayStyle.Toggle, Position = position };

    private static GoalEnumOption Option(string label, int position) =>
        new() { Id = Guid.NewGuid(), Label = label, Position = position };

    private static Goal ExistingMood(params GoalEnumOption[] options) => new()
    {
        Id = Guid.NewGuid(),
        Name = "Mood",
        Type = GoalType.Enum,
        DisplayStyle = DisplayStyle.Options,
        EnumOrdered = true,
        Options = [.. options],
    };

    private static GoalDraft BooleanDraft(string name) => new(name, null, "boolean");

    // ---- create ----

    [Fact]
    public async Task A_new_goal_goes_last()
    {
        var repository = new FakeGoalRepository().With(ExistingGoal("A", 0), ExistingGoal("B", 1));
        var service = new GoalService(repository);

        var created = (await service.CreateAsync(BooleanDraft("C"), Ct)).Value;

        Assert.Equal(2, created.Position);
        Assert.NotEqual(Guid.Empty, created.Id);
        Assert.Equal(1, repository.SaveCount);
    }

    [Fact]
    public async Task The_first_goal_is_at_position_zero()
    {
        var created = (await new GoalService(new FakeGoalRepository()).CreateAsync(BooleanDraft("Read"), Ct)).Value;

        Assert.Equal(0, created.Position);
    }

    [Fact]
    public async Task Range_settings_and_target_are_stored_in_their_columns()
    {
        var draft = new GoalDraft("Focus", " How focused? ", "range",
            Range: new RangeDraft(-5, 5, "😫", "🤩"), Target: new TargetDraft("at_least", 3));

        var goal = (await new GoalService(new FakeGoalRepository()).CreateAsync(draft, Ct)).Value;

        Assert.Equal("Focus", goal.Name);
        Assert.Equal("How focused?", goal.Description);
        Assert.Equal(GoalType.Range, goal.Type);
        Assert.Equal(DisplayStyle.Buttons, goal.DisplayStyle);
        Assert.Equal(-5, goal.RangeMin);
        Assert.Equal(5, goal.RangeMax);
        Assert.Equal(("😫", "🤩"), (goal.RangeMinLabel, goal.RangeMaxLabel));
        Assert.Equal(TargetComparison.AtLeast, goal.TargetComparison);
        Assert.Equal(3m, goal.TargetValue);
        Assert.Null(goal.NumberUnit);
        Assert.Null(goal.EnumOrdered);
        Assert.Empty(goal.Options);
    }

    [Fact]
    public async Task Enum_options_are_stored_in_order_with_their_targets()
    {
        var draft = new GoalDraft("Mood", null, "enum", Enum: new EnumDraft(true,
            [new OptionDraft("😞", "bad"), new OptionDraft("😐", IsTarget: true), new OptionDraft("😀", IsTarget: true)]));

        var goal = (await new GoalService(new FakeGoalRepository()).CreateAsync(draft, Ct)).Value;

        Assert.True(goal.EnumOrdered);
        Assert.Equal(["😞", "😐", "😀"], goal.Options.Select(o => o.Label));
        Assert.Equal([0, 1, 2], goal.Options.Select(o => o.Position));
        Assert.Equal([false, true, true], goal.Options.Select(o => o.IsTarget));
        Assert.Equal("bad", goal.Options[0].Note);
        Assert.All(goal.Options, o => Assert.NotEqual(Guid.Empty, o.Id));
        Assert.Null(goal.TargetComparison);
    }

    [Fact]
    public async Task An_invalid_goal_is_rejected_and_nothing_is_saved()
    {
        var repository = new FakeGoalRepository();

        var outcome = await new GoalService(repository).CreateAsync(BooleanDraft(""), Ct);

        Assert.Equal(OutcomeStatus.Invalid, outcome.Status);
        Assert.Contains("name", outcome.Errors.Keys);
        Assert.Equal(0, repository.SaveCount);
    }

    // ---- get ----

    [Fact]
    public async Task Getting_an_unknown_goal_is_not_found()
    {
        var outcome = await new GoalService(new FakeGoalRepository()).GetAsync(Guid.NewGuid(), Ct);

        Assert.Equal(OutcomeStatus.NotFound, outcome.Status);
    }

    // ---- update ----

    [Fact]
    public async Task Updating_an_unknown_goal_is_not_found()
    {
        var outcome = await new GoalService(new FakeGoalRepository()).UpdateAsync(Guid.NewGuid(), BooleanDraft("Read"), Ct);

        Assert.Equal(OutcomeStatus.NotFound, outcome.Status);
    }

    [Fact]
    public async Task Updating_keeps_options_by_id_creates_new_ones_and_removes_missing_ones()
    {
        var (bad, meh, good) = (Option("😞", 0), Option("😐", 1), Option("😀", 2));
        var mood = ExistingMood(bad, meh, good);
        var repository = new FakeGoalRepository().With(mood);
        var draft = new GoalDraft("Mood", null, "enum", Enum: new EnumDraft(true,
            [new OptionDraft("😀", Id: good.Id), new OptionDraft("🤔"), new OptionDraft("😞", "awful", Id: bad.Id)]));

        var updated = (await new GoalService(repository).UpdateAsync(mood.Id, draft, Ct)).Value;

        Assert.Equal(["😀", "🤔", "😞"], updated.Options.Select(o => o.Label));
        Assert.Equal([0, 1, 2], updated.Options.Select(o => o.Position));
        Assert.Same(good, updated.Options[0]);
        Assert.Same(bad, updated.Options[2]);
        Assert.Equal("awful", bad.Note);
        Assert.NotEqual(Guid.Empty, updated.Options[1].Id);
        Assert.Equal([meh], repository.RemovedOptions);
        Assert.Equal(1, repository.SaveCount);
    }

    [Fact]
    public async Task An_option_id_from_elsewhere_is_rejected()
    {
        var mood = ExistingMood(Option("😞", 0), Option("😀", 1));
        var repository = new FakeGoalRepository().With(mood);
        var draft = new GoalDraft("Mood", null, "enum", Enum: new EnumDraft(true,
            [new OptionDraft("😞", Id: Guid.NewGuid()), new OptionDraft("😀")]));

        var outcome = await new GoalService(repository).UpdateAsync(mood.Id, draft, Ct);

        Assert.Equal(OutcomeStatus.Invalid, outcome.Status);
        Assert.Contains("enum.options[0].id", outcome.Errors.Keys);
        Assert.Equal(0, repository.SaveCount);
    }

    [Fact]
    public async Task Changing_the_type_clears_the_old_settings()
    {
        var mood = ExistingMood(Option("😞", 0), Option("😀", 1));
        var repository = new FakeGoalRepository().With(mood);

        var updated = (await new GoalService(repository).UpdateAsync(mood.Id,
            new GoalDraft("Miles", null, "number", Number: new NumberDraft("miles")), Ct)).Value;

        Assert.Equal(GoalType.Number, updated.Type);
        Assert.Equal(DisplayStyle.Input, updated.DisplayStyle);
        Assert.Equal("miles", updated.NumberUnit);
        Assert.Null(updated.EnumOrdered);
        Assert.Empty(updated.Options);
        Assert.Equal(2, repository.RemovedOptions.Count);
    }

    [Fact]
    public async Task Leaving_out_the_target_removes_it()
    {
        var goal = ExistingGoal("Drinks", 0);
        goal.Type = GoalType.Number;
        goal.DisplayStyle = DisplayStyle.Input;
        goal.TargetComparison = TargetComparison.AtMost;
        goal.TargetValue = 2;
        var repository = new FakeGoalRepository().With(goal);

        var updated = (await new GoalService(repository).UpdateAsync(goal.Id, new GoalDraft("Drinks", null, "number"), Ct)).Value;

        Assert.Null(updated.TargetComparison);
        Assert.Null(updated.TargetValue);
    }

    [Fact]
    public async Task An_invalid_update_changes_nothing()
    {
        var goal = ExistingGoal("Read", 0);
        var repository = new FakeGoalRepository().With(goal);

        var outcome = await new GoalService(repository).UpdateAsync(goal.Id, BooleanDraft("  "), Ct);

        Assert.Equal(OutcomeStatus.Invalid, outcome.Status);
        Assert.Equal("Read", goal.Name);
        Assert.Equal(0, repository.SaveCount);
    }

    // ---- reorder ----

    [Fact]
    public async Task Reordering_sets_positions_in_the_given_order()
    {
        var (a, b, c) = (ExistingGoal("A", 0), ExistingGoal("B", 1), ExistingGoal("C", 2));
        var repository = new FakeGoalRepository().With(a, b, c);

        var reordered = (await new GoalService(repository).ReorderAsync([c.Id, a.Id, b.Id], Ct)).Value;

        Assert.Equal(["C", "A", "B"], reordered.Select(g => g.Name));
        Assert.Equal((0, 1, 2), (c.Position, a.Position, b.Position));
        Assert.Equal(1, repository.SaveCount);
    }

    [Theory]
    [InlineData("missing")]
    [InlineData("extra")]
    [InlineData("duplicate")]
    public async Task The_new_order_must_list_every_goal_exactly_once(string problem)
    {
        var (a, b) = (ExistingGoal("A", 0), ExistingGoal("B", 1));
        var repository = new FakeGoalRepository().With(a, b);
        Guid[] ids = problem switch
        {
            "missing" => [b.Id],
            "extra" => [b.Id, a.Id, Guid.NewGuid()],
            _ => [b.Id, a.Id, a.Id],
        };

        var outcome = await new GoalService(repository).ReorderAsync(ids, Ct);

        Assert.Equal(OutcomeStatus.Invalid, outcome.Status);
        Assert.Contains("goalIds", outcome.Errors.Keys);
        Assert.Equal((0, 1), (a.Position, b.Position));
        Assert.Equal(0, repository.SaveCount);
    }
}
