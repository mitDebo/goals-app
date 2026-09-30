using GoalsApp.Api.Core.Enums;
using GoalsApp.Api.Domain;

namespace GoalsApp.Api.UnitTests.Domain;

public class DisplayStyleTests
{
    [Theory]
    [InlineData(DisplayStyle.Toggle, "toggle")]
    [InlineData(DisplayStyle.Input, "input")]
    [InlineData(DisplayStyle.Options, "options")]
    [InlineData(DisplayStyle.Slider, "slider")]
    [InlineData(DisplayStyle.Dial, "dial")]
    [InlineData(DisplayStyle.Buttons, "buttons")]
    [InlineData(DisplayStyle.Stepper, "stepper")]
    [InlineData(DisplayStyle.EmojiScale, "emoji_scale")]
    public void Names_round_trip(DisplayStyle style, string name)
    {
        Assert.Equal(name, style.ToName());
        Assert.True(EnumNames.TryParse<DisplayStyle>(name, out var parsed));
        Assert.Equal(style, parsed);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("sparkles")]
    [InlineData("emojiScale")]
    public void Unknown_names_are_rejected(string? name)
    {
        Assert.False(EnumNames.TryParse<DisplayStyle>(name, out _));
    }
}
