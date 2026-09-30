namespace GoalsApp.Api.Core.Enums;

// The wire/database name of an enum value is its snake_case form: EmojiScale → "emoji_scale".
// Stricter than Enum.TryParse: only exact names of defined values, so no numbers ("7"),
// no comma lists ("Range, Enum") and no other casing ("Range").
public static class EnumNames
{
    public static string ToName<T>(this T value) where T : struct, Enum =>
        throw new NotImplementedException();

    public static bool TryParse<T>(string? name, out T value) where T : struct, Enum =>
        throw new NotImplementedException();
}
