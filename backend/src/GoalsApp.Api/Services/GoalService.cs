using GoalsApp.Api.Core.Outcomes;
using GoalsApp.Api.Data.Entities;
using GoalsApp.Api.Domain;
using GoalsApp.Api.Repositories;

namespace GoalsApp.Api.Services;

public sealed class GoalService(IGoalRepository goals)
{
    public Task<List<Goal>> ListAsync(CancellationToken ct) => goals.ListAsync(ct);

    public async Task<Outcome<Goal>> GetAsync(Guid id, CancellationToken ct)
    {
        var goal = await goals.FindAsync(id, ct);
        return goal is null ? Outcome<Goal>.NotFound() : goal;
    }

    // New goals go to the bottom of the list.
    public async Task<Outcome<Goal>> CreateAsync(GoalDraft draft, CancellationToken ct)
    {
        var validated = GoalValidator.Validate(draft);
        if (!validated.IsSuccess)
            return Outcome<Goal>.Invalid(validated.Errors);

        var existing = await goals.ListAsync(ct);
        var goal = new Goal
        {
            Id = Guid.CreateVersion7(),
            Name = validated.Value.Name,
            Position = existing.Count == 0 ? 0 : existing.Max(g => g.Position) + 1,
        };

        if (UnknownOptionIds(goal, validated.Value) is { } unknown)
            return unknown;

        Apply(goal, validated.Value);
        goals.Add(goal);
        await goals.SaveChangesAsync(ct);
        return goal;
    }

    // Full replace. Enum options with an Id are updated, ones without are created, missing ones are removed.
    public async Task<Outcome<Goal>> UpdateAsync(Guid id, GoalDraft draft, CancellationToken ct)
    {
        var goal = await goals.FindAsync(id, ct);
        if (goal is null)
            return Outcome<Goal>.NotFound();

        var validated = GoalValidator.Validate(draft);
        if (!validated.IsSuccess)
            return Outcome<Goal>.Invalid(validated.Errors);

        if (UnknownOptionIds(goal, validated.Value) is { } unknown)
            return unknown;

        Apply(goal, validated.Value);
        await goals.SaveChangesAsync(ct);
        return goal;
    }

    // goalIds must be exactly the user's goals, each once, in the new order.
    public async Task<Outcome<List<Goal>>> ReorderAsync(IReadOnlyList<Guid> goalIds, CancellationToken ct)
    {
        var current = await goals.ListAsync(ct);
        var listsEachGoalOnce = goalIds.Count == current.Count
            && goalIds.Distinct().Count() == goalIds.Count
            && current.All(g => goalIds.Contains(g.Id));
        if (!listsEachGoalOnce)
            return Outcome<List<Goal>>.Invalid("goalIds", "The new order must list each of your goals exactly once.");

        var byId = current.ToDictionary(g => g.Id);
        var reordered = goalIds.Select(id => byId[id]).ToList();
        for (var i = 0; i < reordered.Count; i++)
            reordered[i].Position = i;

        await goals.SaveChangesAsync(ct);
        return reordered;
    }

    // An option may only carry the id of one of this goal's own options.
    private static Outcome<Goal>? UnknownOptionIds(Goal goal, GoalDefinition definition)
    {
        if (definition.Settings is not EnumSettings settings)
            return null;

        var ownIds = goal.Options.Select(o => o.Id).ToHashSet();
        for (var i = 0; i < settings.Options.Count; i++)
        {
            if (settings.Options[i].Id is { } optionId && !ownIds.Contains(optionId))
                return Outcome<Goal>.Invalid($"enum.options[{i}].id", "This option doesn't belong to this goal.");
        }

        return null;
    }

    // Copies a validated definition onto the goal's columns, clearing whatever the type doesn't use.
    private void Apply(Goal goal, GoalDefinition definition)
    {
        goal.Name = definition.Name;
        goal.Description = definition.Description;
        goal.Type = definition.Type;
        goal.DisplayStyle = definition.DisplayStyle;

        goal.RangeMin = goal.RangeMax = null;
        goal.RangeMinLabel = goal.RangeMaxLabel = null;
        goal.NumberUnit = null;
        goal.EnumOrdered = null;
        goal.TargetComparison = null;
        goal.TargetValue = null;
        List<EnumOption> options = [];

        switch (definition.Settings)
        {
            case RangeSettings range:
                (goal.RangeMin, goal.RangeMax) = (range.Min, range.Max);
                (goal.RangeMinLabel, goal.RangeMaxLabel) = (range.MinLabel, range.MaxLabel);
                SetTarget(goal, range.Target);
                break;
            case NumberSettings number:
                goal.NumberUnit = number.Unit;
                SetTarget(goal, number.Target);
                break;
            case EnumSettings enumSettings:
                goal.EnumOrdered = enumSettings.Ordered;
                options = [.. enumSettings.Options];
                break;
        }

        SyncOptions(goal, options);
    }

    private static void SetTarget(Goal goal, Target? target)
    {
        goal.TargetComparison = target?.Comparison;
        goal.TargetValue = target?.Value;
    }

    private void SyncOptions(Goal goal, List<EnumOption> wanted)
    {
        var existing = goal.Options.ToDictionary(o => o.Id);
        var synced = new List<GoalEnumOption>();

        for (var i = 0; i < wanted.Count; i++)
        {
            var option = wanted[i].Id is { } id
                ? existing[id]
                : new GoalEnumOption { Id = Guid.CreateVersion7(), GoalId = goal.Id, Label = wanted[i].Label };
            option.Label = wanted[i].Label;
            option.Note = wanted[i].Note;
            option.IsTarget = wanted[i].IsTarget;
            option.Position = i;
            synced.Add(option);
        }

        foreach (var removed in goal.Options.Except(synced))
            goals.RemoveOption(removed);

        goal.Options = synced;
    }
}
