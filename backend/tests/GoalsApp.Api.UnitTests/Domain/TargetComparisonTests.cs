using GoalsApp.Api.Core.Enums;
using GoalsApp.Api.Domain;

namespace GoalsApp.Api.UnitTests.Domain;

public class TargetComparisonTests
{
    [Theory]
    [InlineData(TargetComparison.AtLeast, "at_least")]
    [InlineData(TargetComparison.AtMost, "at_most")]
    public void Names_round_trip(TargetComparison comparison, string name)
    {
        Assert.Equal(name, comparison.ToName());
        Assert.True(EnumNames.TryParse<TargetComparison>(name, out var parsed));
        Assert.Equal(comparison, parsed);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("exactly")]
    [InlineData("AtLeast")]
    public void Unknown_names_are_rejected(string? name)
    {
        Assert.False(EnumNames.TryParse<TargetComparison>(name, out _));
    }
}
