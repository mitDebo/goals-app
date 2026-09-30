using GoalsApp.Api.Core.Enums;

namespace GoalsApp.Api.UnitTests.Core.Enums;

public class EnumNamesTests
{
    public enum Sample
    {
        One,
        TwoWords,
    }

    [Theory]
    [InlineData(Sample.One, "one")]
    [InlineData(Sample.TwoWords, "two_words")]
    public void Names_are_snake_case_and_round_trip(Sample value, string name)
    {
        Assert.Equal(name, value.ToName());
        Assert.True(EnumNames.TryParse<Sample>(name, out var parsed));
        Assert.Equal(value, parsed);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("three")]
    [InlineData("TwoWords")]
    [InlineData("TWO_WORDS")]
    [InlineData(" one")]
    [InlineData("0")]
    [InlineData("7")]
    [InlineData("one, two_words")]
    public void Only_exact_names_of_defined_values_parse(string? name)
    {
        Assert.False(EnumNames.TryParse<Sample>(name, out _));
    }
}
