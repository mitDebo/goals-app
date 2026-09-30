using GoalsApp.Api.Core.Outcomes;

namespace GoalsApp.Api.UnitTests.Core.Outcomes;

public class OutcomeTests
{
    [Fact]
    public void Success_carries_its_value()
    {
        var outcome = Outcome<int>.Success(42);

        Assert.Equal(OutcomeStatus.Success, outcome.Status);
        Assert.True(outcome.IsSuccess);
        Assert.Equal(42, outcome.Value);
        Assert.Empty(outcome.Errors);
    }

    [Fact]
    public void A_plain_value_converts_to_a_success()
    {
        Outcome<string> outcome = "hello";

        Assert.True(outcome.IsSuccess);
        Assert.Equal("hello", outcome.Value);
    }

    [Fact]
    public void Not_found_has_no_value()
    {
        var outcome = Outcome<int>.NotFound();

        Assert.Equal(OutcomeStatus.NotFound, outcome.Status);
        Assert.False(outcome.IsSuccess);
        Assert.Throws<InvalidOperationException>(() => outcome.Value);
    }

    [Fact]
    public void Invalid_carries_the_error_for_its_field()
    {
        var outcome = Outcome<int>.Invalid("timeZone", "Not a time zone.");

        Assert.Equal(OutcomeStatus.Invalid, outcome.Status);
        Assert.False(outcome.IsSuccess);
        Assert.Equal(["Not a time zone."], outcome.Errors["timeZone"]);
        Assert.Throws<InvalidOperationException>(() => outcome.Value);
    }

    [Fact]
    public void Invalid_can_carry_errors_for_several_fields()
    {
        var outcome = Outcome<int>.Invalid(new Dictionary<string, string[]>
        {
            ["name"] = ["A name is required."],
            ["type"] = ["Unknown type."],
        });

        Assert.Equal(OutcomeStatus.Invalid, outcome.Status);
        Assert.Equal(["A name is required."], outcome.Errors["name"]);
        Assert.Equal(["Unknown type."], outcome.Errors["type"]);
    }
}
