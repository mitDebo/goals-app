using GoalsApp.Api.Core.Outcomes;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace GoalsApp.Api.UnitTests.Core.Outcomes;

public class OutcomeHttpExtensionsTests
{
    [Fact]
    public void Success_uses_the_endpoint_s_own_response()
    {
        var http = Outcome<int>.Success(7).ToHttp(value => TypedResults.Ok(value * 2));

        var ok = Assert.IsType<Ok<int>>(http);
        Assert.Equal(14, ok.Value);
    }

    [Fact]
    public void Not_found_becomes_404()
    {
        var http = Outcome<int>.NotFound().ToHttp(_ => TypedResults.Ok());

        Assert.Equal(StatusCodes.Status404NotFound, Assert.IsAssignableFrom<IStatusCodeHttpResult>(http).StatusCode);
    }

    [Fact]
    public void Invalid_becomes_a_400_validation_problem_with_the_field_errors()
    {
        var http = Outcome<int>.Invalid("weekStart", "Must be sunday or monday.").ToHttp(_ => TypedResults.Ok());

        var problem = Assert.IsType<ValidationProblem>(http);
        Assert.Equal(StatusCodes.Status400BadRequest, problem.StatusCode);
        Assert.Equal(["Must be sunday or monday."], problem.ProblemDetails.Errors["weekStart"]);
    }

    [Fact]
    public void The_failure_only_mapping_handles_failures()
    {
        var http = Outcome<int>.NotFound().ToHttp();

        Assert.Equal(StatusCodes.Status404NotFound, Assert.IsAssignableFrom<IStatusCodeHttpResult>(http).StatusCode);
    }

    [Fact]
    public void The_failure_only_mapping_refuses_a_success()
    {
        Assert.Throws<InvalidOperationException>(() => Outcome<int>.Success(1).ToHttp());
    }
}
