# Reports Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Accounts page with an advanced Reports page featuring Recharts charts, 8 report sections, and CSV export on every section.

**Architecture:** Single file rewrite of `src/pages/admin/Accounts.jsx` + sidebar label/icon update in `AdminLayout.jsx`. All new data (payment breakdown, month-over-month, utilization) is derived client-side from `allOrders` already in GlobalContext. No backend changes.

**Tech Stack:** React, Recharts, Ant Design, GlobalContext

## Global Constraints

- Route stays `/admin/accounts` — only display name changes to "Reports"
- Export format: CSV only (client-side Blob, no library)
- Chart library: `recharts` (install if missing)
- Colors: NAVY = `#1e1b4b`, BRAND = `#E5550F`
- No new API endpoints

---

### Task 1: Install recharts + rename sidebar item

**Files:**
- Modify: `src/components/AdminLayout.jsx`

- [ ] **Step 1: Install recharts**

```bash
cd "/Users/arundurai/Public/Prasanna Works/lens/forntend"
npm install recharts
```

Expected: `added N packages` — no errors.

- [ ] **Step 2: Update AdminLayout.jsx — import new icon**

In `src/components/AdminLayout.jsx`, replace:
```js
import {
  BarChartOutlined, AppstoreOutlined, ShoppingCartOutlined, TeamOutlined,
  PlusOutlined, SettingOutlined, LogoutOutlined,
  LeftOutlined, RightOutlined, AccountBookOutlined, FileTextOutlined,
  TagsOutlined, UnorderedListOutlined, BellOutlined, GiftOutlined, AuditOutlined,
} from '@ant-design/icons'
```
with:
```js
import {
  BarChartOutlined, AppstoreOutlined, ShoppingCartOutlined, TeamOutlined,
  PlusOutlined, SettingOutlined, LogoutOutlined,
  LeftOutlined, RightOutlined, LineChartOutlined, FileTextOutlined,
  TagsOutlined, UnorderedListOutlined, BellOutlined, GiftOutlined, AuditOutlined,
} from '@ant-design/icons'
```

- [ ] **Step 3: Update nav item label and icon**

Replace:
```js
{ key: '/admin/accounts',  icon: <AccountBookOutlined />,  label: <Link to="/admin/accounts">Accounts</Link> },
```
with:
```js
{ key: '/admin/accounts',  icon: <LineChartOutlined />,  label: <Link to="/admin/accounts">Reports</Link> },
```

- [ ] **Step 4: Verify build passes**

```bash
cd "/Users/arundurai/Public/Prasanna Works/lens/forntend"
npm run build 2>&1 | tail -8
```
Expected: `✓ built in` with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/AdminLayout.jsx
git commit -m "feat: rename Accounts → Reports in sidebar, swap icon"
```

---

### Task 2: Rewrite Accounts.jsx as full Reports page

**Files:**
- Modify: `src/pages/admin/Accounts.jsx`

- [ ] **Step 1: Replace the entire file content**

Write the following complete file to `src/pages/admin/Accounts.jsx`:

```jsx
import { useState, useMemo, useEffect } from 'react'
import { Card, Row, Col, Spin, Select, Button, Tooltip } from 'antd'
import { DownloadOutlined, BarChartOutlined, LineChartOutlined } from '@ant-design/icons'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { useGlobal } from '../../context/GlobalContext'
import PageHeader from '../../components/PageHeader'

const NAVY = '#1e1b4b'
const PIE_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#9ca3af']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const cardStyle = { borderRadius: 16, border: '1px solid #e5e7eb', boxShadow: 'none' }

// ── CSV export ────────────────────────────────────────────────────────
const exportCSV = (filename, headers, rows) => {
  const esc = v => (typeof v === 'string' && (v.includes(',') || v.includes('"')))
    ? `"${v.replace(/"/g, '""')}"` : v
  const content = [headers, ...rows].map(r => r.map(esc).join(',')).join('\n')
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ── KPI card ──────────────────────────────────────────────────────────
const KpiCard = ({ title, value, prefix, suffix, sub, accent }) => (
  <Card style={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: 'none', height: '100%', borderLeft: `3px solid ${accent || '#e5e7eb'}` }}>
    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>{title}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: NAVY, lineHeight: 1.2 }}>
      {prefix && <span style={{ fontSize: 16, color: '#9ca3af', marginRight: 1 }}>{prefix}</span>}
      {typeof value === 'number' ? value.toLocaleString() : (value ?? '—')}
      {suffix && <span style={{ fontSize: 13, color: '#9ca3af', marginLeft: 4, fontWeight: 400 }}>{suffix}</span>}
    </div>
    {sub && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{sub}</div>}
  </Card>
)

