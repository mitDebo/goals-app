namespace GoalsApp.Api.Auth;

// The signed-in user of the current HTTP request, from the token's "sub" claim.
public sealed class HttpCurrentUser(IHttpContextAccessor httpContextAccessor) : ICurrentUser
{
    public Guid? UserId =>
        Guid.TryParse(httpContextAccessor.HttpContext?.User.FindFirst("sub")?.Value, out var id) ? id : null;
}
