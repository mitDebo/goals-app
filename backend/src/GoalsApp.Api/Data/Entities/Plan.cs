using GoalsApp.Api.Data.Abstractions;

namespace GoalsApp.Api.Data.Entities;

// A reusable plan: a length in days and the goals in it. Runs (starting the plan on a date) are
// live-linked to it, so editing a plan changes every run of it.
public class Plan : IOwnedEntity, ITimestamped
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public required string Name { get; set; }
    public int LengthDays { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public List<PlanGoal> Goals { get; set; } = [];
}
