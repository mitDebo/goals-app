using GoalsApp.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GoalsApp.Api.Data.Configurations;

public class AchievementConfiguration : IEntityTypeConfiguration<Achievement>
{
    public void Configure(EntityTypeBuilder<Achievement> achievement)
    {
        achievement.ToTable("achievements");

        // At most one tick per (run, goal, date).
        achievement.HasKey(a => new { a.RunId, a.GoalId, a.Date });
        achievement.Property(a => a.UserId).HasColumnName("user_id");
        achievement.Property(a => a.RunId).HasColumnName("run_id");
        achievement.Property(a => a.GoalId).HasColumnName("goal_id");
        achievement.Property(a => a.Date).HasColumnName("date");

        achievement.HasIndex(a => a.UserId).HasDatabaseName("ix_achievements_user_id");

        // A goal can't be deleted while it has ticks.
        achievement.HasOne<Goal>()
            .WithMany()
            .HasForeignKey(a => a.GoalId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
