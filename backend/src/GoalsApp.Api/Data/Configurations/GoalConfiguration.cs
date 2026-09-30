using GoalsApp.Api.Data.Converters;
using GoalsApp.Api.Data.Entities;
using GoalsApp.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GoalsApp.Api.Data.Configurations;

public class GoalConfiguration : IEntityTypeConfiguration<Goal>
{
    public void Configure(EntityTypeBuilder<Goal> goal)
    {
        // The validator is the first line of defence; these keep every row consistent with its
        // type even if a bug slips past it.
        goal.ToTable("goals", table =>
        {
            table.HasCheckConstraint("ck_goals_type", $"type IN ({EnumNameConverter<GoalType>.SqlList()})");
            table.HasCheckConstraint("ck_goals_display_style",
                $"display_style IN ({EnumNameConverter<DisplayStyle>.SqlList()})");
            table.HasCheckConstraint("ck_goals_range",
                "(type = 'range') = (range_min IS NOT NULL AND range_max IS NOT NULL)"
                + " AND (range_min IS NULL OR range_min < range_max)"
                + " AND (type = 'range' OR (range_min_label IS NULL AND range_max_label IS NULL))");
            table.HasCheckConstraint("ck_goals_number", "type = 'number' OR number_unit IS NULL");
            table.HasCheckConstraint("ck_goals_enum", "(type = 'enum') = (enum_ordered IS NOT NULL)");
            table.HasCheckConstraint("ck_goals_target",
                "(target_comparison IS NULL) = (target_value IS NULL)"
                + $" AND (target_comparison IS NULL OR (type IN ('range', 'number')"
                + $" AND target_comparison IN ({EnumNameConverter<TargetComparison>.SqlList()})))");
        });

        goal.HasKey(g => g.Id);
        goal.Property(g => g.Id).HasColumnName("id").ValueGeneratedNever();
        goal.Property(g => g.UserId).HasColumnName("user_id");
        goal.Property(g => g.Name).HasColumnName("name").IsRequired();
        goal.Property(g => g.Description).HasColumnName("description");
        goal.Property(g => g.Type).HasColumnName("type").HasConversion(new EnumNameConverter<GoalType>());
        goal.Property(g => g.DisplayStyle).HasColumnName("display_style")
            .HasConversion(new EnumNameConverter<DisplayStyle>());
        goal.Property(g => g.Position).HasColumnName("position");
        goal.Property(g => g.RangeMin).HasColumnName("range_min");
        goal.Property(g => g.RangeMax).HasColumnName("range_max");
        goal.Property(g => g.RangeMinLabel).HasColumnName("range_min_label");
        goal.Property(g => g.RangeMaxLabel).HasColumnName("range_max_label");
        goal.Property(g => g.NumberUnit).HasColumnName("number_unit");
        goal.Property(g => g.EnumOrdered).HasColumnName("enum_ordered");
        goal.Property(g => g.TargetComparison).HasColumnName("target_comparison")
            .HasConversion(new EnumNameConverter<TargetComparison>());
        goal.Property(g => g.TargetValue).HasColumnName("target_value");
        goal.Property(g => g.ArchivedAt).HasColumnName("archived_at");
        goal.Property(g => g.CreatedAt).HasColumnName("created_at");
        goal.Property(g => g.UpdatedAt).HasColumnName("updated_at");

        goal.HasIndex(g => new { g.UserId, g.Position }).HasDatabaseName("ix_goals_user_id_position");

        goal.HasMany(g => g.Options)
            .WithOne()
            .HasForeignKey(o => o.GoalId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
