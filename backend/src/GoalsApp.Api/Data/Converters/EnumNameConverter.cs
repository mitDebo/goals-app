using GoalsApp.Api.Core.Enums;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace GoalsApp.Api.Data.Converters;

// Stores an enum as its wire name ("emoji_scale") rather than a number, so the database is
// readable and CHECK constraints can list the allowed values.
public sealed class EnumNameConverter<T>() : ValueConverter<T, string>(value => value.ToName(), name => Parse(name))
    where T : struct, Enum
{
    private static T Parse(string name) =>
        EnumNames.TryParse<T>(name, out var value)
            ? value
            : throw new InvalidOperationException($"Unknown {typeof(T).Name} '{name}' in database.");

    // "'a', 'b', 'c'" for use in a CHECK constraint.
    public static string SqlList() => string.Join(", ", Enum.GetValues<T>().Select(v => $"'{v.ToName()}'"));
}
