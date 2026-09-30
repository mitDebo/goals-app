# Access control: one place, not every query

Every user can only read and change their own data. This is enforced centrally,
so endpoints never need to remember it.

## For a new table

1. Make the entity implement **`IOwnedEntity`** (`Guid UserId`) if its rows belong
   to a user, and **`ITimestamped`** (`CreatedAt`, `UpdatedAt`) if it should carry
   timestamps. Both live in `Data/Abstractions/`. Store `UserId` on the table itself, even when ownership could be
   worked out through a parent row, so the filter stays simple.
2. That's it. You get:
   - **Query filter** (`Data/GoalsDbContext.cs`): every query on the table only returns the
     current user's rows, and none when nobody is signed in. A lookup by id for
     someone else's row finds nothing, so endpoints naturally answer 404.
   - **Save rules** (`Data/Interceptors/OwnershipInterceptor.cs`, on every `SaveChanges`):
     - new rows with an empty `UserId` are stamped with the current user;
     - saving a row owned by anyone else, or any owned row while nobody is
       signed in, throws `OwnershipViolationException` (`Data/Exceptions/`);
     - `CreatedAt`/`UpdatedAt` are set on insert, `UpdatedAt` on update, and
       `CreatedAt` can never be changed afterwards.

## Where the current user comes from

`ICurrentUser` (`Core/Auth/`) — in the API it is `HttpCurrentUser` (the token's `sub` claim);
EF's design-time tools use `NoCurrentUser`. Tests use `TestCurrentUser` and
`DatabaseFixture.CreateDbContext(user, clock)` to act as any user.

## Escape hatch

`IgnoreQueryFilters()` bypasses the filter. Only use it for deliberate
cross-user work (none exists yet), and say why in the code.
