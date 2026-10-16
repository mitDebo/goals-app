using GoalsApp.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GoalsApp.Api.Data.Configurations;

public class RunConfiguration : IEntityTypeConfiguration<Run>
{
    public void Configure(EntityTypeBuilder<Run> run)
    {
        run.ToTable("runs", table =>
            table.HasCheckConstraint("ck_runs_dates", "end_date >= start_date"));

        run.HasKey(r => r.Id);
        run.Property(r => r.Id).HasColumnName("id").ValueGeneratedNever();
        run.Property(r => r.UserId).HasColumnName("user_id");
        run.Property(r => r.PlanId).HasColumnName("plan_id");
        run.Property(r => r.StartDate).HasColumnName("start_date");
        run.Property(r => r.EndDate).HasColumnName("end_date");
        run.Property(r => r.CreatedAt).HasColumnName("created_at");
        run.Property(r => r.UpdatedAt).HasColumnName("updated_at");

        run.HasIndex(r => r.UserId).HasDatabaseName("ix_runs_user_id");

        // A plan can't be deleted while it has runs.
        run.HasOne(r => r.Plan)
            .WithMany()
            .HasForeignKey(r => r.PlanId)
            .OnDelete(DeleteBehavior.Restrict);

        // Deleting a run deletes its ticks.
        run.HasMany(r => r.Achievements)
            .WithOne()
            .HasForeignKey(a => a.RunId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
