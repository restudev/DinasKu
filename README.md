# DinasKu: Digital Official Travel Management System

DinasKu is a web-based system built to digitalize and streamline the administration and verification process of government business trips (Surat Perjalanan Dinas/SPD). The system replaces a fully manual workflow by integrating QR code verification, GPS validation, photo documentation, AI-based person detection, digital signatures, and automated PDF report generation into one platform.

---

## Problem

Government business trip documents are commonly managed manually, which leads to error-prone validation, difficulty tracking employee attendance at destination locations, lack of real-time verification, and time-consuming report generation. DinasKu addresses these issues through a structured digital verification workflow.

---

## Key Features

**Document Management**
- Upload and store SPD documents
- Document tracking and monitoring

**QR-Based Checkpoint Verification**
- Generate unique QR codes per checkpoint
- Token-based validation on scan

**Location and Photo Validation**
- Automatic GPS coordinate capture during checkpoint verification
- Field photo upload as proof of attendance

**AI Person Detection**
- Detect and count people in uploaded photos using YOLOv8
- Supports verification of reported participant numbers

**Digital Signature and Stamp**
- Signature canvas for digital signing
- Official stamp upload and validation

**Automated PDF Generation**
- Generate official verification reports
- Merge checkpoint data, signatures, stamps, and photos into final SPD document

---

## System Workflow

1. Admin uploads SPD document
2. QR codes are generated for each checkpoint
3. Employee scans QR code at destination
4. GPS coordinates and field photo are recorded
5. AI detects and counts people in the photo
6. Employee signs digitally and uploads official stamp
7. System generates final verification PDF automatically

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Laravel 12, REST API, FPDI, DomPDF |
| Database | PostgreSQL, Supabase Storage |
| AI | Python, YOLOv8, OpenCV |
| Other | QR Code Generator, Geolocation API, HTML5 Camera |

---

## Architecture

```
Frontend (React + TypeScript)
        ↓
Laravel REST API
        ↓
PostgreSQL + Supabase Storage
        ↓
Python AI Service (YOLOv8)
        ↓
PDF Report Generation
```

---

## Project Structure

```
├── e-sppd-ai/        # Python AI service (YOLOv8)
├── e-sppd-api/       # Laravel REST API
├── frontend/         # React TypeScript client
└── .env              # Environment config (not included)
```

---

## Getting Started

### Prerequisites
- Node.js
- PHP 8+
- Composer
- Python 3
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/username/e-sppd.git

# Frontend
cd frontend
npm install
npm run dev

# Backend API
cd e-sppd-api
composer install
cp .env.example .env
php artisan key:generate
php artisan serve

# AI Service
cd e-sppd-ai
pip install -r requirements.txt
python main.py
```

### Environment Variables

Create a `.env` file based on `.env.example` and fill in:

```
SUPABASE_URL=
SUPABASE_KEY=
```

---

## Status

Completed as a digital transformation project for official government travel document verification and monitoring. Core features including QR verification, GPS validation, AI person detection, digital signatures, and automated PDF generation are fully implemented.

---

## Author

**Restu Lestari** · [GitHub](https://github.com/restudev)