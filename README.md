# CoreInventory

A full-featured warehouse and inventory management system built with **Next.js 16**, **Supabase**, and **Tailwind CSS**. Inspired by Odoo's inventory module, CoreInventory provides end-to-end stock tracking with receipts, deliveries, adjustments, multi-warehouse support, and role-based access control.

**Live Demo:** [https://coreinventory-seven.vercel.app](https://coreinventory-seven.vercel.app)

## Features

- **Dashboard** -- Real-time KPIs (total products, low stock alerts, pending receipts/deliveries, total stock value), stock movement trend charts, and category distribution breakdown.
- **Receipts & Deliveries** -- Create, track, and validate inbound receipts from suppliers and outbound deliveries to customers through a multi-step workflow (Draft > Waiting > Ready > Done).
- **Products & Categories** -- Manage a product catalog with SKU, unit of measure, cost per unit, reorder levels, and category classification.
- **Stock Management** -- View current stock levels per product and location, with low-stock highlighting.
- **Inventory Adjustments** -- Record physical count corrections with reason tracking and automatic stock updates.
- **Move History** -- Full audit trail of every stock movement (receipts, deliveries, transfers, adjustments).
- **Multi-Warehouse & Locations** -- Configure multiple warehouses with storage locations and inventory policies (FIFO, LIFO, FEFO).
- **Role-Based Access Control** -- Three roles (Admin, Manager, Staff) with granular permissions controlling who can create, edit, validate, or delete records.
- **User Management** -- Admins can manage user accounts and assign roles.
- **Reports & CSV Export** -- Generate inventory reports and export data to CSV.
- **Email Alerts** -- Automated low-stock email notifications via Resend.
- **Command Palette** -- Quick search and navigation with `Ctrl+K`.
- **Dark Theme** -- Modern dark UI with a collapsible sidebar.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS 4, shadcn/ui |
| State | Zustand |
| Backend / Auth / DB | Supabase (PostgreSQL, Auth, Row-Level Security) |
| Charts | Recharts |
| Email | Resend |
| Icons | Lucide React |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/<your-username>/CoreInventory.git
   cd CoreInventory
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env.local` file inside the `CoreInventory` directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

   # Optional -- for low-stock email alerts
   RESEND_API_KEY=your-resend-api-key
   RESEND_FROM_EMAIL=CoreInventory <noreply@yourdomain.com>
   ```

4. **Set up the database**

   Run the SQL migrations in your Supabase project to create the required tables (`profiles`, `warehouses`, `locations`, `categories`, `products`, `stock`, `receipts`, `receipt_items`, `deliveries`, `delivery_items`, `adjustments`, `moves`, `ref_counters`).

5. **Seed demo data** (optional)

   After starting the dev server, hit the seed endpoint:
   ```
   GET /api/seed
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
CoreInventory/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Sign-in, sign-up, forgot-password pages
│   │   ├── (dashboard)/         # All authenticated pages
│   │   │   ├── dashboard/       # Main dashboard with KPIs & charts
│   │   │   ├── products/        # Product catalog management
│   │   │   ├── stock/           # Stock levels overview
│   │   │   ├── receipts/        # Inbound receipt management
│   │   │   ├── deliveries/      # Outbound delivery management
│   │   │   ├── adjustments/     # Inventory adjustments
│   │   │   ├── history/         # Move history / audit trail
│   │   │   ├── reports/         # Reports & CSV export
│   │   │   ├── warehouse/       # Warehouse configuration
│   │   │   ├── locations/       # Storage location management
│   │   │   ├── settings/        # App & profile settings
│   │   │   └── admin/users/     # User management (Admin only)
│   │   └── api/                 # REST API routes
│   ├── components/
│   │   ├── ui/                  # Reusable UI components (shadcn/ui)
│   │   ├── layout/              # Sidebar, top bar, command palette
│   │   ├── products/            # Product-specific modals
│   │   ├── locations/           # Location modal
│   │   ├── warehouses/          # Warehouse modal
│   │   ├── adjustments/         # Adjustment modal
│   │   └── dashboard/           # Dashboard chart components
│   └── lib/
│       ├── supabase/            # Supabase client (browser, server, middleware)
│       ├── types.ts             # TypeScript interfaces & constants
│       ├── rbac.ts              # Role-based permission logic
│       ├── store.ts             # Zustand global state
│       ├── csv-export.ts        # CSV export utility
│       ├── email.ts             # Resend email integration
│       └── utils.ts             # General utilities
├── package.json
├── next.config.ts
└── tsconfig.json
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |

## User Roles & Permissions

| Capability | Admin | Manager | Staff |
|-----------|:-----:|:-------:|:-----:|
| View dashboard, stock, products | Yes | Yes | Yes |
| Create receipts & deliveries | Yes | Yes | Yes |
| View reports | Yes | Yes | Yes |
| Create/edit/delete products | Yes | Yes | No |
| Validate receipts & deliveries | Yes | Yes | No |
| Inventory adjustments | Yes | Yes | No |
| Manage warehouses & locations | Yes | Yes | No |
| App settings | Yes | Yes | No |
| User management | Yes | No | No |

## License

This project is open-source. Feel free to use and modify it for your own purposes.
