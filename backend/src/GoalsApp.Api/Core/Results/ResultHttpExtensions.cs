namespace GoalsApp.Api.Core.Results;

public static class ResultHttpExtensions
{
    // Success → whatever the endpoint builds; NotFound → 404; Invalid → 400 validation problem.
    public static IResult ToHttp<T>(this Result<T> result, Func<T, IResult> onSuccess) =>
        result.IsSuccess ? onSuccess(result.Value) : result.ToHttp();

    // For endpoints that handle success themselves and only need the shared failure mapping.
    public static IResult ToHttp<T>(this Result<T> result) => result.Status switch
    {
        ResultStatus.NotFound => TypedResults.NotFound(),
        ResultStatus.Invalid => TypedResults.ValidationProblem(result.Errors.ToDictionary()),
        _ => throw new InvalidOperationException("A successful result must be mapped by the endpoint."),
    };
}
