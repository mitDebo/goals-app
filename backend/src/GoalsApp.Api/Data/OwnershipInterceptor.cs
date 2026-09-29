using GoalsApp.Api.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace GoalsApp.Api.Data;

// Runs on every SaveChanges: enforces row ownership and fills in timestamps.
public sealed class OwnershipInterceptor(ICurrentUser currentUser, TimeProvider clock) : SaveChangesInterceptor
{
    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData, InterceptionResult<int> result)
    {
        Apply(eventData.Context);
        return result;
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
    {
        Apply(eventData.Context);
        return ValueTask.FromResult(result);
    }

    private void Apply(DbContext? context)
    {
        if (context is null)
            return;

        context.ChangeTracker.DetectChanges();
        var now = clock.GetUtcNow();

        foreach (var entry in context.ChangeTracker.Entries())
        {
            if (entry.State is not (EntityState.Added or EntityState.Modified or EntityState.Deleted))
                continue;

            if (entry.Entity is IOwnedEntity)
                EnforceOwnership(entry);

            if (entry.Entity is ITimestamped)
                StampTimes(entry, now);
        }
    }

    private void EnforceOwnership(EntityEntry entry)
    {
        var entityName = entry.Metadata.ClrType.Name;
        var userId = currentUser.UserId
            ?? throw new OwnershipViolationException($"Cannot save {entityName}: nobody is signed in.");

        var owner = entry.Property(nameof(IOwnedEntity.UserId));

        if (entry.State == EntityState.Added && (Guid)owner.CurrentValue! == Guid.Empty)
            owner.CurrentValue = userId;

        var belongsToSomeoneElse =
            (Guid)owner.CurrentValue! != userId
            || (entry.State != EntityState.Added && (Guid)owner.OriginalValue! != userId);

        if (belongsToSomeoneElse)
            throw new OwnershipViolationException($"Cannot save {entityName}: it belongs to another user.");
    }

    private static void StampTimes(EntityEntry entry, DateTimeOffset now)
    {
        var createdAt = entry.Property(nameof(ITimestamped.CreatedAt));
        var updatedAt = entry.Property(nameof(ITimestamped.UpdatedAt));

        if (entry.State == EntityState.Added)
        {
            createdAt.CurrentValue = now;
            updatedAt.CurrentValue = now;
        }
        else if (entry.State == EntityState.Modified)
        {
            createdAt.IsModified = false;
            updatedAt.CurrentValue = now;
        }
    }
}
