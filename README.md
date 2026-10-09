# 🚜 Garage Bill Management System (GBMS)

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_Serverless-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payment_Gateway-0C2340?style=for-the-badge&logo=razorpay&logoColor=white)](https://razorpay.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**A high-performance, fully customizable, enterprise-grade workshop billing and operations operating system engineered for automotive garages, tractor service hubs, and multi-vehicle repair workshops.**

[Features](#-key-features) • [System Architecture](#-system-architecture) • [Payment Suite](#-multi-channel-payment-suite) • [WhatsApp Sharing](#-whatsapp-sharing-example) • [CRUD Safeguards](#-data-integrity--crud-safeguards) • [Quickstart](#-getting-started) • [Shortcuts](#-power-user-shortcuts) • [API Reference](#-api-routes--exports)

</div>

---

## 📖 Overview

**Garage Bill Management System (GBMS)** is an all-in-one operational platform built to replace traditional paper bills, disconnected spreadsheets, and rigid legacy software. Engineered with **Next.js 16 (App Router + Turbopack)**, **React 19**, **Drizzle ORM**, and **Tailwind CSS v4**, GBMS delivers blistering speed, uncompromising data integrity, and complete operational control.

From **multi-channel Razorpay payments** and **zero-fee NPCI UPI QR codes** to **1-click WhatsApp customer dispatch**, **automatic stock deduction with safe rollback**, **split payments**, **visual invoice layout customization**, and **comprehensive business analytics**, GBMS handles the entire garage workflow with precision.

```mermaid
graph TD
    A[Garage Owner / Operator] -->|Command Palette / UI| B[GBMS Next.js 16 Core Engine]
    B --> C[Invoice & Billing Wizard]
    B --> D[Customer & Vehicle CRM]
    B --> E[Inventory & Stock Controller]
    B --> F[Expense & Partner Payout Tracker]
    B --> G[Razorpay Multi-Channel Payment Suite]
    B --> H[Analytics & Reporting Engine]
    
    C -->|Auto Stock Deduction & Restore| E
    C -->|Generate Payment Link & QR| G
    C -->|Instant WhatsApp Dispatch & Vector PDF| I[Customer / WhatsApp / Print]
    
    G -->|Webhook / Reconcile| J[Payment Ledger & Customer Balance]
    J --> D
    
    B --> K[(Neon Serverless Postgres / Drizzle ORM)]
    B --> L[Visual Layout & Theme Engine - 64+ Palettes]
```

---

## ✨ Key Features

### ⚡ 1. Interactive Command Dashboard
* **Real-time Metrics:** Instant visibility into daily revenue, active bill count, pending dues, total customer base, and low-stock warnings.
* **Dynamic Time Filtering:** Seamlessly switch between custom date ranges, monthly views, and annual fiscal summaries.
* **Visual Revenue Stream:** Interactive weekly and monthly area charts powered by Recharts.
* **Instant Backup Trigger:** Run and download one-click database backups directly from the home view.

### 🧾 2. Intelligent Invoicing & Billing Engine
* **5-Step Invoice Wizard:** Streamlined workflow covering Customer $\rightarrow$ Vehicle $\rightarrow$ Labor Services $\rightarrow$ Spare Parts $\rightarrow$ Summary & Taxes.
* **Dynamic Calculations:** Automatic itemized line-item math with customizable labor rates, hourly multipliers, and part quantities.
* **Multi-Tier Discounting:** Apply flat currency ($\text{₹}$) or percentage ($\%$) discounts on subtotals.
* **Configurable GST / Taxes:** Support for default and custom tax rates with automatic tax breakdown calculation.
* **Multi-Payment Support:** Record cash, UPI, online gateway, or split payments (Cash + UPI) with exact payment timestamps.
* **Direct Thermal & Laser Print:** Crisp, print-optimized document layouts matching industry standard paper sizes.

### 💳 3. Multi-Channel Razorpay Payment Suite
* **Dynamic Payment Links:** Generate and dispatch branded payment links directly into customer WhatsApp messages.
* **On-Screen Razorpay Checkout:** Instant customer modal checkout accepting Credit/Debit Cards, UPI, NetBanking, and Wallets.
* **Dynamic On-Invoice QR:** Real-time Razorpay UPI QR code generation with live payment reconciliation.
* **Idempotent Webhooks:** Automated webhook handler (`/api/payments/razorpay`) with idempotency key tracking via `payment_webhook_events`.
* **High-Value Transaction Safeguard:** Automatic fallback to direct bank transfer (NEFT/RTGS) and manual UPI when bill amounts exceed single-transaction gateway limits.
* **Payment Ledger (`/payments`):** Dedicated transaction ledger logging all online gateway, manual cash, and UPI payments with live status sync, date filters, and 1-click CSV export.

### 📱 4. Zero-Fee UPI QR & 1-Click WhatsApp Dispatch
* **Zero-Fee NPCI UPI QR Integration:** Generates dynamic, on-invoice UPI QR codes embedding the payee VPA, payee name, transaction note, and exact invoice payable amount.
* **Direct WhatsApp Billing:** Pre-formats professional billing summaries with vehicle details, itemized service lines, payment links, and public PDF download links for 1-click WhatsApp opening.
* **Secure Public Invoice Links:** Time-based, cryptographically signed share tokens (`/api/share/[id]/pdf?token=...`) allowing customers to view and download their bills on mobile without logging in.

### 🎨 5. PDF Generation & Visual Layout Editor
* **High-Definition Vector PDFs:** Server-side and client-side PDF compilation powered by `pdf-lib`.
* **5 Built-in Architectural Invoice Formats:**
  1. `classic_boxed`: Structured boxed layout with clean borders.
  2. `centered_pro`: Clean header with centered garage identity and modern accents.
  3. `grid_structured`: Dense, high-information table grid format.
  4. `modern_accent`: Bold colored headers and sleek modern dividers.
  5. `original_standard`: Minimalist, ink-saving traditional layout.
* **Visual Drag-and-Drop Layout Editor:** Reorder invoice blocks, customize header styles, adjust page margins, toggle column visibility (HSN/SAC, Unit Price, Hours, Discount), and customize footer disclaimers.

### 🛡️ 6. Enterprise Data Integrity & Safe CRUD Engine
* **Foreign Key Safety:** Safe unlinking of vehicle (`invoices.vehicleId = null`) and spare part (`invoiceParts.sparePartId = null`) references prior to entity deletion, eliminating PostgreSQL RESTRICT constraint crashes.
* **Leak-Free Cascading Deletions:** Customer deletions automatically restore inventory stock to catalog, record stock history adjustment logs, cancel active Razorpay payment links, and cleanly cascade ledger entries.
* **Ledger Synchronization:** Manual cash/UPI payments recorded at invoice creation or detail view automatically sync into the payments ledger table.
* **Resilient Cache Invalidation:** Centralized safe cache revalidation preventing Next.js runtime invariant crashes outside active HTTP request contexts.

### 👥 7. Customer & Fleet CRM
* **Unified Customer Profiles:** Maintain contact directories, complete billing histories, lifetime spend calculations, and visit counters.
* **Vehicle Fleet Registry:** Link multiple vehicles per customer with detailed tracking:
  * Registration number (standardized uppercase)
  * Brand & Model
  * Year of manufacture
  * Engine Number & Chassis Number
  * Historical maintenance logs & repair notes

### 📦 8. Spare Parts & Inventory Control
* **Categorized Parts Catalog:** Organize stock by categories (Engine Parts, Filters, Oils & Lubricants, Electrical, Brakes, Transmission).
* **Automated Stock Deduction & Restore:** Real-time stock decrement when spare parts are billed, and automatic stock restoration when invoices are updated or deleted.
* **Low-Stock Alert System:** Set threshold levels (`minStockAlert`) to receive automated warnings when critical parts are running low.
* **Stock History Audit Trail:** Comprehensive ledger recording every stock movement (Purchase, Sale, Adjustment) with timestamped references.

### 💸 9. Expense Tracking & Profitability Analysis
* **Expense Categorization:** Track daily garage expenditures (Utilities, Shop Rent, Tools, Parts Restocking, Staff Wages, Tea/Snacks, Miscellaneous).
* **Partner Part Payouts:** Mark invoices for partner payouts and create corresponding expense records atomically.
* **Net Profit Insights:** Correlate total invoice revenue against operational expenses to analyze true garage profitability.

---

## 📲 WhatsApp Sharing Example

When an invoice is generated or viewed, clicking **Share via WhatsApp** opens WhatsApp with a pre-formatted message. Customer phone numbers are automatically sanitized (handling `+91`, leading zeros, dashes, and spaces).

### Sample Customer Dispatch:

```text
Dear Virendra Phirke,

Thank you for choosing Shrikrupa Tractors.
Here is the service invoice summary for your vehicle:

Invoice No: 20261009144039
Date: 09 Oct 2026
Vehicle Details: John Deere 5050 D (MH-12-AB-2244)

Service Details:
- Scheduled Maintenance & Engine Inspection
- Engine Oil 15W40 (Qty: 1)
- Oil Filter Replacement (Qty: 1)
- Fuel Filter Primary (Qty: 1)

------------------------
Grand Total: Rs. 14,850
Amount Paid: Rs. 0
Balance Due: Rs. 14,850
------------------------

Payment Status: UNPAID

Pay Online (UPI / Card / NetBanking):
https://rzp.io/i/sampleLinkX123

View & Download Full Invoice PDF:
https://yourgarageapp.com/api/share/42/pdf?token=a8f9c1e2d3b45678

For any queries, please feel free to reach out to us.

Regards,
Shrikrupa Tractors
```

> **Note:** If an invoice amount exceeds single-transaction gateway limits, the message automatically falls back to embedding Direct UPI details (`vpa` and `payeeName`) with NEFT/RTGS bank transfer instructions.

---

## 🎨 Flexibility & Customization

GBMS is designed to adapt to any garage or brand identity without requiring code modifications:

| Customization Vector | Capabilities |
| :--- | :--- |
| **🎨 64+ Color Schemes** | Built-in color engine featuring 64 palettes (Emerald, Ocean, Ruby, Gold, Indigo, Sunset, Teal, Forest, etc.) calculated using modern OKLCH color math. |
| **🌓 Theme Modes** | Instant Dark / Light mode switching with origin-tracked radial ripple animations. |
| **🎛️ Live CSS Token Editor** | Interactive visual inspector to tweak primary, secondary, card, border, background, and foreground color variables in real-time with JSON import/export. |
| **🔤 Typography Controls** | Dynamic font family switching (Inter, Outfit, Poppins, Plus Jakarta Sans, Roboto) and global font size scaling. |
| **🔊 Audio Feedback System** | Configurable sound effects (Success, Click, Warning, Error, Create, Delete) with selectable sound packs. |
| **🚜 Pre-loaded Automotive Data** | Out-of-the-box support for leading manufacturers: Mahindra, Swaraj, John Deere, Sonalika, Massey Ferguson, New Holland, Kubota, Farmtrac, Powertrac, Eicher, Escorts, Force, and 100+ standard spare parts catalog. |

---

## 🏗️ System Architecture

```text
├── 00 services/                 # Pre-configured seed data
│   ├── tractor_brands.json      # Manufacturer brand registry
│   ├── tractor_models.json      # Model series & variants
│   ├── tractor_services.json    # Standard garage labor service catalog
│   └── tractor_spare_parts_seed.json # Standard spare parts catalog
├── 01 notification/             # Audio notification assets
├── public/                      # Static assets & icons
├── src/
│   ├── app/
│   │   ├── (dashboard)/         # Protected application layout & pages
│   │   │   ├── analytics/       # Visual reporting & Recharts dashboards
│   │   │   ├── customers/       # Customer CRM & vehicle associations
│   │   │   ├── expenses/        # Daily expense ledger & categorization
│   │   │   ├── inventory/       # Stock tracking & category management
│   │   │   ├── invoices/        # Invoice listing, detail view & wizard
│   │   │   ├── payments/        # Centralized Payment Ledger (Razorpay + Cash)
│   │   │   ├── profile/         # Garage owner profile & credentials
│   │   │   ├── reports/         # Financial reports & date-range exports
│   │   │   ├── settings/        # System configuration & Layout Editor
│   │   │   └── vehicles/        # Vehicle fleet registry & service logs
│   │   ├── api/
│   │   │   ├── backup/          # Database backup & restore endpoints
│   │   │   ├── export/csv/      # CSV/Excel data dump generator
│   │   │   ├── invoices/        # PDF generation API
│   │   │   ├── payments/        # Razorpay Payment Links, Orders & Webhooks
│   │   │   ├── preview-invoice/ # Live invoice preview renderer
│   │   │   ├── share/           # Public customer invoice proxy
│   │   │   └── share-token/     # Cryptographic sharing token generator
│   │   ├── login/               # Authentication portal
│   │   ├── globals.css          # Tailwind CSS v4 & theme variables
│   │   └── layout.tsx           # Global root layout & theme provider
│   ├── components/
│   │   ├── command-palette.tsx  # Ctrl+K global navigation & actions
│   │   ├── global-shortcuts.tsx # Keyboard shortcut listener
│   │   ├── shortcuts-modal.tsx  # Interactive shortcuts cheat sheet (?)
│   │   ├── theme-editor.tsx     # Real-time CSS token customization panel
│   │   ├── theme-provider.tsx   # OKLCH color engine & sound manager
│   │   └── ui/                  # Accessible Base UI & Radix primitives
│   ├── db/
│   │   ├── index.ts             # Neon Serverless Postgres client
│   │   ├── schema.ts            # Drizzle ORM schema & relations
│   │   └── seed.ts              # Database seeding script
│   └── lib/
│       ├── actions/             # Secure Next.js Server Actions (CRUD)
│       ├── auth.ts              # Jose JWT session management & cookies
│       ├── payments/            # Razorpay integration & ledger calculation
│       ├── pdf/                 # Multi-template vector PDF compilation
│       ├── qr/                  # NPCI UPI QR string & image generator
│       ├── safe-revalidate.ts   # Resilient Next.js cache revalidation helper
│       └── utils.ts             # Formatting & currency helpers
```

---

## 🗄️ Database Entity-Relationship Model

```mermaid
erDiagram
    GARAGE_SETTINGS {
        int id PK
        string name
        string phone
        string email
        string gstNumber
        string invoiceTheme
        string invoiceFormat
        jsonb customLayoutConfig
    }
    UPI_SETTINGS {
        int id PK
        string vpa
        string payeeName
        string merchantCode
        boolean isEnabled
    }
    CUSTOMERS ||--o{ VEHICLES : owns
    CUSTOMERS ||--o{ INVOICES : billed_to
    CUSTOMERS {
        int id PK
        string name
        string phone UK
        string email
        string address
        float outstandingBalance
        float totalSpent
        int visitCount
    }
    VEHICLES ||--o{ INVOICES : serviced_for
    VEHICLES {
        int id PK
        int customerId FK
        string registrationNumber UK
        string brand
        string model
        int year
        string engineNumber
        string chassisNumber
    }
    CATEGORIES ||--o{ SPARE_PARTS : classifies
    CATEGORIES {
        int id PK
        string name
        string description
    }
    SPARE_PARTS ||--o{ INVOICE_PARTS : used_in
    SPARE_PARTS ||--o{ STOCK_HISTORY : tracked_by
    SPARE_PARTS {
        int id PK
        string name
        int categoryId FK
        string partNumber
        string unit
        int stock
        int minStockAlert
        int purchasePrice
        int sellingPrice
    }
    INVOICES ||--o{ INVOICE_LABORS : contains
    INVOICES ||--o{ INVOICE_PARTS : contains
    INVOICES ||--o{ PAYMENTS : ledger_entries
    INVOICES {
        int id PK
        string invoiceNumber UK
        int customerId FK
        int vehicleId FK
        float laborTotal
        float partsTotal
        float subtotal
        float taxAmount
        float discountAmount
        float grandTotal
        float amountPaid
        float cashAmount
        float upiAmount
        string paymentStatus
        string paymentMethod
        timestamp paymentDoneAt
        timestamp partnerPaidAt
    }
    INVOICE_LABORS {
        int id PK
        int invoiceId FK
        string description
        float hours
        float rate
        float total
    }
    INVOICE_PARTS {
        int id PK
        int invoiceId FK
        int sparePartId FK
        string partName
        int quantity
        float unitPrice
        float total
    }
    EXPENSES {
        int id PK
        string category
        string description
        float amount
        timestamp date
        string paymentMethod
    }
    STOCK_HISTORY {
        int id PK
        int sparePartId FK
        string type
        int quantity
        int previousStock
        int newStock
        string reference
    }
    PAYMENTS {
        int id PK
        int invoiceId FK
        int amount
        string paymentMethod
        string status
        string source
        string razorpayOrderId UK
        string razorpayPaymentId UK
        string razorpayPaymentLinkId
        text paymentLinkUrl
        timestamp paidAt
    }
    PAYMENT_WEBHOOK_EVENTS {
        int id PK
        string eventId UK
        string eventType
        jsonb payload
        boolean processed
        timestamp processedAt
    }
```

---

## ⌨️ Power-User Shortcuts

Speed up daily operations with built-in global keybindings:

| Shortcut | Scope | Action |
| :--- | :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> / <kbd>Cmd</kbd> + <kbd>K</kbd> | Global | Open Command Palette (Search pages, actions, and entities) |
| <kbd>?</kbd> | Global | Open Keyboard Shortcuts Cheat Sheet modal |
| <kbd>Ctrl</kbd> + <kbd>S</kbd> / <kbd>Cmd</kbd> + <kbd>S</kbd> | Forms | Quick Save current form or settings |
| <kbd>Ctrl</kbd> + <kbd>P</kbd> / <kbd>Cmd</kbd> + <kbd>P</kbd> | Invoices | Instant Print / PDF Generation |
| <kbd>c</kbd> $\rightarrow$ <kbd>n</kbd> | Sequential | Create New Invoice |
| <kbd>g</kbd> $\rightarrow$ <kbd>d</kbd> | Navigation | Go to Dashboard |
| <kbd>g</kbd> $\rightarrow$ <kbd>i</kbd> | Navigation | Go to Invoices |
| <kbd>g</kbd> $\rightarrow$ <kbd>c</kbd> | Navigation | Go to Customers |
| <kbd>g</kbd> $\rightarrow$ <kbd>v</kbd> | Navigation | Go to Vehicles |
| <kbd>g</kbd> $\rightarrow$ <kbd>s</kbd> | Navigation | Go to Spare Parts / Inventory |
| <kbd>g</kbd> $\rightarrow$ <kbd>e</kbd> | Navigation | Go to Expenses |
| <kbd>g</kbd> $\rightarrow$ <kbd>p</kbd> | Navigation | Go to Payments Ledger |
| <kbd>g</kbd> $\rightarrow$ <kbd>r</kbd> | Navigation | Go to Reports & Analytics |

---

## 📦 Getting Started

### 📋 Prerequisites
* **Node.js:** v18.17+ or v20+ recommended
* **Package Manager:** `npm`, `pnpm`, or `yarn`
* **PostgreSQL Database:** [Neon Serverless](https://neon.tech/) or any PostgreSQL 14+ database
* **Razorpay Account (Optional):** For automated online payment links & checkout ([Razorpay Dashboard](https://dashboard.razorpay.com/))

### 🛠️ Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Virendra-Phirke/GARAJ_BILL_MANAGEMENT-.git
   cd GARAJ_BILL_MANAGEMENT-
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Copy the provided `.env.example` template to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

   Open `.env.local` and populate your credentials with your own keys:
   ```env
   # ─── Database Configuration ──────────────────────────────────────────────────
   DATABASE_URL="postgresql://username:password@ep-sample-pooler.region.neon.tech/neondb?sslmode=require"

   # ─── Admin Authentication ────────────────────────────────────────────────────
   ADMIN_USERNAME="admin"
   ADMIN_PASSWORD="YourSecurePasswordHere"

   # ─── JWT Session Secret (Random 32+ character string) ────────────────────────
   JWT_SECRET="your-32-character-random-jwt-secret-string-here"

   # ─── Public Application URL (for shareable links & webhooks) ─────────────────
   NEXT_PUBLIC_APP_URL="http://localhost:3000"

   # ─── Razorpay Payment Gateway ────────────────────────────────────────────────
   RAZORPAY_KEY_ID="rzp_test_YourSampleKeyIdHere"
   RAZORPAY_KEY_SECRET="YourSampleKeySecretHere"
   RAZORPAY_WEBHOOK_SECRET="your_sample_webhook_secret_here"

   # Client-side public key
   NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_YourSampleKeyIdHere"
   ```

4. **Initialize Database Schema & Seeds**
   Push the Drizzle ORM schema to your database and optionally run the starter seed script:
   ```bash
   # Push schema migrations
   npx drizzle-kit push

   # Seed sample customers, vehicles, spare parts, and invoices
   npx tsx src/db/seed.ts
   ```

5. **Run the Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

6. **Production Build**
   ```bash
   npm run build
   npm run start
   ```

---

## 🌐 API Routes & Exports

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/payments/razorpay/payment-link` | `POST` | Generate or retrieve active Razorpay Payment Link for an invoice |
| `/api/payments/razorpay/create-order` | `POST` | Create standard Razorpay Order for in-browser modal checkout |
| `/api/payments/razorpay/verify` | `POST` | Verify HMAC SHA256 payment signature and reconcile invoice |
| `/api/webhooks/razorpay` | `POST` | Process Razorpay payment events (`payment.captured`, `payment_link.paid`) with idempotency |
| `/api/invoices/[id]/pdf` | `GET` | Generate and stream vector PDF for authenticated users |
| `/api/share/[id]/pdf` | `GET` | Stream vector PDF for customers using a cryptographic share token |
| `/api/share-token/[id]` | `GET` | Issue signed URL token for public invoice access |
| `/api/export/csv` | `GET` | Export complete CSV dumps for Invoices, Customers, Inventory, or Expenses |
| `/api/backup` | `GET` / `POST` | Create, download, or restore full database JSON backups |

---

## 🔒 Security & Data Integrity

* **Stateless JWT Sessions:** Implemented with `jose`, utilizing cryptographically signed, HTTP-only, `SameSite=Lax` cookies.
* **Webhook Idempotency:** Every Razorpay webhook event is stored and checked against `payment_webhook_events` by unique event ID to prevent duplicate reconciliations.
* **HMAC SHA256 Verification:** All client-side checkout completions require cryptographic signature validation against the server's API secret.
* **Leak-Free Inventory Lifecycle:** Invoices, updates, and customer deletions automatically adjust inventory stock and log timestamped audit references.
* **Scoped Customer Sharing:** Invoices are shared via short-lived, verified cryptographic tokens preventing unauthorized access.
* **Zero Secrets in Client Bundles:** Sensitive keys (`RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `JWT_SECRET`, and `DATABASE_URL`) are strictly isolated to server contexts.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Built for precision, speed, and elegance in modern automotive and workshop management.</sub>
</div>
