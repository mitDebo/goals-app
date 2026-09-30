using System.Text.Json;

namespace GoalsApp.Api.Core.Enums;

// The wire/database name of an enum value is its snake_case form: EmojiScale → "emoji_scale".
// Stricter than Enum.TryParse: only exact names of defined values, so no numbers ("7"),
// no comma lists ("Range, Enum") and no other casing ("Range").
public static class EnumNames
{
    public static string ToName<T>(this T value) where T : struct, Enum =>
        JsonNamingPolicy.SnakeCaseLower.ConvertName(value.ToString());

    public static bool TryParse<T>(string? name, out T value) where T : struct, Enum
    {
        foreach (var candidate in Enum.GetValues<T>())
        {
            if (candidate.ToName() == name)
            {
                value = candidate;
                return true;
            }
        }

        value = default;
        return false;
    }
}
