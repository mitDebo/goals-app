namespace GoalsApp.Api.Data;

// A row that belongs to one user. Queries only ever see the current user's rows,
// and saving a row owned by someone else is refused.
public interface IOwnedEntity
{
    Guid UserId { get; set; }
}
