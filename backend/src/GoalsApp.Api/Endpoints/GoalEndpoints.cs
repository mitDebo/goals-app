using GoalsApp.Api.Core.Enums;
using GoalsApp.Api.Core.Outcomes;
using GoalsApp.Api.Data.Entities;
using GoalsApp.Api.Domain;
using GoalsApp.Api.Services;

namespace GoalsApp.Api.Endpoints;

// Requests bind straight to GoalDraft, which already is the raw request shape.
// In responses, blocks that don't apply to the goal's type are null and so left out of the JSON.
public static class GoalEndpoints
{
    public sealed record GoalResponse(
        Guid Id,
        string Name,
        string? Description,
        string Type,
        string DisplayStyle,
        int Position,
        RangeResponse? Range,
        NumberResponse? Number,
        EnumResponse? Enum,
        TargetResponse? Target);

    public sealed record RangeResponse(int Min, int Max, string? MinLabel, string? MaxLabel);
    public sealed record NumberResponse(string? Unit);
    public sealed record EnumResponse(bool Ordered, IReadOnlyList<OptionResponse> Options);
    public sealed record OptionResponse(Guid Id, string Label, string? Note, bool IsTarget);
    public sealed record TargetResponse(string Comparison, decimal Value);

    public sealed record ReorderRequest(IReadOnlyList<Guid>? GoalIds);

    public static IEndpointRouteBuilder MapGoalEndpoints(this IEndpointRouteBuilder app)
    {
        var goals = app.MapGroup("/api/goals");
        goals.MapGet("", ListGoals);
        goals.MapPost("", CreateGoal);
        goals.MapPut("/order", ReorderGoals);
        goals.MapGet("/{id:guid}", GetGoal);
        goals.MapPut("/{id:guid}", UpdateGoal);
        return app;
    }

    private static async Task<IResult> ListGoals(GoalService goals, CancellationToken ct) =>
        Results.Ok((await goals.ListAsync(ct)).Select(ToResponse));

    private static async Task<IResult> GetGoal(Guid id, GoalService goals, CancellationToken ct)
    {
        var outcome = await goals.GetAsync(id, ct);
        return outcome.ToHttp(goal => Results.Ok(ToResponse(goal)));
    }

    private static async Task<IResult> CreateGoal(GoalDraft draft, GoalService goals, CancellationToken ct)
    {
        var outcome = await goals.CreateAsync(draft, ct);
        return outcome.ToHttp(goal => Results.Created($"/api/goals/{goal.Id}", ToResponse(goal)));
    }

    private static async Task<IResult> UpdateGoal(Guid id, GoalDraft draft, GoalService goals, CancellationToken ct)
    {
        var outcome = await goals.UpdateAsync(id, draft, ct);
        return outcome.ToHttp(goal => Results.Ok(ToResponse(goal)));
    }

    private static async Task<IResult> ReorderGoals(ReorderRequest request, GoalService goals, CancellationToken ct)
    {
        var outcome = await goals.ReorderAsync(request.GoalIds ?? [], ct);
        return outcome.ToHttp(reordered => Results.Ok(reordered.Select(ToResponse)));
    }

    private static GoalResponse ToResponse(Goal goal) => new(
        goal.Id,
        goal.Name,
        goal.Description,
        goal.Type.ToName(),
        goal.DisplayStyle.ToName(),
        goal.Position,
        goal.Type == GoalType.Range
            ? new RangeResponse(goal.RangeMin!.Value, goal.RangeMax!.Value, goal.RangeMinLabel, goal.RangeMaxLabel)
            : null,
        goal.Type == GoalType.Number ? new NumberResponse(goal.NumberUnit) : null,
        goal.Type == GoalType.Enum
            ? new EnumResponse(goal.EnumOrdered ?? false, [.. goal.Options
                .OrderBy(o => o.Position)
                .Select(o => new OptionResponse(o.Id, o.Label, o.Note, o.IsTarget))])
            : null,
        goal.TargetComparison is { } comparison && goal.TargetValue is { } value
            ? new TargetResponse(comparison.ToName(), value)
            : null);
}
