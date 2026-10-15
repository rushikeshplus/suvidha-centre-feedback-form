using System.ComponentModel.DataAnnotations;

namespace SuvidhaCentre.Models;

public class FeedbackEntry
{
    public int Id { get; set; }

    [Required(ErrorMessage = "Name is required")]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Phone number is required")]
    [Phone]
    [StringLength(15)]
    public string PhoneNumber { get; set; } = string.Empty;

    [StringLength(100)]
    public string? CentreLocation { get; set; }

    [StringLength(100)]
    public string? FacilityType { get; set; }

    public string? VideoFileName { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
