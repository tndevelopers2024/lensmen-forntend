import { useState, useMemo, useEffect } from 'react'
import { Card, Row, Col, Spin, Select, Button, Tooltip, DatePicker, Tag } from 'antd'
import { DownloadOutlined, BarChartOutlined, LineChartOutlined, FilterOutlined, CloseCircleOutlined } from '@ant-design/icons'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { useGlobal } from '../../context/GlobalContext'
import PageHeader from '../../components/PageHeader'

const { RangePicker } = DatePicker

const NAVY = '#1e1b4b'
const PIE_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#9ca3af']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const cardStyle = { borderRadius: 16, border: '1px solid #e5e7eb', boxShadow: 'none' }

const ACTIVE_STATUSES  = ['Picked Up', 'During Rental', 'Active', 'Return Pending', 'Ready for Pickup', 'Approved', 'KYC Approved', 'KYC Pending', 'Request Submitted']
const RENTED_STATUSES  = ['Picked Up', 'During Rental', 'Active', 'Return Pending']

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

// ── Section card header ───────────────────────────────────────────────
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
  const { accountsSummary: s, allOrders, fetchAccounts, fetchAdminData } = useGlobal()
  const [period,    setPeriod]    = useState('monthly')
  const [chartType, setChartType] = useState('area')
  const [loading,   setLoading]   = useState(true)
  const [dateRange, setDateRange] = useState([null, null])
  const [rangeStart, rangeEnd]    = dateRange

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetchAdminData('/admin/accounts'),
      fetchAdminData('/admin/orders'),
    ]).finally(() => setLoading(false))
  }, [])

  const isFiltered = !!(rangeStart && rangeEnd)

  // ── Filtered orders ───────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    if (!rangeStart || !rangeEnd) return allOrders
    const from = rangeStart.startOf('day').toDate()
    const to   = rangeEnd.endOf('day').toDate()
    return allOrders.filter(o => {
      const d = new Date(o.createdAt)
      return d >= from && d <= to
    })
  }, [allOrders, rangeStart, rangeEnd])

  // ── KPI stats ─────────────────────────────────────────────────────
  const kpi = useMemo(() => {
    const totalRevenue   = filteredOrders.reduce((t, o) => t + (o.totalPrice    || 0), 0)
    const totalCollected = filteredOrders.reduce((t, o) => t + (o.totalPaid     || 0), 0)
    const totalPending   = filteredOrders.reduce((t, o) => t + (o.pendingAmount || 0), 0)
    const outstanding    = filteredOrders
      .filter(o => ['Returned', 'Closed'].includes(o.status) && (o.pendingAmount || 0) > 0)
      .reduce((t, o) => t + (o.pendingAmount || 0), 0)
    const allPayments  = filteredOrders.flatMap(o => o.payments || [])
    const totalAdvance = allPayments.filter(p => p.type === 'advance').reduce((t, p) => t + (p.amount || 0), 0)
    const totalFinal   = allPayments.filter(p => p.type === 'final'  ).reduce((t, p) => t + (p.amount || 0), 0)
    const activeOrders = filteredOrders.filter(o => ACTIVE_STATUSES.includes(o.status)).length
    return { totalRevenue, totalCollected, totalPending, outstanding, totalAdvance, totalFinal, activeOrders }
  }, [filteredOrders])

  // ── Revenue chart from filteredOrders ─────────────────────────────
  const chartData = useMemo(() => {
    const groups = {}
    filteredOrders.forEach(o => {
      const d = new Date(o.createdAt)
      let key, sortKey
      if (period === 'daily') {
        key = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
        sortKey = d.getTime()
      } else if (period === 'weekly') {
        const ws = new Date(d); ws.setDate(d.getDate() - d.getDay())
        key = ws.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
        sortKey = ws.getTime()
      } else {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        sortKey = d.getFullYear() * 100 + d.getMonth()
      }
      if (!groups[key]) groups[key] = { label: period === 'monthly' ? MONTHS[d.getMonth()] + ' ' + String(d.getFullYear()).slice(2) : key, amount: 0, _sort: sortKey }
      groups[key].amount += (o.totalPaid || 0)
    })
    return Object.values(groups).sort((a, b) => a._sort - b._sort)
  }, [filteredOrders, period])

  // ── Payment breakdown ─────────────────────────────────────────────
  const paymentBreakdown = useMemo(() => {
    const modes = {}
    filteredOrders.forEach(o => {
      ;(o.payments || []).forEach(p => {
        const mode = p.mode || 'Other'
        if (!modes[mode]) modes[mode] = { mode, amount: 0, count: 0 }
        modes[mode].amount += (p.amount || 0)
        modes[mode].count  += 1
      })
    })
    return Object.values(modes).sort((a, b) => b.amount - a.amount)
  }, [filteredOrders])

  const totalPayments = paymentBreakdown.reduce((t, p) => t + p.amount, 0)

  // ── Month-over-month (or period comparison) ───────────────────────
  const momData = useMemo(() => {
    if (isFiltered) {
      // Compare filtered period vs equal-length preceding period
      const from = rangeStart.startOf('day').toDate()
      const to   = rangeEnd.endOf('day').toDate()
      const ms   = to - from
      const prevTo   = new Date(from.getTime() - 1)
      const prevFrom = new Date(prevTo.getTime() - ms)
      const cur  = allOrders.filter(o => { const d = new Date(o.createdAt); return d >= from && d <= to })
      const prev = allOrders.filter(o => { const d = new Date(o.createdAt); return d >= prevFrom && d <= prevTo })
      return [
        { metric: 'Revenue',   current: cur.reduce((t, o) => t + (o.totalPrice || 0), 0),  previous: prev.reduce((t, o) => t + (o.totalPrice || 0), 0)  },
        { metric: 'Collected', current: cur.reduce((t, o) => t + (o.totalPaid   || 0), 0), previous: prev.reduce((t, o) => t + (o.totalPaid   || 0), 0) },
        { metric: 'Orders',    current: cur.length,                                          previous: prev.length                                          },
      ]
    }
    const now   = new Date()
    const thisM = now.getMonth(), thisY = now.getFullYear()
    const prevM = thisM === 0 ? 11 : thisM - 1
    const prevY = thisM === 0 ? thisY - 1 : thisY
    const inMonth = (o, m, y) => { const d = new Date(o.createdAt); return d.getMonth() === m && d.getFullYear() === y }
    const cur  = allOrders.filter(o => inMonth(o, thisM, thisY))
    const prev = allOrders.filter(o => inMonth(o, prevM, prevY))
    return [
      { metric: 'Revenue',   current: cur.reduce((t, o) => t + (o.totalPrice || 0), 0),  previous: prev.reduce((t, o) => t + (o.totalPrice || 0), 0)  },
      { metric: 'Collected', current: cur.reduce((t, o) => t + (o.totalPaid   || 0), 0), previous: prev.reduce((t, o) => t + (o.totalPaid   || 0), 0) },
      { metric: 'Orders',    current: cur.length,                                          previous: prev.length                                          },
    ]
  }, [filteredOrders, allOrders, isFiltered, rangeStart, rangeEnd])

  // ── Top products from filteredOrders ──────────────────────────────
  const topProducts = useMemo(() => {
    const products = {}
    filteredOrders.forEach(o => {
      const items = o.items?.length ? o.items : (o.productId ? [{ name: o.productId?.name || o.productName, totalPrice: o.totalPrice }] : [])
      items.forEach(item => {
        const name = item?.name || item?.productId?.name
        if (!name) return
        if (!products[name]) products[name] = { name, count: 0, revenue: 0 }
        products[name].count++
        products[name].revenue += item?.totalPrice || 0
      })
    })
    return Object.values(products).sort((a, b) => b.count - a.count).slice(0, 10)
  }, [filteredOrders])

  // ── Top customers from filteredOrders ─────────────────────────────
  const topCustomers = useMemo(() => {
    const customers = {}
    filteredOrders.forEach(o => {
      const key = o.userEmail || o.userMobile || o.userName
      if (!key) return
      if (!customers[key]) customers[key] = { name: o.userName, email: o.userEmail, orders: 0, spend: 0 }
      customers[key].orders++
      customers[key].spend += o.totalPaid || 0
    })
    return Object.values(customers).sort((a, b) => b.spend - a.spend).slice(0, 8)
  }, [filteredOrders])

  // ── Upcoming returns ──────────────────────────────────────────────
  const upcomingReturns = useMemo(() => {
    if (isFiltered) {
      return filteredOrders
        .filter(o => RENTED_STATUSES.includes(o.status))
        .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
    }
    const now   = new Date()
    const next7 = new Date(now); next7.setDate(now.getDate() + 7)
    return allOrders
      .filter(o => {
        const d = new Date(o.endDate)
        return RENTED_STATUSES.includes(o.status) && d >= now && d <= next7
      })
      .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
  }, [filteredOrders, allOrders, isFiltered])

  const utilizationData = topProducts.slice(0, 10).map(p => ({
    name:     p.name.length > 18 ? p.name.slice(0, 16) + '…' : p.name,
    fullName: p.name,
    rentals:  p.count,
    revenue:  p.revenue,
  }))

  const maxRentals = Math.max(...utilizationData.map(d => d.rentals), 1)

  const fmtTick = v => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`
  const fmtAmt  = v => `₹${(v || 0).toLocaleString()}`

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
      <Spin size="large" />
    </div>
  )

  const now = new Date()
  const prevMLabel = MONTHS[now.getMonth() === 0 ? 11 : now.getMonth() - 1]
  const momSubtitle = isFiltered
    ? `${rangeStart.format('DD MMM')} – ${rangeEnd.format('DD MMM YYYY')} vs preceding period`
    : `${MONTHS[now.getMonth()]} vs ${prevMLabel}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        eyebrow="Analytics"
        title="Reports"
        subtitle="Revenue, payments, utilization and performance insights"
      />

      {/* ── Global date range filter ─────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 16px' }}>
        <FilterOutlined style={{ color: '#9ca3af', fontSize: 14 }} />
        <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500, marginRight: 4 }}>Filter all sections by date:</span>
        <RangePicker
          value={rangeStart ? dateRange : [null, null]}
          onChange={v => setDateRange(v || [null, null])}
          format="DD MMM YYYY"
          allowClear
          placeholder={['Start date', 'End date']}
          size="small"
          style={{ width: 260 }}
        />
        {isFiltered && (
          <>
            <Tag color="blue" style={{ fontSize: 11, margin: 0 }}>
              {filteredOrders.length} orders in range
            </Tag>
            <Button
              size="small" type="text" icon={<CloseCircleOutlined />}
              style={{ color: '#9ca3af', padding: '0 4px' }}
              onClick={() => setDateRange([null, null])}
            >
              Clear
            </Button>
          </>
        )}
      </div>

      {/* KPI row 1 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard title="Total Revenue"    value={kpi.totalRevenue}   prefix="&#8377;" sub={isFiltered ? 'Filtered period' : 'All orders'} accent="#10b981" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard title="Total Collected"  value={kpi.totalCollected} prefix="&#8377;"
            sub={`Advance ₹${kpi.totalAdvance.toLocaleString()} · Final ₹${kpi.totalFinal.toLocaleString()}`}
            accent="#3b82f6" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard title="Pending Payments" value={kpi.totalPending}   prefix="&#8377;" sub="Active orders"       accent="#f59e0b" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard title="Outstanding Dues" value={kpi.outstanding}    prefix="&#8377;" sub="Returned but unpaid" accent="#ef4444" />
        </Col>
      </Row>

      {/* KPI row 2 */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}><KpiCard title="Active Orders"   value={kpi.activeOrders}               accent={NAVY}      /></Col>
        <Col xs={12} sm={6}><KpiCard title="In Shop"         value={s?.productsInShop ?? '—'} suffix="units" accent="#6366f1" /></Col>
        <Col xs={12} sm={6}><KpiCard title="Rented Out"      value={s?.productsRented ?? '—'} suffix="units" accent="#8b5cf6" /></Col>
        <Col xs={12} sm={6}><KpiCard title="Inventory Value" value={s?.inventoryValue  ?? '—'} prefix="&#8377;"   accent="#0ea5e9" /></Col>
      </Row>

      {/* Revenue Collection */}
      <Card style={cardStyle} title={
        <SectionHeader
          title="Revenue Collection"
          subtitle={isFiltered ? `${rangeStart.format('DD MMM')} – ${rangeEnd.format('DD MMM YYYY')}` : 'Payments recorded per period'}
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
              key="period" value={period} onChange={setPeriod}
              size="small" style={{ width: 110 }}
              options={[
                { value: 'daily',   label: 'Daily'   },
                { value: 'weekly',  label: 'Weekly'  },
                { value: 'monthly', label: 'Monthly' },
              ]}
            />,
            <Button
              key="exp" size="small" icon={<DownloadOutlined />}
              onClick={() => exportCSV('revenue.csv', ['Date', 'Revenue (Rs)'],
                chartData.map(d => [d.label, d.amount]))}
            >CSV</Button>,
          ]}
        />
      }>
        {chartData.length === 0 ? (
          <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d1d5db', fontSize: 13 }}>
            No revenue data for selected range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            {chartType === 'area' ? (
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtTick} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={52} />
                <RTooltip formatter={v => [fmtAmt(v), 'Revenue']} contentStyle={{ borderRadius: 8, border: '1px solid #f0f0f0', fontSize: 12 }} />
                <Bar dataKey="amount" fill={NAVY} radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </Card>

      {/* Payment Breakdown + Month-over-Month */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={9}>
          <Card style={{ ...cardStyle, height: '100%' }} title={
            <SectionHeader title="Payment Method Breakdown" subtitle="By collection mode"
              extra={[
                <Button key="exp" size="small" icon={<DownloadOutlined />}
                  onClick={() => exportCSV('payment-breakdown.csv',
                    ['Mode', 'Total (Rs)', 'Transactions'],
                    paymentBreakdown.map(p => [p.mode, p.amount, p.count]))}
                >CSV</Button>,
              ]}
            />
          }>
            {paymentBreakdown.length === 0 ? (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d1d5db', fontSize: 13 }}>
                No payment records
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
                        <span style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>{fmtAmt(p.amount)}</span>
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
              title="Period Comparison"
              subtitle={momSubtitle}
              extra={[
                <Button key="exp" size="small" icon={<DownloadOutlined />}
                  onClick={() => exportCSV('comparison.csv',
                    ['Metric', 'Current', 'Previous'],
                    momData.map(d => [d.metric, d.current, d.previous]))}
                >CSV</Button>,
              ]}
            />
          }>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={momData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="metric" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={52}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                />
                <RTooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #f0f0f0', fontSize: 12 }}
                  formatter={(v, name) => [v >= 100 ? fmtAmt(v) : v, name === 'current' ? 'This Period' : 'Previous Period']}
                />
                <Bar dataKey="current"  fill={NAVY}    radius={[4, 4, 0, 0]} maxBarSize={48} />
                <Bar dataKey="previous" fill="#e5e7eb" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
              {[
                { label: isFiltered ? 'Selected Period' : 'This Month', color: NAVY },
                { label: 'Previous Period', color: '#e5e7eb', border: '1px solid #d1d5db' },
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
                ['Product', 'Rentals', 'Revenue (Rs)'],
                utilizationData.map(d => [d.fullName, d.rentals, d.revenue]))}
            >CSV</Button>,
          ]}
        />
      }>
        {utilizationData.length === 0 ? (
          <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d1d5db', fontSize: 13 }}>
            No rental data for selected range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(180, utilizationData.length * 36)}>
            <BarChart data={utilizationData} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} />
              <RTooltip
                formatter={(v, _n, props) => [`${v} rentals · ${fmtAmt(props.payload.revenue)}`, props.payload.fullName]}
                contentStyle={{ borderRadius: 8, border: '1px solid #f0f0f0', fontSize: 12 }}
              />
              <Bar dataKey="rentals" radius={[0, 4, 4, 0]} maxBarSize={22}>
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
                    ['Rank', 'Product', 'Rentals', 'Revenue (Rs)'],
                    topProducts.map((p, i) => [i + 1, p.name, p.count, p.revenue]))}
                >CSV</Button>,
              ]}
            />
          }>
            {topProducts.length === 0 ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: '#d1d5db', fontSize: 13 }}>No rental data</div>
            ) : (() => {
              const maxCount = Math.max(...topProducts.map(x => x.count), 1)
              return (
                <div style={{ marginTop: 12 }}>
                  {topProducts.slice(0, 8).map((p, i) => (
                    <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < Math.min(topProducts.length, 8) - 1 ? '1px solid #f9fafb' : 'none' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', width: 20, flexShrink: 0, textAlign: 'center' }}>{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 5 }}>{p.name}</div>
                        <div style={{ height: 4, background: '#f0f0f0', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: `${(p.count / maxCount) * 100}%`, background: NAVY, borderRadius: 2 }} />
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: '#9ca3af', width: 28, textAlign: 'center', flexShrink: 0 }}>{p.count}&times;</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: NAVY, width: 72, textAlign: 'right', flexShrink: 0 }}>{fmtAmt(p.revenue)}</span>
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
                    ['Customer', 'Email', 'Orders', 'Total Spent (Rs)'],
                    topCustomers.map(c => [c.name, c.email, c.orders, c.spend]))}
                >CSV</Button>,
              ]}
            />
          }>
            {topCustomers.length === 0 ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: '#d1d5db', fontSize: 13 }}>No customer data</div>
            ) : (
              <div style={{ marginTop: 12 }}>
                {topCustomers.map((c, i) => (
                  <div key={c.email || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < topCustomers.length - 1 ? '1px solid #f9fafb' : 'none' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: `hsl(${i * 53},55%,55%)`,
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
                    <span style={{ fontSize: 13, fontWeight: 700, color: NAVY, flexShrink: 0, minWidth: 72, textAlign: 'right' }}>{fmtAmt(c.spend)}</span>
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
          subtitle={isFiltered
            ? `${upcomingReturns.length} active rental${upcomingReturns.length !== 1 ? 's' : ''} in selected range`
            : `${upcomingReturns.length} in next 7 days`}
          extra={[
            <Button key="exp" size="small" icon={<DownloadOutlined />}
              onClick={() => exportCSV('upcoming-returns.csv',
                ['Customer', 'Mobile', 'Return Date', 'Pending (Rs)', 'Status'],
                upcomingReturns.map(r => [
                  r.userName, r.userMobile,
                  new Date(r.endDate).toLocaleDateString('en-GB'),
                  r.pendingAmount || 0, r.status,
                ]))}
            >CSV</Button>,
          ]}
        />
      }>
        {upcomingReturns.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: '#d1d5db', fontSize: 13 }}>
            {isFiltered ? 'No active rentals in selected range' : 'No returns due in the next 7 days'}
          </div>
        ) : (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px 110px 130px', gap: '0 12px', padding: '6px 0', borderBottom: '1px solid #f0f0f0', marginBottom: 4 }}>
              {['Customer', 'Return Date', 'Pending', 'Status'].map(h => (
                <span key={h} style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
              ))}
            </div>
            {upcomingReturns.map((r, i) => {
              const d = new Date(r.endDate)
              const isToday = d.toDateString() === new Date().toDateString()
              const isOverdue = d < new Date() && !isToday
              return (
                <div key={r._id || i} style={{ display: 'grid', gridTemplateColumns: '1fr 150px 110px 130px', gap: '0 12px', padding: '10px 0', borderBottom: i < upcomingReturns.length - 1 ? '1px solid #f9fafb' : 'none', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{r.userName}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{r.userMobile}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: isOverdue ? '#ef4444' : isToday ? '#f59e0b' : NAVY }}>
                      {isOverdue ? 'OVERDUE' : isToday ? 'TODAY' : d.toLocaleDateString('en-GB')}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>
                      {d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: (r.pendingAmount || 0) > 0 ? '#ef4444' : '#10b981' }}>
                    {(r.pendingAmount || 0) > 0 ? fmtAmt(r.pendingAmount) : 'Paid'}
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
