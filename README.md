# DinasKu: e-SPPD Digitalization System

DinasKu is a web-based system that digitizes the government travel document workflow (SPPD) for a regional office in Indonesia. Built to replace a fully manual, paper-based process, the system handles document generation, OCR-based data extraction, digital signature collection, and travel reimbursement calculation in one integrated platform.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Tailwind CSS |
| Backend | Laravel, PHP |
| AI / OCR | Python, Tesseract OCR |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage |

---

## Features

- Upload and parse SPD documents using OCR
- Auto-fill travel document fields from extracted data
- Digital checkpoint signature collection
- Automatic reimbursement calculation based on travel data
- Document export to PDF and DOCX

---

## Project Structure

```
├── e-sppd-ai/        # Python OCR service
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

# AI / OCR Service
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

## Background

This project was built during an internship at a regional government office. The existing process required staff to manually fill, print, sign, and archive travel documents for every official trip — a process prone to errors and delays. DinasKu was developed to streamline this end-to-end, reducing document processing time significantly.

---

## Author

**Restu** · [GitHub](https://github.com/restudev)