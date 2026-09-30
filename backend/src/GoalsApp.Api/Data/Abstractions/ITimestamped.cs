namespace GoalsApp.Api.Data.Abstractions;

// CreatedAt / UpdatedAt are filled in automatically on save.
public interface ITimestamped
{
    DateTimeOffset CreatedAt { get; set; }
    DateTimeOffset UpdatedAt { get; set; }
}
