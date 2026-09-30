namespace GoalsApp.Api.Core.Auth;

// Who is making the current request; null when nobody is signed in.
public interface ICurrentUser
{
    Guid? UserId { get; }
}

// Used where there is no request (EF design-time tools, background work).
public sealed class NoCurrentUser : ICurrentUser
{
    public static readonly NoCurrentUser Instance = new();
    public Guid? UserId => null;
}
