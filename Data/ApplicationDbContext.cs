using Microsoft.EntityFrameworkCore;
using ExpenseTracker.API.Models;

namespace ExpenseTracker.API.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Transaction> Transactions { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Transaction entity
        modelBuilder.Entity<Transaction>(entity =>
        {
            // Add database constraints
            entity.Property(e => e.Description)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(e => e.Amount)
                .HasColumnType("decimal(18,2)")
                .IsRequired();

            entity.Property(e => e.Date)
                .IsRequired();

            entity.Property(e => e.Type)
                .IsRequired()
                .HasConversion<string>();

            // Add database index for better query performance
            entity.HasIndex(e => e.Date);
            entity.HasIndex(e => e.Type);
        });
    }

    public override int SaveChanges()
    {
        ValidateEntities();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ValidateEntities();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void ValidateEntities()
    {
        var entities = ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified);

        foreach (var entity in entities)
        {
            if (entity.Entity is Transaction transaction)
            {
                // Additional validation before saving to database
                if (transaction.Amount <= 0)
                {
                    throw new InvalidOperationException("Transaction amount must be greater than 0");
                }

                if (string.IsNullOrWhiteSpace(transaction.Description))
                {
                    throw new InvalidOperationException("Transaction description is required");
                }

                if (transaction.Description.Length > 200)
                {
                    throw new InvalidOperationException("Transaction description must not exceed 200 characters");
                }

                if (transaction.IsRecurring && !transaction.RecurringPeriod.HasValue)
                {
                    throw new InvalidOperationException("Recurring period is required for recurring transactions");
                }
            }
        }
    }
}