using ExpenseTracker.API.Data;
using ExpenseTracker.API.Middleware;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Configure detailed logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.SetMinimumLevel(LogLevel.Information);

// Add services to the container.
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection"));
    // Enable detailed errors in development
    if (builder.Environment.IsDevelopment())
    {
        options.EnableDetailedErrors();
        options.EnableSensitiveDataLogging();
    }
});

// Configure CORS with more restrictive policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        builder => builder
            .WithOrigins("http://localhost:3000")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials()
            .SetIsOriginAllowed(_ => true)
            .WithExposedHeaders("Content-Disposition"));
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { 
        Title = "Expense Tracker API", 
        Version = "v1",
        Description = "API for managing personal expenses and income"
    });
});

var app = builder.Build();

// Ensure database is created and migrations are applied
try
{
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    
    // This will create the database and apply migrations
    await context.Database.MigrateAsync();
    logger.LogInformation("Database initialized successfully");
}
catch (Exception ex)
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogError(ex, "An error occurred while initializing the database.");
    throw; // Re-throw to prevent startup if database initialization fails
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    
    // In development, use more detailed error responses
    app.UseDeveloperExceptionPage();
}
else
{
    // Global exception handler for production
    app.UseExceptionHandler(errorApp =>
    {
        errorApp.Run(async context =>
        {
            context.Response.StatusCode = 500;
            context.Response.ContentType = "application/json";
            var error = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();
            if (error != null)
            {
                var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
                logger.LogError(error.Error, "Unhandled exception");
                await context.Response.WriteAsJsonAsync(new { 
                    error = "An unexpected error occurred. Please try again later." 
                });
            }
        });
    });
}

app.UseHttpsRedirection();

// Add rate limiting before CORS and other middleware
app.UseRateLimiting();

app.UseCors("AllowReactApp");
app.UseAuthorization();
app.MapControllers();

// Log when the application starts
var logger = app.Services.GetRequiredService<ILogger<Program>>();
logger.LogInformation("Application starting up on http://localhost:5202");

await app.RunAsync(); // Using async version for better error handling
