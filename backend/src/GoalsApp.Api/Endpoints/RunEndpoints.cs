using System.Security.Claims;
using GoalsApp.Api.Core.Auth;
using GoalsApp.Api.Core.Outcomes;
using GoalsApp.Api.Data.Entities;
using GoalsApp.Api.Services;

namespace GoalsApp.Api.Endpoints;

// A run carries its plan's current goals (live-linked) and its ticks, so the frontend can draw
// the sheet: what's due, what's done, and bonus ticks on days that aren't due.
public static class RunEndpoints
{
    public sealed record StartRunRequest(Guid? PlanId, DateOnly? StartDate, DateOnly? EndDate);
    public sealed record ChangeRunRequest(DateOnly? EndDate);

    public sealed record RunListResponse(DateOnly Today, IReadOnlyList<RunResponse> Runs);

    public sealed record RunResponse(
        Guid Id,
        Guid PlanId,
        string PlanName,
        DateOnly StartDate,
        DateOnly EndDate,
        IReadOnlyList<PlanEndpoints.PlanGoalResponse> Goals,
        IReadOnlyList<AchievementResponse> Achievements);

    public sealed record AchievementResponse(Guid GoalId, DateOnly Date);

    public static IEndpointRouteBuilder MapRunEndpoints(this IEndpointRouteBuilder app)
    {
        var runs = app.MapGroup("/api/runs");
        runs.MapGet("", ListRuns);
        runs.MapPost("", StartRun);
        runs.MapPatch("/{id:guid}", ChangeRun);
        runs.MapDelete("/{id:guid}", DeleteRun);

        // Tick (PUT) or untick (DELETE) one goal on one day. Both are idempotent.
        runs.MapPut("/{id:guid}/achievements/{goalId:guid}/{date}", Tick);
        runs.MapDelete("/{id:guid}/achievements/{goalId:guid}/{date}", Untick);
        return app;
    }

    private static async Task<IResult> ListRuns(ClaimsPrincipal user, RunService runs, CancellationToken ct)
    {
        var list = await runs.ListAsync(user.GetUserId(), ct);
        return Results.Ok(new RunListResponse(list.Today, [.. list.Runs.Select(ToResponse)]));
    }

    private static async Task<IResult> StartRun(StartRunRequest request, RunService runs, CancellationToken ct) =>
        (await runs.StartAsync(request.PlanId, request.StartDate, request.EndDate, ct))
            .ToHttp(run => Results.Created($"/api/runs/{run.Id}", ToResponse(run)));

    private static async Task<IResult> ChangeRun(Guid id, ChangeRunRequest request, RunService runs, CancellationToken ct) =>
        (await runs.ChangeEndAsync(id, request.EndDate, ct)).ToHttp(run => Results.Ok(ToResponse(run)));

    private static async Task<IResult> DeleteRun(Guid id, RunService runs, CancellationToken ct) =>
        (await runs.DeleteAsync(id, ct)).ToHttp(_ => Results.NoContent());

    private static async Task<IResult> Tick(
        Guid id, Guid goalId, DateOnly date, ClaimsPrincipal user, RunService runs, CancellationToken ct) =>
        (await runs.TickAsync(user.GetUserId(), id, goalId, date, ct)).ToHttp(_ => Results.NoContent());

    private static async Task<IResult> Untick(Guid id, Guid goalId, DateOnly date, RunService runs, CancellationToken ct) =>
        (await runs.UntickAsync(id, goalId, date, ct)).ToHttp(_ => Results.NoContent());

    // Only ticks for goals still in the plan, on days still in the run, are sent. The others are kept
    // in case the goal comes back or the end date moves out again.
    private static RunResponse ToResponse(Run run)
    {
        var goals = run.Plan.Goals.OrderBy(g => g.Position).ToList();
        var inPlan = goals.Select(g => g.GoalId).ToHashSet();
        return new RunResponse(
            run.Id,
            run.PlanId,
            run.Plan.Name,
            run.StartDate,
            run.EndDate,
            [.. goals.Select(g => new PlanEndpoints.PlanGoalResponse(g.GoalId, g.Goal.Name, g.Days, g.Times))],
            [.. run.Achievements
                .Where(a => inPlan.Contains(a.GoalId) && a.Date >= run.StartDate && a.Date <= run.EndDate)
                .OrderBy(a => a.Date)
                .Select(a => new AchievementResponse(a.GoalId, a.Date))]);
    }
}
