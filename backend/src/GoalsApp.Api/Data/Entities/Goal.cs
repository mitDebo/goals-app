using GoalsApp.Api.Data.Abstractions;
using GoalsApp.Api.Domain;

namespace GoalsApp.Api.Data.Entities;

// One row per goal. Type-specific settings live in nullable columns (single-table design);
// CHECK constraints keep each row consistent with its type.
public class Goal : IOwnedEntity, ITimestamped
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public GoalType Type { get; set; }
    public DisplayStyle DisplayStyle { get; set; }

    // The user's order; lower comes first.
    public int Position { get; set; }

    public int? RangeMin { get; set; }
    public int? RangeMax { get; set; }
    public string? RangeMinLabel { get; set; }
    public string? RangeMaxLabel { get; set; }
    public string? NumberUnit { get; set; }
    public bool? EnumOrdered { get; set; }

    // Range and number goals only; enum targets are GoalEnumOption.IsTarget.
    public TargetComparison? TargetComparison { get; set; }
    public decimal? TargetValue { get; set; }

    // Used from change 07 (archive).
    public DateTimeOffset? ArchivedAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public List<GoalEnumOption> Options { get; set; } = [];
}
