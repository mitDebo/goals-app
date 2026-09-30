namespace GoalsApp.Api.Data.Exceptions;

public sealed class OwnershipViolationException(string message) : InvalidOperationException(message);
