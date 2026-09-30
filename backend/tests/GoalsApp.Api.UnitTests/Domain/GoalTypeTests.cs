using GoalsApp.Api.Domain;

namespace GoalsApp.Api.UnitTests.Domain;

public class GoalTypeTests
{
    [Theory]
    [InlineData(GoalType.Boolean, "boolean")]
    [InlineData(GoalType.Range, "range")]
    [InlineData(GoalType.Number, "number")]
    [InlineData(GoalType.Enum, "enum")]
    public void Names_round_trip(GoalType type, string name)
    {
        Assert.Equal(name, type.ToName());
        Assert.True(GoalTypeNames.TryParse(name, out var parsed));
        Assert.Equal(type, parsed);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("checklist")]
    [InlineData("Boolean")]
    public void Unknown_names_are_rejected(string? name)
    {
        Assert.False(GoalTypeNames.TryParse(name, out _));
    }
}
