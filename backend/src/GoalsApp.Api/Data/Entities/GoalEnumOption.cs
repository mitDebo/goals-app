using GoalsApp.Api.Data.Abstractions;

namespace GoalsApp.Api.Data.Entities;

// One option of an enum goal. Results (change 05) will point at options by Id.
public class GoalEnumOption : IOwnedEntity
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid GoalId { get; set; }
    public required string Label { get; set; }
    public string? Note { get; set; }

    // Order within the goal; for an ordered enum this is the ranking (lowest first).
    public int Position { get; set; }

    public bool IsTarget { get; set; }

    // Used from change 07 (retiring options that have results).
    public DateTimeOffset? RetiredAt { get; set; }
}
