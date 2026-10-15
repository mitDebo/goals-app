using GoalsApp.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GoalsApp.Api.Data.Configurations;

public class PlanGoalConfiguration : IEntityTypeConfiguration<PlanGoal>
{
    public void Configure(EntityTypeBuilder<PlanGoal> planGoal)
    {
        planGoal.ToTable("plan_goals", table =>
        {
            table.HasCheckConstraint("ck_plan_goals_days_or_times", "(days IS NULL) <> (times IS NULL)");
            table.HasCheckConstraint("ck_plan_goals_times", "times IS NULL OR times >= 1");
        });

        planGoal.HasKey(g => g.Id);
        planGoal.Property(g => g.Id).HasColumnName("id").ValueGeneratedNever();
        planGoal.Property(g => g.UserId).HasColumnName("user_id");
        planGoal.Property(g => g.PlanId).HasColumnName("plan_id");
        planGoal.Property(g => g.GoalId).HasColumnName("goal_id");
        planGoal.Property(g => g.Position).HasColumnName("position");
        planGoal.Property(g => g.Days).HasColumnName("days");
        planGoal.Property(g => g.Times).HasColumnName("times");

        planGoal.HasIndex(g => new { g.PlanId, g.GoalId })
            .IsUnique()
            .HasDatabaseName("ux_plan_goals_plan_id_goal_id");

        // A goal can't be deleted while a plan uses it.
        planGoal.HasOne(g => g.Goal)
            .WithMany()
            .HasForeignKey(g => g.GoalId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
