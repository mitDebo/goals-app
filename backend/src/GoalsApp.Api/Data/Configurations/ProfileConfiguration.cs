using GoalsApp.Api.Core.Time;
using GoalsApp.Api.Data.Converters;
using GoalsApp.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GoalsApp.Api.Data.Configurations;

public class ProfileConfiguration : IEntityTypeConfiguration<Profile>
{
    public void Configure(EntityTypeBuilder<Profile> profile)
    {
        profile.ToTable("profiles", table =>
            table.HasCheckConstraint("ck_profiles_week_start", "week_start IN ('sunday', 'monday')"));

        profile.HasKey(p => p.UserId);
        profile.Property(p => p.UserId).HasColumnName("user_id").ValueGeneratedNever();
        profile.Property(p => p.TimeZone).HasColumnName("time_zone").IsRequired();
        profile.Property(p => p.WeekStart)
            .HasColumnName("week_start")
            .HasConversion(new EnumNameConverter<WeekStart>())
            .IsRequired();
        profile.Property(p => p.CreatedAt).HasColumnName("created_at");
        profile.Property(p => p.UpdatedAt).HasColumnName("updated_at");
    }
}
