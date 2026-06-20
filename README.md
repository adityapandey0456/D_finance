# 🚀 D-Finance: Secure Fintech Routing & KYC Platform

D-Finance is a modern, full-stack fintech platform engineered for secure financial routing, real-time user verification, and cross-platform accessibility. Built with a focus on operational security, it features an integrated anti-fraud mechanism, live geotagging, and seamless KYC document capture.

The platform provides a native-like experience across web and mobile (Android) by leveraging a unified React and Capacitor architecture, backed by a robust Flask API.

---

## ✨ Core Features

* **🛡️ Secure KYC Onboarding:** Automated digital evidence collection (Passbook/Cancelled Cheque) using native device camera APIs.
* **📍 Real-Time Geotagging:** Mandatory anti-fraud check that locks application coordinates during the onboarding process.
* **📱 Cross-Platform Architecture:** Single codebase for web and mobile (Android) using Capacitor, ensuring consistent UI/UX and native performance.
* **🔐 Session Management:** Custom Axios interceptors for intelligent token injection, auto-logout on session expiry, and CORS handling.
* **⚡ Real-Time Dashboards:** Interactive and responsive UI built with modern web design principles (Glassmorphism, Tailwind CSS).

---

## 🛠️ Tech Stack

### Frontend & Mobile
* **Framework:** React.js (Vite)
* **Mobile Wrapper:** Capacitor JS (Android)
* **Styling:** Tailwind CSS
* **API Client:** Axios

### Backend
* **Framework:** Flask (Python)
* **Architecture:** RESTful APIs
* **Security:** JWT Authentication, Environment-based configuration

---

## 🚀 Getting Started

Follow these instructions to set up the project locally for development and testing.

### Prerequisites
* Node.js (v18+ recommended)
* Python (3.8+)
* Android Studio (for mobile compilation)
* Git
