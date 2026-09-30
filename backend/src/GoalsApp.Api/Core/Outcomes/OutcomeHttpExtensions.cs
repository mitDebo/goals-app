namespace GoalsApp.Api.Core.Outcomes;

public static class OutcomeHttpExtensions
{
    // Success → whatever the endpoint builds; NotFound → 404; Invalid → 400 validation problem.
    public static IResult ToHttp<T>(this Outcome<T> outcome, Func<T, IResult> onSuccess) =>
        outcome.IsSuccess ? onSuccess(outcome.Value) : outcome.ToHttp();

    // For endpoints that handle success themselves and only need the shared failure mapping.
    public static IResult ToHttp<T>(this Outcome<T> outcome) => outcome.Status switch
    {
        OutcomeStatus.NotFound => TypedResults.NotFound(),
        OutcomeStatus.Invalid => TypedResults.ValidationProblem(outcome.Errors.ToDictionary()),
        _ => throw new InvalidOperationException("A successful outcome must be mapped by the endpoint."),
    };
}
