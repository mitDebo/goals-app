using System.Security.Claims;

namespace GoalsApp.Api.Core.Auth;

public static class ClaimsPrincipalExtensions
{
    // The Supabase auth user id ("sub" claim). The fallback authorization policy
    // guarantees a valid token, so a missing or malformed "sub" is a server bug.
    public static Guid GetUserId(this ClaimsPrincipal user) =>
        Guid.Parse(user.FindFirstValue("sub")
            ?? throw new InvalidOperationException("Authenticated user has no 'sub' claim."));
}
