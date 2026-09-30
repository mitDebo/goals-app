namespace GoalsApp.Api.Domain;

// How a goal's control looks on screen. Never affects stored values.
// Wire/database names via EnumNames, e.g. "emoji_scale".
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
