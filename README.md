<div align="center">
  <img src="logo.png" alt="EasyBox Logo" width="300"/>

  # EasyBox

  **Advanced Hotspot & PPPoE Management Tool** for MikroTik RouterOS.

  [![Android App](https://img.shields.io/badge/Android-App-3DDC84?style=for-the-badge&logo=android&logoColor=white)](#android-application)
  [![MikroTik REST API](https://img.shields.io/badge/MikroTik-REST_API-00A9E0?style=for-the-badge&logo=mikrotik&logoColor=white)](#mikrotik-integration)
  [![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](#)
  [![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](#)
  [![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](#)
  [![Bootstrap](https://img.shields.io/badge/Bootstrap-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)](#)
  [![Capacitor](https://img.shields.io/badge/Capacitor-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)](#)
</div>

---

EasyBox is a dual-purpose application designed for WISP operators and hotspot administrators. It functions as a highly customizable **Hotspot Voucher Generator** and a **Mini-Winbox** directly communicating with MikroTik routers via the v7 REST API.

## 🚀 Key Features

### 🎟️ Voucher Generator
- **Fully Customizable:** Drag-and-drop editor to design physical voucher cards (200px x 100px).
- **Flexible Authentication:** Supports User-only or User + Password modes.
- **Dynamic Settings:** Configurable prefix, length, character sets, duration, validity, and data limits.
- **Export & Print:** Generate `.rsc` scripts, copy to clipboard, or print directly with optional QR codes.
- **Branding:** Custom currency, tag colors, gradients, and custom text overlays.

### 🎛️ Mini-Winbox (MikroTik Integration)
- **Direct REST API Connection:** Seamlessly connects to MikroTik RouterOS v7 via HTTP/HTTPS.
- **Hotspot Management:** View and manage Servers, User Profiles, Active Connections, IP Bindings, and more.
- **PPPoE Management:** View PPPoE Secrets and Active Connections.
- **Profile Management:** Store multiple router profiles locally for quick switching.

## 🛠️ Installation & Setup

### Web Application (Local Browser)
To run EasyBox locally on a PC browser, you must bypass CORS restrictions to communicate with the MikroTik API.

1. Clone the repository:
   ```bash
   git clone https://github.com/projectbaluga/Voucher-Generator.git
   cd Voucher-Generator
   ```
2. Launch Google Chrome with CORS disabled:
   ```bash
   # Windows
   chrome.exe --user-data-dir="C:/ChromeDevSession" --disable-web-security
   ```
3. Open `www/index.html` in the newly opened Chrome window.

### Android Application (Recommended)
The Android app bypasses CORS limitations natively using the Capacitor HTTP plugin.

#### Download the APK
You can download the latest pre-compiled `EasyBox.apk` directly from the repository root.

#### Build from Source
To build the Android APK yourself, ensure you have Node.js, npm, and Android Studio installed.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Sync web assets with Capacitor:
   ```bash
   npx cap sync android
   ```
3. Build the Debug APK:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
   *The compiled APK will be located at `android/app/build/outputs/apk/debug/app-debug.apk`.*

> **Note:** The application requires cleartext HTTP traffic to be explicitly enabled to communicate with local MikroTik routers over non-HTTPS REST APIs. This is already configured in the `AndroidManifest.xml` and `capacitor.config.json`.

## 📡 MikroTik Router Configuration

Ensure your MikroTik router (RouterOS v7+) is configured to accept REST API connections:
1. Open Winbox.
2. Go to **IP** &rarr; **Services**.
3. Enable `www` (port 80) or `www-ssl` (port 443).
   > *Crucial: The standard `api` service (port 8728) is a different protocol and will not work with EasyBox.*

## 📝 TODO List

Based on the current state of the application, here are the planned features and improvements:

### 🎛️ MikroTik & Mini-Winbox Integration
- [ ] **Full User Profile Management:** Implement dedicated editing modals for Hotspot User Profiles with support for `rate-limit`, `shared-users`, and `on-login` scripts.
- [ ] **PPPoE Secret Creation:** Add a form to create new PPPoE secrets (currently view/delete/enable only).
- [ ] **Service Ports & Cookies Editing:** Add support for modifying Service Ports and managing browser cookies directly from the interface.
- [ ] **System Logs Viewer:** Implement a real-time log viewer to monitor router events and authentication failures.
- [ ] **Improved Error Handling:** Implement auto-reconnect logic and more descriptive toast notifications for REST API timeouts.

### 🎟️ Voucher Generator & Editor
- [x] **QR Code Scanner / Importer:** Allow admins to scan QR codes or import them directly for fast profile setups.
- [ ] **Multi-Element Selection:** Enable selecting multiple elements (Ctrl+Click) to align or move them simultaneously.
- [ ] **Voucher Template Export:** Allow exporting specific voucher designs as standalone JSON files to share with other admins.
- [x] **Undo/Redo Persistence:** Save editor history state locally so accidental page refreshes don't lose progress.

### 📱 UI / UX Enhancements
- [ ] **Table Search & Filtering:** Add a search bar to Hotspot and PPPoE tables for faster user management.
- [ ] **Live Traffic Graphs:** Implement real-time bandwidth monitoring graphs for WAN and Local interfaces on the dashboard.
- [x] **Enhanced Mobile Responsiveness:** Optimized the Voucher Editor canvas for smaller screens.
- [x] **Dark Mode Support:** System-wide Dark Mode toggle implemented.
- [x] **Dashboard Analytics:** Visual dashboard showing active users, uptime, and resource usage.

### 🌍 General Enhancements
- [x] **Export Settings as JSON:** Backup/Restore for editor and router configurations.
- [x] **Multi-Language Support:** Full localization for English, Spanish, and Filipino (Tagalog).
- [ ] **Batch Operations:** Add capability to bulk-print or bulk-export selected vouchers from the "All Vouchers" list.
- [ ] **Role-Based Access Control (RBAC):** Implement local PIN/Password protection for Settings and Router configuration.

## 📄 License

This project is open-source and free to use and modify.
