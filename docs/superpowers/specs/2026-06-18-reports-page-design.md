# Reports Page — Design Spec
**Date:** 2026-06-18  
**Project:** Lensmen Rentals Admin

---

## Goal

Replace the existing "Accounts" page with an advanced "Reports" page featuring real charts (Recharts), six distinct report sections, and CSV export for every data section. No backend changes required — all new sections are computed client-side from `allOrders` already in GlobalContext.

---

## Scope of Changes

| File | Change |
|------|--------|
| `src/components/AdminLayout.jsx` | Rename nav item "Accounts" → "Reports", swap icon to `LineChartOutlined` |
| `src/pages/admin/Accounts.jsx` | Full rewrite as `Reports.jsx` (keep same route `/admin/accounts` for now, rename display only) |
| `package.json` | Add `recharts` dependency |

---

## Dependency

Install `recharts` via npm. This is the only new dependency. It is the standard React charting library, well-maintained, tree-shakeable, ~170KB gzipped.

---

## Data Sources

| Section | Data origin |
|---------|-------------|
| KPI cards | `accountsSummary` from GlobalContext (`/admin/accounts` endpoint) |
| Revenue Collection chart | `revenueData` from GlobalContext (already period-aware) |
| Payment Method Breakdown | Computed client-side from `allOrders[].payments[].mode` + `amount` |
| Month-over-Month | Computed client-side from `allOrders[].createdAt` + `totalPrice` / `totalPaid` |
| Equipment Utilization | `accountsSummary.topProducts` (already has `count` + `revenue`) |
| Top Products table | `accountsSummary.topProducts` |
| Top Customers table | `accountsSummary.topCustomers` |
| Upcoming Returns table | `accountsSummary.upcomingReturns` |

---

## Page Layout

```
[Page Header: eyebrow="Analytics", title="Reports", subtitle="..."]

[KPI Row 1: Total Revenue | Total Collected | Pending Payments | Outstanding Dues]
[KPI Row 2: Active Orders | In Shop | Rented Out | Inventory Value]

[Revenue Collection card — full width]
  Header: title + period selector (Daily/Weekly/Monthly) + chart toggle (Area|Bar) + Export CSV
  Chart: Recharts AreaChart or BarChart depending on toggle

[Row: Payment Breakdown (5/12) | Month-over-Month (7/12)]
  Payment Breakdown: Recharts PieChart (donut), legend below, Export CSV
  Month-over-Month: Recharts BarChart grouped (this month vs last month), Export CSV

[Equipment Utilization card — full width]
  Header: title + Export CSV
  Chart: Recharts BarChart horizontal (or vertical), sorted by rental count desc

[Row: Top Products (10/24) | Top Customers (14/24)]
  Top Products table: rank, name, mini bar indicator, rentals, revenue — Export CSV
  Top Customers table: name, email, orders, total spent — Export CSV

[Upcoming Returns — full width table — Export CSV]
```

---

## Section Details

### 1 — KPI Cards
No changes to logic. Keep existing 8 cards. Slightly improved: add a subtle colored left-border accent per card to distinguish metric types (revenue = green, pending = orange, orders = navy, inventory = blue).

### 2 — Revenue Collection
- **Chart:** Recharts `AreaChart` (default) or `BarChart` (toggle). Gradient fill for area mode. Animated on mount.
- **Toggle:** Two icon-buttons (Area icon / Bar icon) top-right of card header.
- **Period selector:** Keep existing Daily/Weekly/Monthly Select dropdown.
- **Tooltip:** Show `₹X` on hover with date label.
- **Export CSV:** Button top-right, exports `{label, amount}` rows with header `Date,Revenue`.

### 3 — Payment Method Breakdown
- **Computed from:** `allOrders.flatMap(o => o.payments || [])`, group by `mode`, sum `amount`.
- **Chart:** Recharts `PieChart` with `Pie` (donut, inner radius 60, outer radius 100).
- **Colors:** Cash = `#10b981`, Bank Transfer = `#3b82f6`, Online = `#8b5cf6`, Other = `#9ca3af`.
- **Legend:** Horizontal below chart, shows mode label + percentage + total.
- **Export CSV:** `Mode,Total Amount,Transaction Count`.

### 4 — Month-over-Month Comparison
- **Computed from:** `allOrders`, group by `createdAt` month. Compare current calendar month vs previous.
- **Metrics shown:** Revenue (totalPrice), Collections (totalPaid), Orders (count).
- **Chart:** Recharts `BarChart` with two bars per metric: current month (navy) vs last month (light grey).
- **Tooltip:** Show both values.
- **Export CSV:** `Metric,This Month,Last Month`.

### 5 — Equipment Utilization
- **Data:** `accountsSummary.topProducts` sorted by `count` desc (already available).
- **Chart:** Recharts `BarChart` (vertical bars), X-axis = product names (truncated), Y-axis = rental count. Each bar shows revenue as tooltip.
- **Bar color:** Gradient from `#1e1b4b` (high) to `#93c5fd` (low) based on count rank.
- **Export CSV:** `Product,Rentals,Revenue`.

### 6 — Top Products Table
- Keep existing columns. Add a thin inline progress bar in the Rentals column showing relative proportion (max = highest count).
- **Export CSV:** `Rank,Product,Rentals,Revenue`.

### 7 — Top Customers Table
- Keep existing columns.
- **Export CSV:** `Customer,Email,Orders,Total Spent`.

### 8 — Upcoming Returns Table
- Keep existing columns.
- **Export CSV:** `Customer,Mobile,Return Date,Pending Amount,Status`.

---

## CSV Export Utility

A single shared helper function `exportCSV(filename, headers, rows)`:
```
function exportCSV(filename, headers, rows) {
  const content = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([content], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
```
Placed at the top of `Accounts.jsx` (no separate file needed for this scope).

---

## Sidebar Change

In `AdminLayout.jsx`:
- Import `LineChartOutlined` from `@ant-design/icons`
- Replace `AccountBookOutlined` with `LineChartOutlined` for the `/admin/accounts` nav item
- Change label text from `Accounts` to `Reports`

---

## Spec Self-Review

- **Placeholders:** None. All data sources confirmed against codebase.
- **Consistency:** Route stays `/admin/accounts` to avoid breaking App.jsx routing; display name is "Reports" everywhere visible.
- **Scope:** Single file rewrite + one nav label change + one npm install. Appropriately focused.
- **Ambiguity:** Month-over-Month uses calendar months (1st to today/last day), not rolling 30 days. Equipment Utilization uses `topProducts` from the summary endpoint (not re-computed) to avoid a separate API call.
