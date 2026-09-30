namespace GoalsApp.Api.Core.Results;

// The outcome of a service call: a value, "not found", or validation errors keyed by field.
public sealed class Result<T>
{
    private static readonly IReadOnlyDictionary<string, string[]> NoErrors = new Dictionary<string, string[]>();

    private readonly T? _value;

    private Result(ResultStatus status, T? value, IReadOnlyDictionary<string, string[]> errors)
    {
        Status = status;
        _value = value;
        Errors = errors;
    }

    public ResultStatus Status { get; }
    public bool IsSuccess => Status == ResultStatus.Success;

    // The value of a successful result. Reading it from a failure is a bug and throws.
    public T Value => IsSuccess
        ? _value!
        : throw new InvalidOperationException($"A {Status} result has no value.");

    // Field name → messages; empty unless Status is Invalid.
    public IReadOnlyDictionary<string, string[]> Errors { get; }

    public static Result<T> Success(T value) => new(ResultStatus.Success, value, NoErrors);
    public static Result<T> NotFound() => new(ResultStatus.NotFound, default, NoErrors);

    public static Result<T> Invalid(string field, string message) =>
        new(ResultStatus.Invalid, default, new Dictionary<string, string[]> { [field] = [message] });

    public static implicit operator Result<T>(T value) => Success(value);
}
