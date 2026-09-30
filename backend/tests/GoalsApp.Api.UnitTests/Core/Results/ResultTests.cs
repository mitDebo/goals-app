using GoalsApp.Api.Core.Results;

namespace GoalsApp.Api.UnitTests.Core.Results;

public class ResultTests
{
    [Fact]
    public void Success_carries_its_value()
    {
        var result = Result<int>.Success(42);

        Assert.Equal(ResultStatus.Success, result.Status);
        Assert.True(result.IsSuccess);
        Assert.Equal(42, result.Value);
        Assert.Empty(result.Errors);
    }

    [Fact]
    public void A_plain_value_converts_to_a_success()
    {
        Result<string> result = "hello";

        Assert.True(result.IsSuccess);
        Assert.Equal("hello", result.Value);
    }

    [Fact]
    public void Not_found_has_no_value()
    {
        var result = Result<int>.NotFound();

        Assert.Equal(ResultStatus.NotFound, result.Status);
        Assert.False(result.IsSuccess);
        Assert.Throws<InvalidOperationException>(() => result.Value);
    }

    [Fact]
    public void Invalid_carries_the_error_for_its_field()
    {
        var result = Result<int>.Invalid("timeZone", "Not a time zone.");

        Assert.Equal(ResultStatus.Invalid, result.Status);
        Assert.False(result.IsSuccess);
        Assert.Equal(["Not a time zone."], result.Errors["timeZone"]);
        Assert.Throws<InvalidOperationException>(() => result.Value);
    }
}
