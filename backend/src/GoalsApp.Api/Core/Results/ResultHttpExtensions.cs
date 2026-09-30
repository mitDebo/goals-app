namespace GoalsApp.Api.Core.Results;

public static class ResultHttpExtensions
{
    // Success → whatever the endpoint builds; NotFound → 404; Invalid → 400 validation problem.
    public static IResult ToHttp<T>(this Result<T> result, Func<T, IResult> onSuccess) =>
        throw new NotImplementedException();

    // For endpoints that handle success themselves and only need the shared failure mapping.
    public static IResult ToHttp<T>(this Result<T> result) => throw new NotImplementedException();
}
