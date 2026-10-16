using GoalsApp.Api.Data.Abstractions;

namespace GoalsApp.Api.Data.Entities;

// A tick: this goal was done on this date, in this run. A row existing means "done";
// unticking deletes it. Kept when the goal is removed from the plan, so re-adding it
// brings the ticks back.
public class Achievement : IOwnedEntity
{
    public Guid UserId { get; set; }
    public Guid RunId { get; set; }
    public Guid GoalId { get; set; }
    public DateOnly Date { get; set; }
}
