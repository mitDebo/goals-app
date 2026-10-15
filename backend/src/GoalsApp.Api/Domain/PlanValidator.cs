using GoalsApp.Api.Core.Outcomes;

namespace GoalsApp.Api.Domain;

// The rules for a valid plan. Pure: no database, no HTTP. Whether each goal exists and is the user's
// is checked by the service, which can see the goals.
public static class PlanValidator
{
    public const int MaxNameLength = 100;
    public const int MaxLengthDays = 366;

    public static Outcome<PlanDefinition> Validate(PlanDraft draft)
    {
        var errors = new Dictionary<string, string[]>();
        void Add(string field, string message) =>
            errors[field] = errors.TryGetValue(field, out var existing) ? [.. existing, message] : [message];

        var name = string.IsNullOrWhiteSpace(draft.Name) ? null : draft.Name.Trim();
        if (name is null)
            Add("name", "A name is required.");
        else if (name.Length > MaxNameLength)
            Add("name", $"Name must be at most {MaxNameLength} characters.");

        var length = draft.LengthDays ?? 0;
        if (length < 1 || length > MaxLengthDays)
            Add("lengthDays", $"A plan lasts between 1 and {MaxLengthDays} days.");

        var goals = new List<PlanDefinition.PlanGoal>();
        var drafts = draft.Goals ?? [];
        for (var i = 0; i < drafts.Count; i++)
        {
            var goal = drafts[i];
            var key = $"goals[{i}]";
            if (goal.GoalId is not { } goalId)
            {
                Add($"{key}.goalId", "Pick a goal.");
                continue;
            }

            if ((goal.Days is null) == (goal.Times is null))
            {
                Add(key, "Choose either days or a number of times.");
                continue;
            }

            if (goal.Days is { } days)
            {
                var distinct = days.Distinct().Order().ToList();
                if (distinct.Count == 0)
                    Add($"{key}.days", "Pick at least one day.");
                else if (length >= 1 && distinct.Any(d => d < 1 || d > length))
                    Add($"{key}.days", $"Days must be between 1 and {length}.");
                else
                    goals.Add(new PlanDefinition.PlanGoal(goalId, distinct, null));
            }
            else if (goal.Times is { } times)
            {
                if (times < 1 || (length >= 1 && times > length))
                    Add($"{key}.times", $"Times must be between 1 and {Math.Max(length, 1)}.");
                else
                    goals.Add(new PlanDefinition.PlanGoal(goalId, null, times));
            }
        }

        if (drafts.Where(g => g.GoalId is not null).GroupBy(g => g.GoalId).Any(g => g.Count() > 1))
            Add("goals", "Each goal can only be in a plan once.");

        return errors.Count > 0
            ? Outcome<PlanDefinition>.Invalid(errors)
            : new PlanDefinition(name!, length, goals);
    }
}
