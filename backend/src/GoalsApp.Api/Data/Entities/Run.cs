using GoalsApp.Api.Data.Abstractions;

namespace GoalsApp.Api.Data.Entities;

// A plan started on a date. Live-linked to its plan: what's due is worked out from the plan's
// current goals, so only the run's dates and its achievements are stored here.
public class Run : IOwnedEntity, ITimestamped
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid PlanId { get; set; }
    public Plan Plan { get; set; } = null!;

    // Day 1 of the plan. Both dates are inclusive.
    public DateOnly StartDate { get; set; }

    // Prefilled from the plan's length, but each run can end on its own date.
    public DateOnly EndDate { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public List<Achievement> Achievements { get; set; } = [];
}
