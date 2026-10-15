using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GoalsApp.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPlans : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "plans",
                schema: "goals",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    length_days = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_plans", x => x.id);
                    table.CheckConstraint("ck_plans_length_days", "length_days BETWEEN 1 AND 366");
                });

            migrationBuilder.CreateTable(
                name: "plan_goals",
                schema: "goals",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    plan_id = table.Column<Guid>(type: "uuid", nullable: false),
                    goal_id = table.Column<Guid>(type: "uuid", nullable: false),
                    position = table.Column<int>(type: "integer", nullable: false),
                    days = table.Column<List<int>>(type: "integer[]", nullable: true),
                    times = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_plan_goals", x => x.id);
                    table.CheckConstraint("ck_plan_goals_days_or_times", "(days IS NULL) <> (times IS NULL)");
                    table.CheckConstraint("ck_plan_goals_times", "times IS NULL OR times >= 1");
                    table.ForeignKey(
                        name: "FK_plan_goals_goals_goal_id",
                        column: x => x.goal_id,
                        principalSchema: "goals",
                        principalTable: "goals",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_plan_goals_plans_plan_id",
                        column: x => x.plan_id,
                        principalSchema: "goals",
                        principalTable: "plans",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_plan_goals_goal_id",
                schema: "goals",
                table: "plan_goals",
                column: "goal_id");

            migrationBuilder.CreateIndex(
                name: "ux_plan_goals_plan_id_goal_id",
                schema: "goals",
                table: "plan_goals",
                columns: new[] { "plan_id", "goal_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_plans_user_id",
                schema: "goals",
                table: "plans",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "plan_goals",
                schema: "goals");

            migrationBuilder.DropTable(
                name: "plans",
                schema: "goals");
        }
    }
}
