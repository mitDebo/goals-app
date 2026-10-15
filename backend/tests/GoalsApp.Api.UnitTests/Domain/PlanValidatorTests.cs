using GoalsApp.Api.Core.Outcomes;
using GoalsApp.Api.Domain;
using static GoalsApp.Api.Domain.PlanDraft;

namespace GoalsApp.Api.UnitTests.Domain;

// Prototype: a handful of checks on the rules that are easy to get subtly wrong.
public class PlanValidatorTests
{
    private static readonly Guid Read = Guid.NewGuid();
    private static readonly Guid Run = Guid.NewGuid();

    private static Outcome<PlanDefinition> Validate(int length, params PlanGoalDraft[] goals) =>
        PlanValidator.Validate(new PlanDraft("Work", length, goals));

    [Fact]
    public void Days_are_kept_sorted_and_distinct()
    {
        var plan = Validate(7, new PlanGoalDraft(Read, Days: [4, 1, 3, 1])).Value;

        Assert.Equal([1, 3, 4], plan.Goals[0].Days);
        Assert.Null(plan.Goals[0].Times);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(8)]
    public void Days_must_fall_inside_the_plan(int day)
    {
        Assert.Contains("goals[0].days", Validate(7, new PlanGoalDraft(Read, Days: [1, day])).Errors.Keys);
    }

    [Fact]
    public void A_goal_is_either_days_or_times()
    {
        Assert.Contains("goals[0]", Validate(7, new PlanGoalDraft(Read)).Errors.Keys);
        Assert.Contains("goals[0]", Validate(7, new PlanGoalDraft(Read, Days: [1], Times: 2)).Errors.Keys);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(8)]
    public void Times_must_be_between_one_and_the_plan_length(int times)
    {
        Assert.Contains("goals[0].times", Validate(7, new PlanGoalDraft(Run, Times: times)).Errors.Keys);
    }

    [Fact]
    public void A_goal_can_only_be_in_a_plan_once()
    {
        Assert.Contains("goals", Validate(7, new PlanGoalDraft(Read, Days: [1]), new PlanGoalDraft(Read, Times: 2)).Errors.Keys);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(367)]
    public void A_plan_lasts_between_1_and_366_days(int length)
    {
        Assert.Contains("lengthDays", Validate(length).Errors.Keys);
    }
}
