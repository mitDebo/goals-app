namespace GoalsApp.Api.Core.Outcomes;

// The outcome of a service call: a value, "not found", or validation errors keyed by field.
public sealed class Outcome<T>
{
    private static readonly IReadOnlyDictionary<string, string[]> NoErrors = new Dictionary<string, string[]>();

    private readonly T? _value;

    private Outcome(OutcomeStatus status, T? value, IReadOnlyDictionary<string, string[]> errors)
    {
        Status = status;
        _value = value;
        Errors = errors;
    }

    public OutcomeStatus Status { get; }
    public bool IsSuccess => Status == OutcomeStatus.Success;

    // The value of a successful outcome. Reading it from a failure is a bug and throws.
    public T Value => IsSuccess
        ? _value!
        : throw new InvalidOperationException($"An outcome of {Status} has no value.");

    // Field name → messages; empty unless Status is Invalid.
    public IReadOnlyDictionary<string, string[]> Errors { get; }

    public static Outcome<T> Success(T value) => new(OutcomeStatus.Success, value, NoErrors);
    public static Outcome<T> NotFound() => new(OutcomeStatus.NotFound, default, NoErrors);

    public static Outcome<T> Invalid(string field, string message) =>
        new(OutcomeStatus.Invalid, default, new Dictionary<string, string[]> { [field] = [message] });

    // Several fields at once, e.g. everything a validator found wrong.
    public static Outcome<T> Invalid(IReadOnlyDictionary<string, string[]> errors) =>
        new(OutcomeStatus.Invalid, default, new Dictionary<string, string[]>(errors));

    public static implicit operator Outcome<T>(T value) => Success(value);
}
