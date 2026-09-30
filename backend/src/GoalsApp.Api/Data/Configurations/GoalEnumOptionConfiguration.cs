using GoalsApp.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GoalsApp.Api.Data.Configurations;

public class GoalEnumOptionConfiguration : IEntityTypeConfiguration<GoalEnumOption>
{
    public void Configure(EntityTypeBuilder<GoalEnumOption> option)
    {
        option.ToTable("goal_enum_options");

        option.HasKey(o => o.Id);
        option.Property(o => o.Id).HasColumnName("id").ValueGeneratedNever();
        option.Property(o => o.UserId).HasColumnName("user_id");
        option.Property(o => o.GoalId).HasColumnName("goal_id");
        option.Property(o => o.Label).HasColumnName("label").IsRequired();
        option.Property(o => o.Note).HasColumnName("note");
        option.Property(o => o.Position).HasColumnName("position");
        option.Property(o => o.IsTarget).HasColumnName("is_target");
        option.Property(o => o.RetiredAt).HasColumnName("retired_at");

        option.HasIndex(o => new { o.GoalId, o.Label })
            .IsUnique()
            .HasDatabaseName("ux_goal_enum_options_goal_id_label");
    }
}
