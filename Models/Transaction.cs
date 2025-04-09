using System.ComponentModel.DataAnnotations;

namespace ExpenseTracker.API.Models;

public class Transaction
{
    public int Id { get; set; }

    [Required]
    [StringLength(200, MinimumLength = 3)]
    public required string Description { get; set; }

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0")]
    public decimal Amount { get; set; }

    [Required]
    public DateTime Date { get; set; }

    [Required]
    public TransactionType Type { get; set; }

    public bool IsRecurring { get; set; }

    public RecurringPeriod? RecurringPeriod { get; set; }
}

public enum TransactionType
{
    Expense,
    Income
}

public enum RecurringPeriod
{
    Monthly,
    Quarterly,
    Yearly
}