# 🚜 Garage Bill Management System (GBMS)

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_Serverless-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**A high-performance, fully customizable, modern workshop billing and operations operating system engineered for automotive garages, tractor service hubs, and multi-vehicle repair workshops.**

[Features](#-key-features) • [System Architecture](#-system-architecture) • [Flexibility Showcase](#-flexibility--customization) • [Quickstart](#-getting-started) • [Keyboard Shortcuts](#-power-user-shortcuts) • [API & Exports](#-api-routes--exports)

</div>

---

## 📖 Overview

**Garage Bill Management System (GBMS)** is an end-to-end operational platform built to replace traditional paper bills, disconnected spreadsheets, and rigid legacy software. Developed with **Next.js 16 (App Router)**, **React 19**, **Drizzle ORM**, and **Tailwind CSS v4**, GBMS brings speed, flexibility, and visual clarity to daily garage workflows.

From instant **UPI QR-coded invoices** and **1-click WhatsApp customer dispatch** to **live stock deduction**, **split payments**, **visual layout customization**, and **comprehensive business analytics**, GBMS provides complete control over your garage operations.

```mermaid
graph TD
    A[Garage Owner / Operator] -->|Command Palette / UI| B[GBMS Next.js 16 Core]
    B --> C[Invoice & Billing Engine]
    B --> D[Customer & Vehicle CRM]
    B --> E[Inventory & Stock Controller]
    B --> F[Expense & Financial Tracker]
    B --> G[Analytics & Reporting]
    
    C -->|Auto Stock Deduction| E
    C -->|Dynamic UPI QR & PDF| H[Customer / WhatsApp / Print]
    C -->|Split Cash/UPI Ledger| F
    
    B --> I[(Neon Serverless Postgres / Drizzle ORM)]
    B --> J[Visual Layout & Theme Engine - 64+ Palettes]
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
* **Split Payment Support:** Record full, partial, or split transactions (Cash + UPI) with exact payment timestamps.
* **Direct Thermal & Laser Print:** Crisp, print-optimized document layouts matching industry standard paper sizes.

### 📱 3. UPI QR Generation & 1-Click WhatsApp Sharing
* **Zero-Fee NPCI UPI QR Integration:** Generates dynamic, on-invoice UPI QR codes embedding the payee VPA, payee name, transaction note, and exact invoice payable amount.
* **Direct WhatsApp Billing:** Generate pre-formatted billing summaries and dispatch them to the customer's WhatsApp with one click.
* **Secure Public Invoice Links:** Time-based, cryptographically signed share tokens (`/api/share-token/[id]`) allowing customers to view and download their bills on mobile without logging in.

### 🎨 4. PDF Generation & Visual Layout Editor
* **High-Definition Vector PDFs:** Server-side and client-side PDF compilation powered by `pdf-lib`.
* **5 Built-in Architectural Invoice Formats:**
  1. `classic_boxed`: Structured boxed layout with clean borders.
  2. `centered_pro`: Clean header with centered garage identity and modern accents.
  3. `grid_structured`: Dense, high-information table grid format.
  4. `modern_accent`: Bold colored headers and sleek modern dividers.
  5. `original_standard`: Minimalist, ink-saving traditional layout.
* **Visual Drag-and-Drop Layout Editor:** Reorder invoice blocks, customize header styles, adjust page margins, toggle column visibility (HSN/SAC, Unit Price, Hours, Discount), and customize footer disclaimers.

### 👥 5. Customer & Fleet CRM
* **Unified Customer Profiles:** Maintain contact directories, complete billing histories, lifetime spend calculations, and visit counters.
* **Vehicle Fleet Registry:** Link multiple vehicles per customer with detailed tracking:
  * Registration number
  * Brand & Model
  * Year of manufacture
  * Engine Number & Chassis Number
  * Historical maintenance logs & repair notes

### 📦 6. Spare Parts & Inventory Control
* **Categorized Parts Catalog:** Organize stock by categories (Engine Parts, Filters, Oils & Lubricants, Electrical, Brakes, Transmission).
* **Automated Stock Deduction:** Real-time stock decrement when spare parts are added to finalized invoices.
* **Low-Stock Alert System:** Set threshold levels (`minStockAlert`) to receive automated warnings when critical parts are running low.
* **Stock History Audit Trail:** Comprehensive ledger recording every stock movement (Purchase, Sale, Manual Adjustment) with timestamped references.

### 💸 7. Expense Tracking & Profitability Analysis
* **Expense Categorization:** Track daily garage expenditures (Utilities, Shop Rent, Tools, Parts Restocking, Staff Wages, Tea/Snacks, Miscellaneous).
* **Payment Mode Tracking:** Categorize outflows by Cash, UPI, Bank Transfer, or Card.
* **Net Profit Insights:** Correlate total invoice revenue against operational expenses to analyze true garage profitability.

### 📊 8. Reports & Data Export
* **Visual Analytics:** Breakdown of top revenue-generating services, high-demand spare parts, and monthly sales distributions.
* **CSV & Excel Data Export:** Export full data dumps for Invoices, Customers, Spare Parts Inventory, and Expenses for external accounting (Tally, Zoho, Excel).

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
| **🚜 Pre-loaded Automotive Data** | Out-of-the-box support for leading manufacturers: Mahindra, Swaraj, John Deere, Sonalika, Massey Ferguson, New Holland, Kubota, Farmtrac, Powertrac, Eicher, Escorts, Force, and 100+ spare parts seed data. |

---

## 🏗️ System Architecture

```text
├── 00 services/                 # Pre-configured seed data
│   ├── tractor_brands.json      # Manufacturer brand registry
│   ├── tractor_models.json      # Model series & variants
│   ├── tractor_services.json    # Standard garage labor service catalog
│   └── tractor_spare_parts_seed.json # 100+ standard spare parts catalog
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
│   │   │   ├── profile/         # Garage owner profile & credentials
│   │   │   ├── reports/         # Financial reports & date-range exports
│   │   │   ├── settings/        # System configuration & Layout Editor
│   │   │   └── vehicles/        # Vehicle fleet registry & service logs
│   │   ├── api/
│   │   │   ├── backup/          # Database backup & restore endpoints
│   │   │   ├── export/csv/      # CSV/Excel data dump generator
│   │   │   ├── invoices/        # PDF generation API
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
│       ├── pdf/                 # Multi-template vector PDF compilation
│       ├── qr/                  # NPCI UPI QR string & image generator
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
| <kbd>g</kbd> $\rightarrow$ <kbd>r</kbd> | Navigation | Go to Reports & Analytics |
| <kbd>g</kbd> $\rightarrow$ <kbd>p</kbd> | Navigation | Go to Settings & Profile |

---

## 📦 Getting Started

### 📋 Prerequisites
* **Node.js:** v18.17+ or v20+ recommended
* **Package Manager:** npm, yarn, or pnpm
* **PostgreSQL Database:** [Neon Serverless](https://neon.tech/) or any PostgreSQL 14+ instance

### 🛠️ Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Virendra-Phirke/GARAJE_BILL_MANAGEMENT-.git
   cd GARAJE_BILL_MANAGEMENT-
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Database connection (PostgreSQL / Neon)
   DATABASE_URL="postgresql://username:password@ep-sample-host.region.neon.tech/neondb?sslmode=require"

   # Authentication Credentials
   ADMIN_USERNAME="admin"
   ADMIN_PASSWORD="YourSecurePasswordHere"

   # JWT Session Secret (Random 32+ character string)
   JWT_SECRET="super-secret-random-jwt-key-minimum-32-chars-long"

   # Application Base URL (for sharing links & webhooks)
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
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

---

## 🔒 Security & Data Integrity

* **Stateless JWT Sessions:** Implemented with `jose`, utilizing cryptographically signed, HTTP-only, `SameSite=Lax` cookies.
* **Constant-Time Verification:** Protects against timing attacks during authentication handshake.
* **Scoped Customer Sharing:** Invoices are shared via short-lived or verified tokens preventing unauthorized data leaks.
* **Atomic Transactions & Auditing:** Critical operations like invoice payments and stock deductions update the financial and inventory tables atomically.
* **Automated Data Backups:** Full database state serialization to downloadable JSON/SQL formats for disaster recovery.

---

## 📄 License

This project is licensed under the [MIT License](file:///c:/Users/viren/Pictures/GARAJ_BILL_MANAGEMENT--main/GARAJ_BILL_MANAGEMENT--main/LICENSE).

---

<div align="center">
  <sub>Built for precision, speed, and elegance in modern automotive and workshop management.</sub>
</div>

