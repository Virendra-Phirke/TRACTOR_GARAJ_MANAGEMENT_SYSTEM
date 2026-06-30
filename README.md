# Garage Bill Management System (GBMS)

A modern, full-stack web application designed to streamline billing, inventory, and operations for mechanic garages. Built with Next.js, Tailwind CSS, and Drizzle ORM, GBMS offers a fast, responsive, and intuitive interface for garage owners to manage their daily business activities.

## 🚀 Features

- **Dashboard:** At-a-glance overview of key metrics, low stock alerts, and quick actions.
- **Invoice & Billing:** Create professional invoices for services and parts, generate PDFs, and manage billing history. Includes UPI QR code generation for quick payments.
- **Customer Management:** Maintain a database of customers, their contact details, and service history.
- **Vehicle Tracking:** Keep track of vehicles serviced, linked to customers and their specific maintenance records.
- **Inventory Management:** Track spare parts, monitor stock levels, and get low-stock alerts.
- **Expense Tracking:** Log and categorize daily garage expenses to keep track of profitability.
- **Reporting:** Visual charts and data exports to analyze business performance over time.
- **Owner Profile & Settings:** Configure garage details, UPI payment settings, and application preferences.

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router) & [React](https://react.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Database:** [Neon](https://neon.tech/) (Serverless Postgres)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Forms & Validation:** [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **Charts:** [Recharts](https://recharts.org/)
- **PDF Generation:** [pdf-lib](https://pdf-lib.js.org/)
- **Icons:** [Lucide React](https://lucide.dev/)

## 📦 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v18+) and npm installed on your machine.
You will also need a PostgreSQL database (like Neon or local Postgres) to store your data.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Virendra-Phirke/GARAJE_BILL_MANAGEMENT-.git
   cd GARAJE_BILL_MANAGEMENT-
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory and configure your database connection string:
   ```env
   DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
   # Add any other required environment variables (e.g., Auth secrets if applicable)
   ```

4. **Database Migration & Seeding:**
   Push the schema to your database and seed it with initial data:
   ```bash
   npm run db:push
   npm run db:seed
   ```
   *(Note: Ensure you have appropriate scripts set up in your `package.json` for drizzle-kit commands)*

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open the application:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Project Structure

```text
├── src/
│   ├── app/                # Next.js App Router (Pages & API routes)
│   │   ├── (dashboard)/    # Dashboard layout and authenticated pages
│   │   ├── api/            # API endpoints (Exports, PDF, Backups)
│   │   └── login/          # Authentication pages
│   ├── components/         # Reusable UI components (shadcn/ui, layout)
│   ├── db/                 # Drizzle ORM schema, index, and seed scripts
│   └── lib/                # Utility functions, Server Actions, and Auth logic
├── 00 services/            # Static JSON data (seeds for vehicles, brands, etc.)
└── public/                 # Static assets
```

## 🤝 Contributing

Contributions are welcome! If you find a bug or have a feature request, please open an issue or submit a pull request.

## 📝 License

This project is licensed under the MIT License.
