using GoalsApp.Api.Core.Outcomes;
using GoalsApp.Api.Data.Entities;
using GoalsApp.Api.Domain;
using GoalsApp.Api.Repositories;

namespace GoalsApp.Api.Services;

public sealed class PlanService(IPlanRepository plans, IGoalRepository goals)
{
    public Task<List<Plan>> ListAsync(CancellationToken ct) => plans.ListAsync(ct);

    public async Task<Outcome<Plan>> GetAsync(Guid id, CancellationToken ct)
    {
        var plan = await plans.FindAsync(id, ct);
        return plan is null ? Outcome<Plan>.NotFound() : plan;
    }

    public async Task<Outcome<Plan>> CreateAsync(PlanDraft draft, CancellationToken ct)
    {
        var validated = await ValidateAsync(draft, ct);
        if (!validated.IsSuccess)
            return Outcome<Plan>.Invalid(validated.Errors);

        var plan = new Plan { Id = Guid.CreateVersion7(), Name = validated.Value.Definition.Name };
        Apply(plan, validated.Value);
        plans.Add(plan);
        await plans.SaveChangesAsync(ct);
        return plan;
    }

    // Full replace. Because runs are live-linked to their plan, this changes every run of it.
    public async Task<Outcome<Plan>> UpdateAsync(Guid id, PlanDraft draft, CancellationToken ct)
    {
        var plan = await plans.FindAsync(id, ct);
        if (plan is null)
            return Outcome<Plan>.NotFound();

        var validated = await ValidateAsync(draft, ct);
        if (!validated.IsSuccess)
            return Outcome<Plan>.Invalid(validated.Errors);

        Apply(plan, validated.Value);
        await plans.SaveChangesAsync(ct);
        return plan;
    }

    private sealed record Checked(PlanDefinition Definition, IReadOnlyDictionary<Guid, Goal> Goals);

    // The pure rules, plus: every goal must be one of the user's yes/no goals (prototype: yes/no only).
    private async Task<Outcome<Checked>> ValidateAsync(PlanDraft draft, CancellationToken ct)
    {
        var validated = PlanValidator.Validate(draft);
        if (!validated.IsSuccess)
            return Outcome<Checked>.Invalid(validated.Errors);

        var found = new Dictionary<Guid, Goal>();
        var errors = new Dictionary<string, string[]>();
        var definition = validated.Value;
        for (var i = 0; i < definition.Goals.Count; i++)
        {
            var goal = await goals.FindAsync(definition.Goals[i].GoalId, ct);
            if (goal is null)
                errors[$"goals[{i}].goalId"] = ["That goal doesn't exist."];
            else if (goal.Type != GoalType.Boolean)
                errors[$"goals[{i}].goalId"] = ["Only yes/no goals can be in a plan for now."];
            else
                found[goal.Id] = goal;
        }

        return errors.Count > 0 ? Outcome<Checked>.Invalid(errors) : new Checked(definition, found);
    }

    // Goals still in the plan keep their row; new ones get one; dropped ones are removed.
    private void Apply(Plan plan, Checked validated)
    {
        plan.Name = validated.Definition.Name;
        plan.LengthDays = validated.Definition.LengthDays;

        var existing = plan.Goals.ToDictionary(g => g.GoalId);
        var updated = new List<PlanGoal>();
        foreach (var (wanted, position) in validated.Definition.Goals.Select((g, i) => (g, i)))
        {
            if (!existing.Remove(wanted.GoalId, out var planGoal))
                planGoal = new PlanGoal { Id = Guid.CreateVersion7(), PlanId = plan.Id, GoalId = wanted.GoalId };

            planGoal.Goal = validated.Goals[wanted.GoalId];
            planGoal.Position = position;
            planGoal.Days = wanted.Days?.ToList();
            planGoal.Times = wanted.Times;
            updated.Add(planGoal);
        }

        foreach (var dropped in existing.Values)
            plans.RemoveGoal(dropped);

        plan.Goals = updated;
    }
}
