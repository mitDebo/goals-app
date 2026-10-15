namespace GoalsApp.Api.Domain;

// A plan that has passed validation. Days are sorted and distinct.
public sealed record PlanDefinition(string Name, int LengthDays, IReadOnlyList<PlanDefinition.PlanGoal> Goals)
{
    public sealed record PlanGoal(Guid GoalId, IReadOnlyList<int>? Days, int? Times);
}
