using System.Collections.Concurrent;
using System.Net;

namespace ExpenseTracker.API.Middleware;

public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private static readonly ConcurrentDictionary<string, TokenBucket> _buckets = new();
    
    // Configure rate limits
    private const int MaxBurst = 20;          // Maximum burst size
    private const int TokensPerSecond = 10;   // Rate limit per second
    private const int WindowSeconds = 1;      // Time window in seconds

    public RateLimitingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var ipAddress = GetIpAddress(context);
        
        if (string.IsNullOrEmpty(ipAddress))
        {
            context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
            await context.Response.WriteAsJsonAsync(new { error = "Invalid IP address" });
            return;
        }

        var bucket = _buckets.GetOrAdd(ipAddress, _ => new TokenBucket(MaxBurst, TokensPerSecond, WindowSeconds));

        if (!bucket.TryConsume(1))
        {
            context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
            await context.Response.WriteAsJsonAsync(new { error = "Rate limit exceeded. Please try again later." });
            return;
        }

        await _next(context);
    }

    private static string? GetIpAddress(HttpContext context)
    {
        // Try to get IP from forwarded header first
        var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            return forwardedFor.Split(',')[0].Trim();
        }

        // Fall back to connection remote IP
        return context.Connection.RemoteIpAddress?.ToString();
    }
}

public class TokenBucket
{
    private readonly int _maxTokens;
    private readonly double _tokensPerSecond;
    private readonly object _syncRoot = new();
    private double _currentTokens;
    private DateTime _lastRefillTime;

    public TokenBucket(int maxTokens, double tokensPerSecond, int windowSeconds)
    {
        _maxTokens = maxTokens;
        _tokensPerSecond = tokensPerSecond;
        _currentTokens = maxTokens;
        _lastRefillTime = DateTime.UtcNow;
    }

    public bool TryConsume(int tokens)
    {
        lock (_syncRoot)
        {
            RefillTokens();

            if (_currentTokens >= tokens)
            {
                _currentTokens -= tokens;
                return true;
            }

            return false;
        }
    }

    private void RefillTokens()
    {
        var now = DateTime.UtcNow;
        var secondsElapsed = (now - _lastRefillTime).TotalSeconds;
        var tokensToAdd = secondsElapsed * _tokensPerSecond;

        _currentTokens = Math.Min(_maxTokens, _currentTokens + tokensToAdd);
        _lastRefillTime = now;
    }
}

// Extension method to register the middleware
public static class RateLimitingMiddlewareExtensions
{
    public static IApplicationBuilder UseRateLimiting(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<RateLimitingMiddleware>();
    }
}