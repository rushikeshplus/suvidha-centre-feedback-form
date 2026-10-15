using Microsoft.AspNetCore.Mvc;
using QRCoder;
using SuvidhaCentre.Data;
using SuvidhaCentre.Models;

namespace SuvidhaCentre.Controllers;

public class HomeController : Controller
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<HomeController> _logger;

    public HomeController(
        AppDbContext context,
        IWebHostEnvironment environment,
        ILogger<HomeController> logger)
    {
        _context = context;
        _environment = environment;
        _logger = logger;
    }

    [HttpGet]
    public IActionResult Index()
    {
        return View();
    }

    [HttpPost]
    [ActionName("Record")]
    public IActionResult SubmitFormAndRecord(string name, string phoneNumber, string? centreLocation, string? facilityType)
    {
        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(phoneNumber))
        {
            TempData["Error"] = "Name and phone number are required.";
            return RedirectToAction(nameof(Index));
        }

        TempData["Name"] = name.Trim();
        TempData["PhoneNumber"] = phoneNumber.Trim();
        TempData["CentreLocation"] = centreLocation?.Trim();
        TempData["FacilityType"] = facilityType?.Trim();

        // Redirect to the GET Record action
        return RedirectToAction("RecordVideo");
    }

    [HttpGet]
    public IActionResult RecordVideo()
    {
        var name = TempData["Name"]?.ToString();
        var phoneNumber = TempData["PhoneNumber"]?.ToString();

        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(phoneNumber))
        {
            return RedirectToAction(nameof(Index));
        }

        ViewBag.Name = name;
        ViewBag.PhoneNumber = phoneNumber;
        ViewBag.CentreLocation = TempData["CentreLocation"]?.ToString() ?? "Mumbai";
        ViewBag.FacilityType = TempData["FacilityType"]?.ToString() ?? "General";

        TempData.Keep();

        return View("Record");
    }

    [HttpPost]
    [RequestSizeLimit(104857600)] // 100 MB
    [RequestFormLimits(MultipartBodyLengthLimit = 104857600)]
    public async Task<IActionResult> UploadVideo(
        IFormFile? video,
        [FromForm] string? name,
        [FromForm] string? phoneNumber,
        [FromForm] string? centreLocation,
        [FromForm] string? facilityType)
    {
        try
        {
            var file = video ?? (Request.HasFormContentType ? Request.Form.Files.FirstOrDefault() : null);
            if (file == null || file.Length == 0)
            {
                _logger.LogWarning("UploadVideo: No video file received.");
                return BadRequest(new { success = false, message = "No video file was uploaded." });
            }

            var customerName = !string.IsNullOrWhiteSpace(name)
                ? name
                : (Request.HasFormContentType ? Request.Form["name"].ToString() : null);

            var phone = !string.IsNullOrWhiteSpace(phoneNumber)
                ? phoneNumber
                : (Request.HasFormContentType
                    ? (Request.Form.ContainsKey("phoneNumber") ? Request.Form["phoneNumber"].ToString() : Request.Form["phone"].ToString())
                    : null);

            if (string.IsNullOrWhiteSpace(customerName) || string.IsNullOrWhiteSpace(phone))
            {
                _logger.LogWarning("UploadVideo: Name or phone number missing.");
                return BadRequest(new { success = false, message = "Name and phone number are required." });
            }

            var location = !string.IsNullOrWhiteSpace(centreLocation)
                ? centreLocation
                : (Request.HasFormContentType && Request.Form.ContainsKey("centreLocation") ? Request.Form["centreLocation"].ToString() : null);

            var facility = !string.IsNullOrWhiteSpace(facilityType)
                ? facilityType
                : (Request.HasFormContentType && Request.Form.ContainsKey("facilityType") ? Request.Form["facilityType"].ToString() : null);

            var webRoot = _environment.WebRootPath;
            if (string.IsNullOrEmpty(webRoot))
            {
                webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            }

            var uploadsPath = Path.Combine(webRoot, "uploads");
            if (!Directory.Exists(uploadsPath))
            {
                Directory.CreateDirectory(uploadsPath);
            }

            var extension = Path.GetExtension(file.FileName);
            if (string.IsNullOrWhiteSpace(extension))
            {
                extension = ".webm";
            }

            var uniqueFileName = $"{Guid.NewGuid():N}_{DateTime.UtcNow:yyyyMMddHHmmss}{extension}";
            var filePath = Path.Combine(uploadsPath, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var entry = new FeedbackEntry
            {
                Name = customerName.Trim(),
                PhoneNumber = phone.Trim(),
                CentreLocation = location?.Trim(),
                FacilityType = facility?.Trim(),
                VideoFileName = uniqueFileName,
                CreatedAt = DateTime.UtcNow
            };

            _context.FeedbackEntries.Add(entry);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Feedback entry {Id} created successfully for {Name}", entry.Id, entry.Name);

            return Json(new { success = true, id = entry.Id, fileName = uniqueFileName });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while processing UploadVideo");
            return StatusCode(500, new { success = false, message = "An error occurred while uploading the video." });
        }
    }

    [HttpGet]
    public IActionResult ThankYou()
    {
        return View();
    }

    [HttpGet("qr")]
    public IActionResult Qr()
    {
        var targetUrl = $"{Request.Scheme}://{Request.Host}/";
        ViewBag.TargetUrl = targetUrl;
        return View();
    }

    [HttpGet("qr-image")]
    public IActionResult QrImage([FromQuery] string? url)
    {
        var target = string.IsNullOrWhiteSpace(url) ? $"{Request.Scheme}://{Request.Host}/" : url;
        using var qrGenerator = new QRCodeGenerator();
        var qrCodeData = qrGenerator.CreateQrCode(target, QRCodeGenerator.ECCLevel.Q);
        var qrCode = new PngByteQRCode(qrCodeData);
        var qrCodeBytes = qrCode.GetGraphic(20);
        return File(qrCodeBytes, "image/png");
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View();
    }
}
