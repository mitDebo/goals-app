namespace GoalsApp.Api.Domain;

// A plan as the user submitted it: raw and unchecked. PlanValidator turns it into a PlanDefinition.
public sealed record PlanDraft(string? Name, int? LengthDays, IReadOnlyList<PlanDraft.PlanGoalDraft>? Goals)
{
    // Exactly one of Days (plan day numbers, 1 = the run's start date) or Times ("N times, any days").
    public sealed record PlanGoalDraft(Guid? GoalId, IReadOnlyList<int>? Days = null, int? Times = null);
}