// ── Section card header with export button ────────────────────────────
const SectionHeader = ({ title, subtitle, extra }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div>
      <div style={{ fontWeight: 600, color: NAVY, fontSize: 14 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 400 }}>{subtitle}</div>}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{extra}</div>
  </div>
)

// ── Main ──────────────────────────────────────────────────────────────
const Accounts = () => {
  const { accountsSummary: s, revenueData, allOrders, fetchAccounts, fetchAdminData } = useGlobal()
  const [period,    setPeriod]    = useState('daily')
  const [chartType, setChartType] = useState('area')
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetchAdminData('/admin/accounts'),
      fetchAdminData('/admin/orders'),
    ]).finally(() => setLoading(false))
  }, [])

  const onPeriodChange = (p) => { setPeriod(p); fetchAccounts(p) }

  // Payment breakdown — group allOrders payments by mode
  const paymentBreakdown = useMemo(() => {
    const modes = {}
    allOrders.forEach(o => {
      ;(o.payments || []).forEach(p => {
        const mode = p.mode || 'Other'
        if (!modes[mode]) modes[mode] = { mode, amount: 0, count: 0 }
        modes[mode].amount += (p.amount || 0)
        modes[mode].count  += 1
      })
    })
    return Object.values(modes).sort((a, b) => b.amount - a.amount)
  }, [allOrders])

  const totalPayments = paymentBreakdown.reduce((t, p) => t + p.amount, 0)

  // Month-over-month — current calendar month vs previous
  const momData = useMemo(() => {
    const now  = new Date()
    const thisM = now.getMonth(), thisY = now.getFullYear()
    const prevM = thisM === 0 ? 11 : thisM - 1
    const prevY = thisM === 0 ? thisY - 1 : thisY
    const inMonth = (o, m, y) => { const d = new Date(o.createdAt); return d.getMonth() === m && d.getFullYear() === y }
    const cur  = allOrders.filter(o => inMonth(o, thisM, thisY))
    const prev = allOrders.filter(o => inMonth(o, prevM, prevY))
    return [
      { metric: 'Revenue',   current: cur.reduce((t,o)  => t+(o.totalPrice||0),0),  previous: prev.reduce((t,o)  => t+(o.totalPrice||0),0)  },
      { metric: 'Collected', current: cur.reduce((t,o)  => t+(o.totalPaid||0),0),   previous: prev.reduce((t,o)  => t+(o.totalPaid||0),0)   },
      { metric: 'Orders',    current: cur.length,                                     previous: prev.length                                     },
    ]
  }, [allOrders])

  // Equipment utilization — top 10 products from summary
  const utilizationData = useMemo(() => (
    (s?.topProducts || []).slice(0, 10).map(p => ({
      name:     p.name.length > 18 ? p.name.slice(0, 16) + '…' : p.name,
      fullName: p.name,
      rentals:  p.count,
      revenue:  p.revenue,
    }))
  ), [s?.topProducts])

  const maxRentals = Math.max(...utilizationData.map(d => d.rentals), 1)

  const fmtTick = v => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`
  const fmtAmt  = v => `₹${(v||0).toLocaleString()}`

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
      <Spin size="large" />
    </div>
  )
  if (!s) return null

  const now = new Date()
  const prevMLabel = MONTHS[now.getMonth() === 0 ? 11 : now.getMonth() - 1]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        eyebrow="Analytics"
        title="Reports"
        subtitle="Revenue, payments, utilization and performance insights"
      />

      {/* KPI row 1 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard title="Total Revenue"    value={s.totalRevenue}   prefix="₹" sub="All orders"          accent="#10b981" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard title="Total Collected"  value={s.totalCollected} prefix="₹"
            sub={`Advance ₹${(s.totalAdvance||0).toLocaleString()} · Final ₹${(s.totalFinal||0).toLocaleString()}`}
            accent="#3b82f6" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard title="Pending Payments" value={s.totalPending}   prefix="₹" sub="Active orders"       accent="#f59e0b" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard title="Outstanding Dues" value={s.outstanding}    prefix="₹" sub="Returned but unpaid" accent="#ef4444" />
        </Col>
      </Row>

      {/* KPI row 2 */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}><KpiCard title="Active Orders"   value={s.activeOrders}    accent={NAVY}    /></Col>
        <Col xs={12} sm={6}><KpiCard title="In Shop"         value={s.productsInShop}  suffix="units" accent="#6366f1" /></Col>
        <Col xs={12} sm={6}><KpiCard title="Rented Out"      value={s.productsRented}  suffix="units" accent="#8b5cf6" /></Col>
        <Col xs={12} sm={6}><KpiCard title="Inventory Value" value={s.inventoryValue}  prefix="₹"    accent="#0ea5e9" /></Col>
      </Row>

      {/* Revenue Collection */}
      <Card style={cardStyle} title={
        <SectionHeader
          title="Revenue Collection"
          subtitle="Payments recorded per period"
          extra={[
            <div key="toggle" style={{ display: 'flex', background: '#f3f4f6', borderRadius: 8, padding: 3, gap: 2 }}>
              {[
                { type: 'area', icon: <LineChartOutlined />, tip: 'Area chart' },
                { type: 'bar',  icon: <BarChartOutlined />,  tip: 'Bar chart'  },
              ].map(({ type, icon, tip }) => (
                <Tooltip key={type} title={tip}>
                  <button
                    onClick={() => setChartType(type)}
                    style={{
                      width: 30, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer',
                      background: chartType === type ? '#fff' : 'transparent',
                      color: chartType === type ? NAVY : '#9ca3af',
                      boxShadow: chartType === type ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                    }}
                  >{icon}</button>
                </Tooltip>
              ))}
            </div>,
            <Select
              key="period" value={period} onChange={onPeriodChange}
              size="small" style={{ width: 110 }}
              options={[
                { value: 'daily',   label: 'Daily'   },
                { value: 'weekly',  label: 'Weekly'  },
                { value: 'monthly', label: 'Monthly' },
              ]}
            />,
            <Button
              key="exp" size="small" icon={<DownloadOutlined />}
              onClick={() => exportCSV('revenue.csv', ['Date','Revenue (₹)'],
                (revenueData||[]).map(d => [d.label, d.amount]))}
            >CSV</Button>,
          ]}
        />
      }>
        <ResponsiveContainer width="100%" height={220}>
          {chartType === 'area' ? (
            <AreaChart data={revenueData||[]} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={NAVY} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={NAVY} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtTick} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={52} />
              <RTooltip formatter={v => [fmtAmt(v), 'Revenue']} contentStyle={{ borderRadius: 8, border: '1px solid #f0f0f0', fontSize: 12 }} />
              <Area type="monotone" dataKey="amount" stroke={NAVY} strokeWidth={2} fill="url(#revGrad)" dot={{ r: 3, fill: NAVY }} activeDot={{ r: 5 }} />
            </AreaChart>
          ) : (
            <BarChart data={revenueData||[]} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtTick} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={52} />
              <RTooltip formatter={v => [fmtAmt(v), 'Revenue']} contentStyle={{ borderRadius: 8, border: '1px solid #f0f0f0', fontSize: 12 }} />
              <Bar dataKey="amount" fill={NAVY} radius={[4,4,0,0]} maxBarSize={48} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </Card>

      {/* Payment Breakdown + Month-over-Month */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={9}>
          <Card style={{ ...cardStyle, height: '100%' }} title={
            <SectionHeader title="Payment Method Breakdown" subtitle="By collection mode"
              extra={[
                <Button key="exp" size="small" icon={<DownloadOutlined />}
                  onClick={() => exportCSV('payment-breakdown.csv',
                    ['Mode','Total (₹)','Transactions'],
                    paymentBreakdown.map(p => [p.mode, p.amount, p.count]))}
                >CSV</Button>,
              ]}
            />
          }>
            {paymentBreakdown.length === 0 ? (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d1d5db', fontSize: 13 }}>
                No payment records yet
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={paymentBreakdown} dataKey="amount" nameKey="mode"
                      cx="50%" cy="50%" innerRadius={55} outerRadius={82} paddingAngle={3}
                    >
                      {paymentBreakdown.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RTooltip
                      formatter={(v, n) => [fmtAmt(v), n]}
                      contentStyle={{ borderRadius: 8, border: '1px solid #f0f0f0', fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                  {paymentBreakdown.map((p, i) => (
                    <div key={p.mode} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{p.mode}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>
                          {totalPayments > 0 ? Math.round(p.amount / totalPayments * 100) : 0}%
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>₹{p.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={15}>
          <Card style={{ ...cardStyle, height: '100%' }} title={
            <SectionHeader
              title="Month-over-Month"
              subtitle={`${MONTHS[now.getMonth()]} vs ${prevMLabel}`}
              extra={[
                <Button key="exp" size="small" icon={<DownloadOutlined />}
                  onClick={() => exportCSV('month-over-month.csv',
                    ['Metric','This Month','Last Month'],
                    momData.map(d => [d.metric, d.current, d.previous]))}
                >CSV</Button>,
              ]}
            />
          }>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={momData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="metric" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={52}
                  tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
                <RTooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #f0f0f0', fontSize: 12 }}
                  formatter={(v, name) => [v >= 100 ? fmtAmt(v) : v, name === 'current' ? 'This Month' : 'Last Month']}
                />
                <Bar dataKey="current"  fill={NAVY}    radius={[4,4,0,0]} maxBarSize={48} />
                <Bar dataKey="previous" fill="#e5e7eb" radius={[4,4,0,0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
              {[
                { label: 'This Month', color: NAVY },
                { label: 'Last Month', color: '#e5e7eb', border: '1px solid #d1d5db' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color, border: l.border, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#6b7280' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Equipment Utilization */}
      <Card style={cardStyle} title={
        <SectionHeader title="Equipment Utilization" subtitle="Rental count per product (top 10)"
          extra={[
            <Button key="exp" size="small" icon={<DownloadOutlined />}
              onClick={() => exportCSV('utilization.csv',
                ['Product','Rentals','Revenue (₹)'],
                utilizationData.map(d => [d.fullName, d.rentals, d.revenue]))}
            >CSV</Button>,
          ]}
        />
      }>
        {utilizationData.length === 0 ? (
          <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d1d5db', fontSize: 13 }}>
            No rental data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(180, utilizationData.length * 36)}>
            <BarChart data={utilizationData} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} />
              <RTooltip
                formatter={(v, _n, props) => [`${v} rentals · ₹${(props.payload.revenue||0).toLocaleString()}`, props.payload.fullName]}
                contentStyle={{ borderRadius: 8, border: '1px solid #f0f0f0', fontSize: 12 }}
              />
              <Bar dataKey="rentals" radius={[0,4,4,0]} maxBarSize={22}>
                {utilizationData.map((d, i) => (
                  <Cell key={i} fill={`rgba(30,27,75,${(0.35 + 0.65 * (d.rentals / maxRentals)).toFixed(2)})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Top Products + Top Customers */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card style={{ ...cardStyle, height: '100%' }} title={
            <SectionHeader title="Top Products" subtitle="By rental count and revenue"
              extra={[
                <Button key="exp" size="small" icon={<DownloadOutlined />}
                  onClick={() => exportCSV('top-products.csv',
                    ['Rank','Product','Rentals','Revenue (₹)'],
                    (s.topProducts||[]).map((p,i) => [i+1, p.name, p.count, p.revenue]))}
                >CSV</Button>,
              ]}
            />
          }>
            {(s.topProducts||[]).length === 0 ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: '#d1d5db', fontSize: 13 }}>No rental data yet</div>
            ) : (() => {
              const maxCount = Math.max(...(s.topProducts||[]).map(x => x.count), 1)
              return (
                <div style={{ marginTop: 12 }}>
                  {(s.topProducts||[]).slice(0,8).map((p, i) => (
                    <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < Math.min((s.topProducts||[]).length,8)-1 ? '1px solid #f9fafb' : 'none' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', width: 20, flexShrink: 0, textAlign: 'center' }}>{i+1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 5 }}>{p.name}</div>
                        <div style={{ height: 4, background: '#f0f0f0', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: `${(p.count/maxCount)*100}%`, background: NAVY, borderRadius: 2 }} />
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: '#9ca3af', width: 28, textAlign: 'center', flexShrink: 0 }}>{p.count}×</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: NAVY, width: 72, textAlign: 'right', flexShrink: 0 }}>₹{(p.revenue||0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )
            })()}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card style={{ ...cardStyle, height: '100%' }} title={
            <SectionHeader title="Top Customers" subtitle="By total spend"
              extra={[
                <Button key="exp" size="small" icon={<DownloadOutlined />}
                  onClick={() => exportCSV('top-customers.csv',
                    ['Customer','Email','Orders','Total Spent (₹)'],
                    (s.topCustomers||[]).map(c => [c.name, c.email, c.orders, c.spend]))}
                >CSV</Button>,
              ]}
            />
          }>
            {(s.topCustomers||[]).length === 0 ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: '#d1d5db', fontSize: 13 }}>No customer data yet</div>
            ) : (
              <div style={{ marginTop: 12 }}>
                {(s.topCustomers||[]).slice(0,8).map((c, i) => (
                  <div key={c.email} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < Math.min((s.topCustomers||[]).length,8)-1 ? '1px solid #f9fafb' : 'none' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: `hsl(${i*53},55%,55%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 12, fontWeight: 700,
                    }}>
                      {c.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</div>
                    </div>
                    <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>{c.orders} orders</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: NAVY, flexShrink: 0, minWidth: 72, textAlign: 'right' }}>₹{(c.spend||0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Upcoming Returns */}
      <Card style={cardStyle} title={
        <SectionHeader
          title="Upcoming Returns"
          subtitle={`${(s.upcomingReturns||[]).length} in next 7 days`}
          extra={[
            <Button key="exp" size="small" icon={<DownloadOutlined />}
              onClick={() => exportCSV('upcoming-returns.csv',
                ['Customer','Mobile','Return Date','Pending (₹)','Status'],
                (s.upcomingReturns||[]).map(r => [
                  r.userName, r.userMobile,
                  new Date(r.endDate).toLocaleDateString('en-GB'),
                  r.pendingAmount||0, r.status,
                ]))}
            >CSV</Button>,
          ]}
        />
      }>
        {(s.upcomingReturns||[]).length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: '#d1d5db', fontSize: 13 }}>
            No returns due in the next 7 days
          </div>
        ) : (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px 110px 130px', gap: '0 12px', padding: '6px 0', borderBottom: '1px solid #f0f0f0', marginBottom: 4 }}>
              {['Customer','Return Date','Pending','Status'].map(h => (
                <span key={h} style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
              ))}
            </div>
            {(s.upcomingReturns||[]).map((r, i) => {
              const d = new Date(r.endDate)
              const isToday = d.toDateString() === new Date().toDateString()
              return (
                <div key={r._id||i} style={{ display: 'grid', gridTemplateColumns: '1fr 150px 110px 130px', gap: '0 12px', padding: '10px 0', borderBottom: i < (s.upcomingReturns||[]).length-1 ? '1px solid #f9fafb' : 'none', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{r.userName}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{r.userMobile}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: isToday ? '#ef4444' : NAVY }}>
                      {isToday ? 'TODAY' : d.toLocaleDateString('en-GB')}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>
                      {d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: (r.pendingAmount||0) > 0 ? '#ef4444' : '#10b981' }}>
                    {(r.pendingAmount||0) > 0 ? `₹${r.pendingAmount.toLocaleString()}` : 'Paid'}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#6366f1', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 6, padding: '2px 8px', display: 'inline-block' }}>
                    {r.status}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

export default Accounts
```

- [ ] **Step 2: Verify build passes**

```bash
cd "/Users/arundurai/Public/Prasanna Works/lens/forntend"
npm run build 2>&1 | tail -10
```
Expected: `✓ built in` with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/Accounts.jsx
git commit -m "feat: rewrite Accounts as Reports — recharts, 8 sections, CSV export"
```
