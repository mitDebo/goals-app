namespace GoalsApp.Api.Profiles;

// App-owned profile, keyed by the auth provider's user id. No foreign key to
// Supabase's auth tables, so auth stays swappable.
public class Profile
{
    public Guid UserId { get; set; }
    public required string TimeZone { get; set; }
    public WeekStart WeekStart { get; set; } = WeekStart.Sunday;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
