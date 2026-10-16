using GoalsApp.Api.Core.Outcomes;
using GoalsApp.Api.Core.Time;
using GoalsApp.Api.Data.Entities;
using GoalsApp.Api.Repositories;

namespace GoalsApp.Api.Services;

public sealed class RunService(IRunRepository runs, IPlanRepository plans, IProfileRepository profiles, Clock clock)
{
    // Same cap as a plan's length.
    private const int MaxRunDays = 366;

    // Every run plus the user's "today", which the sheet needs to grey out future days.
    public sealed record RunList(DateOnly Today, IReadOnlyList<Run> Runs);

    public async Task<RunList> ListAsync(Guid userId, CancellationToken ct) =>
        new(await TodayAsync(userId, ct), await runs.ListAsync(ct));

    // The end date defaults to the plan's last day: start + length - 1.
    public async Task<Outcome<Run>> StartAsync(Guid? planId, DateOnly? startDate, DateOnly? endDate, CancellationToken ct)
    {
        var plan = planId is { } id ? await plans.FindAsync(id, ct) : null;
        if (plan is null)
            return Outcome<Run>.Invalid("planId", "Choose one of your plans.");
        if (startDate is not { } start)
            return Outcome<Run>.Invalid("startDate", "Choose a start date.");

        var end = endDate ?? start.AddDays(plan.LengthDays - 1);
        if (CheckEnd(start, end) is { } problem)
            return Outcome<Run>.Invalid("endDate", problem);

        var run = new Run { Id = Guid.CreateVersion7(), PlanId = plan.Id, Plan = plan, StartDate = start, EndDate = end };
        runs.Add(run);
        await runs.SaveChangesAsync(ct);
        return run;
    }

    // Only the end date can change. Ticks after a new, earlier end date are kept (just not shown),
    // so moving the end date back out brings them back.
    public async Task<Outcome<Run>> ChangeEndAsync(Guid id, DateOnly? endDate, CancellationToken ct)
    {
        var run = await runs.FindAsync(id, ct);
        if (run is null)
            return Outcome<Run>.NotFound();
        if (endDate is not { } end)
            return Outcome<Run>.Invalid("endDate", "Choose an end date.");
        if (CheckEnd(run.StartDate, end) is { } problem)
            return Outcome<Run>.Invalid("endDate", problem);

        run.EndDate = end;
        await runs.SaveChangesAsync(ct);
        return run;
    }

    // Deletes the run and all its ticks. The plan is untouched.
    public async Task<Outcome<Run>> DeleteAsync(Guid id, CancellationToken ct)
    {
        var run = await runs.FindAsync(id, ct);
        if (run is null)
            return Outcome<Run>.NotFound();

        runs.Remove(run);
        await runs.SaveChangesAsync(ct);
        return run;
    }

    private static string? CheckEnd(DateOnly start, DateOnly end) =>
        end < start ? "The end date can't be before the start date."
        : end.DayNumber - start.DayNumber + 1 > MaxRunDays ? $"A run can be at most {MaxRunDays} days long."
        : null;

    // Idempotent: ticking an already-ticked day changes nothing. Any day from the run's start up to
    // today can be ticked, due or not (a tick on a day that isn't due shows as a bonus).
    public async Task<Outcome<Run>> TickAsync(Guid userId, Guid runId, Guid goalId, DateOnly date, CancellationToken ct)
    {
        var run = await runs.FindAsync(runId, ct);
        if (run is null)
            return Outcome<Run>.NotFound();
        if (run.Plan.Goals.All(g => g.GoalId != goalId))
            return Outcome<Run>.Invalid("goalId", "That goal isn't in this run's plan.");
        if (date < run.StartDate || date > run.EndDate)
            return Outcome<Run>.Invalid("date", "That date is outside this run.");
        if (date > await TodayAsync(userId, ct))
            return Outcome<Run>.Invalid("date", "You can't tick a day that hasn't happened yet.");

        if (!run.Achievements.Any(a => a.GoalId == goalId && a.Date == date))
        {
            run.Achievements.Add(new Achievement { RunId = run.Id, GoalId = goalId, Date = date });
            await runs.SaveChangesAsync(ct);
        }
        return run;
    }

    // Idempotent: unticking a day that isn't ticked changes nothing.
    public async Task<Outcome<Run>> UntickAsync(Guid runId, Guid goalId, DateOnly date, CancellationToken ct)
    {
        var run = await runs.FindAsync(runId, ct);
        if (run is null)
            return Outcome<Run>.NotFound();

        var tick = run.Achievements.FirstOrDefault(a => a.GoalId == goalId && a.Date == date);
        if (tick is not null)
        {
            run.Achievements.Remove(tick);
            runs.RemoveAchievement(tick);
            await runs.SaveChangesAsync(ct);
        }
        return run;
    }

    // In the user's own time zone. Every signed-in user gets a profile on first sign-in; UTC is
    // only a fallback for a request that somehow arrives before that.
    private async Task<DateOnly> TodayAsync(Guid userId, CancellationToken ct)
    {
        var profile = await profiles.FindAsync(userId, ct);
        return clock.TodayIn(profile?.TimeZone ?? "Etc/UTC");
    }
}
