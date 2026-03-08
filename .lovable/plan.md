

# Restaurant Cashier & Management App — Build Plan

## Platform Reality

Lovable builds React + Vite + TypeScript frontends. Custom backends (Bun/Hono/Turso) cannot run here. I will build the **complete frontend application** with local state and mock data, structured so a real backend can be wired in later. If you want a real database and auth, we can connect Lovable Cloud (Supabase-based) in a follow-up.

## What Gets Built

### Theme & Design System
- Soft calm palette: cream backgrounds (`#FDF8F0`), sage green accents (`#8BAA7C`), warm grays
- CSS variables for light/dark mode toggle
- Framer Motion for page transitions and micro-interactions
- Mobile/tablet responsive throughout

### Application Structure

```text
src/
├── components/
│   ├── layout/        — Sidebar, TopBar, MobileNav
│   ├── dashboard/     — StatCards, RevenueChart, TopItems
│   ├── orders/        — OrderForm, OrderList, OrderCard
│   ├── menu/          — MenuItemCard, CategoryTabs, MenuForm
│   ├── invoices/      — InvoiceList, InvoiceDetail, ReceiptPrint
│   ├── finance/       — IncomeChart, ExpenseForm, CashFlowTable
│   ├── customers/     — CustomerList, CustomerProfile
│   └── analytics/     — SalesChart, PopularityChart, ReportExport
├── contexts/          — AuthContext, ThemeContext
├── data/              — Mock data (menu, orders, customers, etc.)
├── hooks/             — useOrders, useMenu, useFinance, useAuth
├── pages/             — Login, Dashboard, Orders, Menu, Invoices,
│                        Finance, Customers, Analytics, Settings
├── types/             — All TypeScript interfaces
└── lib/               — Utilities, formatters, constants
```

### Pages & Features

1. **Login** — Role selection (Admin/Cashier), session stored in context
2. **Dashboard** — Revenue cards, orders today, best sellers, Recharts animated line/bar charts
3. **Orders** — Quick item selection grid, quantity controls, order status pipeline, table assignment
4. **Menu Management** — CRUD for items/categories, image upload placeholder, price editing
5. **Invoices** — Auto-generated from completed orders, tax/discount fields, print-friendly receipt view
6. **Finance** — Daily income/expense tracking, profit summary, cash flow chart
7. **Customers** — Profile cards, order history, loyalty points
8. **Analytics** — Sales trends, item popularity rankings, date range filters, CSV export
9. **Settings** — Dark/light toggle, restaurant info

### Key Technical Decisions
- **State**: React Context + hooks for auth, orders, menu, finance (no backend needed initially)
- **Charts**: Recharts (already installed)
- **Animations**: Install `framer-motion` for page transitions and card animations
- **Routing**: React Router (already installed) with role-based route guards
- **Print**: CSS `@media print` for receipt printing
- **Keyboard shortcuts**: Global key listeners for cashier speed (e.g., F2=New Order, Esc=Cancel)

### Build Order
Phase 1: Types, mock data, theme, layout shell with sidebar navigation
Phase 2: Dashboard with charts, Login page with auth context
Phase 3: Order management (the core cashier flow)
Phase 4: Menu management, Invoices, Finance, Customers, Analytics

This is a large application. I will build it incrementally across multiple messages, starting with the foundation (Phase 1 + 2).

