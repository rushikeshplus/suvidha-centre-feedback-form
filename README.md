# सुविधा Suvidha Centre — Citizen Video Feedback Portal

A modern, mobile-first **ASP.NET Core 8 MVC** web application designed for **Suvidha Centres** (community hygiene and sanitation initiative).

Citizens scan a QR code at the centre, enter their details, and record a **30-second video feedback** (with an option to stop anytime) directly from their smartphone camera.

---

## 🌟 Key Features

- **📱 Mobile-First & Responsive**: Clean white & brand blue design system optimized for smartphones and QR code scanning.
- **📹 Live Browser Video Recording**:
  - Uses the HTML5 `MediaRecorder` and `getUserMedia` APIs.
  - Automatically records up to **30 seconds** with live countdown timer.
  - **Stop Option**: Citizens can tap **"Stop Recording Now"** anytime they finish speaking.
  - **Review & Retake**: Allows citizens to review their recorded video (with audio) before submitting, or retake if needed.
- **🖨️ QR Code Kiosk Mode (`/qr`)**:
  - Dynamically generates a high-resolution QR code pointing to the application.
  - Ready to be printed or displayed on a kiosk screen.
- **🏢 Suvidha Services & Locations**:
  - Centres: Dharavi, Govandi, Ghatkopar, Mankhurd, Chembur, Kurla, and other settlements.
  - Facilities: Clean Toilets, Bathing & Shower, Laundry, and Safe Drinking Water ATM.
- **💾 Storage & Database**:
  - Stores citizen submissions in **SQLite** via **Entity Framework Core**.
  - Recorded video files saved locally to `wwwroot/uploads/`.

---

## 🛠️ Tech Stack

- **Backend**: ASP.NET Core 8 MVC
- **Database**: SQLite with Entity Framework Core
- **QR Code**: QRCoder (1.5.1)
- **Frontend**: HTML5, CSS3, JavaScript (MediaRecorder API)

---

## 🚀 Getting Started

### Prerequisites

- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)

### Run Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/rushikeshplus/suvidha-centre.git
   cd suvidha-centre
   ```

2. Build and run:
   ```bash
   dotnet restore
   dotnet run
   ```

3. Open in your browser:
   - Form & Video Recording: `http://localhost:5000/`
   - Kiosk QR Code: `http://localhost:5000/qr`

---

## 📄 License
MIT License.
