using GoalsApp.Api.Data.Abstractions;

namespace GoalsApp.Api.Data.Entities;

// One goal in a plan, due either on certain plan days (Days) or a number of times on any days (Times).
// Exactly one of the two is set.
public class PlanGoal : IOwnedEntity
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid PlanId { get; set; }
    public Guid GoalId { get; set; }
    public Goal Goal { get; set; } = null!;

    // Order within the plan (rows on the sheet).
    public int Position { get; set; }

    // Plan day numbers, 1 = the run's start date.
    public List<int>? Days { get; set; }
    public int? Times { get; set; }
}
