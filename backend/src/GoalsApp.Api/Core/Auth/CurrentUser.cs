namespace GoalsApp.Api.Core.Auth;

// Who is making the current request; null when nobody is signed in.
public interface ICurrentUser
{
    Guid? UserId { get; }
}

// The signed-in user of the current HTTP request, from the token's "sub" claim.
public sealed class HttpCurrentUser(IHttpContextAccessor httpContextAccessor) : ICurrentUser
{
    public Guid? UserId =>
        Guid.TryParse(httpContextAccessor.HttpContext?.User.FindFirst("sub")?.Value, out var id) ? id : null;
}

// Used where there is no request (EF design-time tools, background work).
public sealed class NoCurrentUser : ICurrentUser
{
    public static readonly NoCurrentUser Instance = new();
    public Guid? UserId => null;
}
