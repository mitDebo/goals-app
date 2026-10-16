using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GoalsApp.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddRuns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "runs",
                schema: "goals",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    plan_id = table.Column<Guid>(type: "uuid", nullable: false),
                    start_date = table.Column<DateOnly>(type: "date", nullable: false),
                    end_date = table.Column<DateOnly>(type: "date", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_runs", x => x.id);
                    table.CheckConstraint("ck_runs_dates", "end_date >= start_date");
                    table.ForeignKey(
                        name: "FK_runs_plans_plan_id",
                        column: x => x.plan_id,
                        principalSchema: "goals",
                        principalTable: "plans",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "achievements",
                schema: "goals",
                columns: table => new
                {
                    run_id = table.Column<Guid>(type: "uuid", nullable: false),
                    goal_id = table.Column<Guid>(type: "uuid", nullable: false),
                    date = table.Column<DateOnly>(type: "date", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_achievements", x => new { x.run_id, x.goal_id, x.date });
                    table.ForeignKey(
                        name: "FK_achievements_goals_goal_id",
                        column: x => x.goal_id,
                        principalSchema: "goals",
                        principalTable: "goals",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_achievements_runs_run_id",
                        column: x => x.run_id,
                        principalSchema: "goals",
                        principalTable: "runs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_achievements_goal_id",
                schema: "goals",
                table: "achievements",
                column: "goal_id");

            migrationBuilder.CreateIndex(
                name: "ix_achievements_user_id",
                schema: "goals",
                table: "achievements",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_runs_plan_id",
                schema: "goals",
                table: "runs",
                column: "plan_id");

            migrationBuilder.CreateIndex(
                name: "ix_runs_user_id",
                schema: "goals",
                table: "runs",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "achievements",
                schema: "goals");

            migrationBuilder.DropTable(
                name: "runs",
                schema: "goals");
        }
    }
}
