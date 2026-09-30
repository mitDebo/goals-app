namespace GoalsApp.Api.Core.Results;

// The outcome of a service call: a value, "not found", or validation errors keyed by field.
public sealed class Result<T>
{
    public ResultStatus Status => throw new NotImplementedException();
    public bool IsSuccess => throw new NotImplementedException();

    // The value of a successful result. Reading it from a failure is a bug and throws.
    public T Value => throw new NotImplementedException();

    // Field name → messages; empty unless Status is Invalid.
    public IReadOnlyDictionary<string, string[]> Errors => throw new NotImplementedException();

    public static Result<T> Success(T value) => throw new NotImplementedException();
    public static Result<T> NotFound() => throw new NotImplementedException();
    public static Result<T> Invalid(string field, string message) => throw new NotImplementedException();

    public static implicit operator Result<T>(T value) => Success(value);
}
