using Microsoft.EntityFrameworkCore;
using SuvidhaCentre.Models;

namespace SuvidhaCentre.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<FeedbackEntry> FeedbackEntries => Set<FeedbackEntry>();
}
