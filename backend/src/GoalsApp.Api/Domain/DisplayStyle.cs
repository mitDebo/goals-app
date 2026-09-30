namespace GoalsApp.Api.Domain;

// How a goal's control looks on screen. Never affects stored values.
public enum DisplayStyle
{
    Toggle,     // boolean
    Input,      // number
    Options,    // enum
    Slider,     // range
    Dial,       // range
    Buttons,    // range
    Stepper,    // range
    EmojiScale, // range
}

// Wire/database names: "toggle", "input", "options", "slider", "dial", "buttons", "stepper", "emoji_scale".
public static class DisplayStyleNames
{
    public static string ToName(this DisplayStyle style) => throw new NotImplementedException();

    public static bool TryParse(string? name, out DisplayStyle style) => throw new NotImplementedException();
}
