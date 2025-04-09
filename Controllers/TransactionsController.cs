using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ExpenseTracker.API.Data;
using ExpenseTracker.API.Models;
using System.ComponentModel.DataAnnotations;

namespace ExpenseTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TransactionsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<TransactionsController> _logger;

    public TransactionsController(ApplicationDbContext context, ILogger<TransactionsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Transaction>>> GetTransactions()
    {
        try
        {
            return await _context.Transactions
                .OrderByDescending(t => t.Date)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving transactions");
            return StatusCode(500, "An error occurred while retrieving transactions");
        }
    }

    [HttpGet("monthly-report")]
    public async Task<ActionResult<object>> GetMonthlyReport([Range(1, 12)] int month, [Range(2000, 9999)] int year)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var transactions = await _context.Transactions
                .Where(t => t.Date.Year == year && t.Date.Month == month)
                .ToListAsync();

            var totalIncome = transactions
                .Where(t => t.Type == TransactionType.Income)
                .Sum(t => t.Amount);

            var totalExpenses = transactions
                .Where(t => t.Type == TransactionType.Expense)
                .Sum(t => t.Amount);

            var balance = totalIncome - totalExpenses;

            return new
            {
                TotalIncome = totalIncome,
                TotalExpenses = totalExpenses,
                Balance = balance,
                IsPositive = balance >= 0,
                Transactions = transactions
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating monthly report for {Month}/{Year}", month, year);
            return StatusCode(500, "An error occurred while generating the monthly report");
        }
    }

    [HttpPost]
    public async Task<ActionResult<Transaction>> CreateTransaction(Transaction transaction)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (transaction.IsRecurring && !transaction.RecurringPeriod.HasValue)
            {
                ModelState.AddModelError("RecurringPeriod", "Recurring period is required for recurring transactions");
                return BadRequest(ModelState);
            }

            _context.Transactions.Add(transaction);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Transaction created: {Id}", transaction.Id);
            return CreatedAtAction(nameof(GetTransactions), new { id = transaction.Id }, transaction);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating transaction");
            return StatusCode(500, "An error occurred while creating the transaction");
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTransaction(int id, Transaction transaction)
    {
        try
        {
            if (id != transaction.Id)
            {
                return BadRequest("Transaction ID mismatch");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.Entry(transaction).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Transaction updated: {Id}", id);
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TransactionExists(id))
                {
                    return NotFound();
                }
                throw;
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating transaction {Id}", id);
            return StatusCode(500, "An error occurred while updating the transaction");
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTransaction(int id)
    {
        try
        {
            var transaction = await _context.Transactions.FindAsync(id);
            if (transaction == null)
            {
                return NotFound();
            }

            _context.Transactions.Remove(transaction);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Transaction deleted: {Id}", id);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting transaction {Id}", id);
            return StatusCode(500, "An error occurred while deleting the transaction");
        }
    }

    private bool TransactionExists(int id)
    {
        return _context.Transactions.Any(e => e.Id == id);
    }
}