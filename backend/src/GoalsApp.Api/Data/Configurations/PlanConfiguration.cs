using GoalsApp.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GoalsApp.Api.Data.Configurations;

public class PlanConfiguration : IEntityTypeConfiguration<Plan>
{
    public void Configure(EntityTypeBuilder<Plan> plan)
    {
        plan.ToTable("plans", table =>
            table.HasCheckConstraint("ck_plans_length_days", "length_days BETWEEN 1 AND 366"));

        plan.HasKey(p => p.Id);
        plan.Property(p => p.Id).HasColumnName("id").ValueGeneratedNever();
        plan.Property(p => p.UserId).HasColumnName("user_id");
        plan.Property(p => p.Name).HasColumnName("name").IsRequired();
        plan.Property(p => p.LengthDays).HasColumnName("length_days");
        plan.Property(p => p.CreatedAt).HasColumnName("created_at");
        plan.Property(p => p.UpdatedAt).HasColumnName("updated_at");

        plan.HasIndex(p => p.UserId).HasDatabaseName("ix_plans_user_id");

        plan.HasMany(p => p.Goals)
            .WithOne()
            .HasForeignKey(g => g.PlanId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
