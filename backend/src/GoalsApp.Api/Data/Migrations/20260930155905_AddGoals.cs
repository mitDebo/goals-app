using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GoalsApp.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddGoals : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "goals",
                schema: "goals",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    type = table.Column<string>(type: "text", nullable: false),
                    display_style = table.Column<string>(type: "text", nullable: false),
                    position = table.Column<int>(type: "integer", nullable: false),
                    range_min = table.Column<int>(type: "integer", nullable: true),
                    range_max = table.Column<int>(type: "integer", nullable: true),
                    range_min_label = table.Column<string>(type: "text", nullable: true),
                    range_max_label = table.Column<string>(type: "text", nullable: true),
                    number_unit = table.Column<string>(type: "text", nullable: true),
                    enum_ordered = table.Column<bool>(type: "boolean", nullable: true),
                    target_comparison = table.Column<string>(type: "text", nullable: true),
                    target_value = table.Column<decimal>(type: "numeric", nullable: true),
                    archived_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_goals", x => x.id);
                    table.CheckConstraint("ck_goals_display_style", "display_style IN ('toggle', 'input', 'options', 'slider', 'dial', 'buttons', 'stepper', 'emoji_scale')");
                    table.CheckConstraint("ck_goals_enum", "(type = 'enum') = (enum_ordered IS NOT NULL)");
                    table.CheckConstraint("ck_goals_number", "type = 'number' OR number_unit IS NULL");
                    table.CheckConstraint("ck_goals_range", "(type = 'range') = (range_min IS NOT NULL AND range_max IS NOT NULL) AND (range_min IS NULL OR range_min < range_max) AND (type = 'range' OR (range_min_label IS NULL AND range_max_label IS NULL))");
                    table.CheckConstraint("ck_goals_target", "(target_comparison IS NULL) = (target_value IS NULL) AND (target_comparison IS NULL OR (type IN ('range', 'number') AND target_comparison IN ('at_least', 'at_most')))");
                    table.CheckConstraint("ck_goals_type", "type IN ('boolean', 'range', 'number', 'enum')");
                });

            migrationBuilder.CreateTable(
                name: "goal_enum_options",
                schema: "goals",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    goal_id = table.Column<Guid>(type: "uuid", nullable: false),
                    label = table.Column<string>(type: "text", nullable: false),
                    note = table.Column<string>(type: "text", nullable: true),
                    position = table.Column<int>(type: "integer", nullable: false),
                    is_target = table.Column<bool>(type: "boolean", nullable: false),
                    retired_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_goal_enum_options", x => x.id);
                    table.ForeignKey(
                        name: "FK_goal_enum_options_goals_goal_id",
                        column: x => x.goal_id,
                        principalSchema: "goals",
                        principalTable: "goals",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ux_goal_enum_options_goal_id_label",
                schema: "goals",
                table: "goal_enum_options",
                columns: new[] { "goal_id", "label" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_goals_user_id_position",
                schema: "goals",
                table: "goals",
                columns: new[] { "user_id", "position" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "goal_enum_options",
                schema: "goals");

            migrationBuilder.DropTable(
                name: "goals",
                schema: "goals");
        }
    }
}
