using GoalsApp.Api.Core.Outcomes;
using GoalsApp.Api.Data.Entities;
using GoalsApp.Api.Domain;
using GoalsApp.Api.Services;

namespace GoalsApp.Api.Endpoints;

// Requests bind straight to PlanDraft. In responses, each goal has either "days" or "times".
public static class PlanEndpoints
{
    public sealed record PlanResponse(Guid Id, string Name, int LengthDays, IReadOnlyList<PlanGoalResponse> Goals);
    public sealed record PlanGoalResponse(Guid GoalId, string GoalName, IReadOnlyList<int>? Days, int? Times);

    public static IEndpointRouteBuilder MapPlanEndpoints(this IEndpointRouteBuilder app)
    {
        var plans = app.MapGroup("/api/plans");
        plans.MapGet("", ListPlans);
        plans.MapPost("", CreatePlan);
        plans.MapGet("/{id:guid}", GetPlan);
        plans.MapPut("/{id:guid}", UpdatePlan);
        return app;
    }

    private static async Task<IResult> ListPlans(PlanService plans, CancellationToken ct) =>
        Results.Ok((await plans.ListAsync(ct)).Select(ToResponse));

    private static async Task<IResult> GetPlan(Guid id, PlanService plans, CancellationToken ct) =>
        (await plans.GetAsync(id, ct)).ToHttp(plan => Results.Ok(ToResponse(plan)));

    private static async Task<IResult> CreatePlan(PlanDraft draft, PlanService plans, CancellationToken ct) =>
        (await plans.CreateAsync(draft, ct)).ToHttp(plan => Results.Created($"/api/plans/{plan.Id}", ToResponse(plan)));

    private static async Task<IResult> UpdatePlan(Guid id, PlanDraft draft, PlanService plans, CancellationToken ct) =>
        (await plans.UpdateAsync(id, draft, ct)).ToHttp(plan => Results.Ok(ToResponse(plan)));

    private static PlanResponse ToResponse(Plan plan) => new(
        plan.Id,
        plan.Name,
        plan.LengthDays,
        [.. plan.Goals.OrderBy(g => g.Position).Select(g => new PlanGoalResponse(g.GoalId, g.Goal.Name, g.Days, g.Times))]);
}
