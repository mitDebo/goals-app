using GoalsApp.Api.Auth;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace GoalsApp.Api.Data;

public sealed class OwnershipInterceptor(ICurrentUser currentUser, TimeProvider clock) : SaveChangesInterceptor
{
}
