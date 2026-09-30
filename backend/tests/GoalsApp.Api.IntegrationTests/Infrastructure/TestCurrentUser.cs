using GoalsApp.Api.Core.Auth;

namespace GoalsApp.Api.IntegrationTests.Infrastructure;

public sealed record TestCurrentUser(Guid? UserId) : ICurrentUser;
