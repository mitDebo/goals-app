namespace GoalsApp.Api.Data;

public sealed class OwnershipViolationException(string message) : InvalidOperationException(message);
