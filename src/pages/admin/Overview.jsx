import { useState, useMemo, useCallback } from 'react'
import {
  Table, Tabs, Button, Input, Modal, Radio, DatePicker, TimePicker,
  Typography, Skeleton, Empty,
} from 'antd'
import {
  SearchOutlined, ReloadOutlined, InboxOutlined, ShoppingOutlined,
  WalletOutlined, ExportOutlined, ImportOutlined, WarningOutlined,
  ArrowUpOutlined, ArrowDownOutlined,
} from '@ant-design/icons'
import { useGlobal, getImageUrl } from '../../context/GlobalContext'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'

const { Text } = Typography
const { TextArea } = Input
const { RangePicker } = DatePicker

const INK    = '#101828'
const BODY   = '#475467'
const NAVY   = '#1e1b4b'
const ORANGE = '#E5550F'
const MUTED  = '#98a2b3'
const LINE   = '#eaecf0'

const STATUS_STYLE = {
  Closed:              { bg: '#ecfdf3', fg: '#067647', dot: '#12b76a' },
  Returned:            { bg: '#ecfdf3', fg: '#067647', dot: '#12b76a' },
  Approved:            { bg: '#ecfdf3', fg: '#067647', dot: '#12b76a' },
  'KYC Approved':      { bg: '#ecfdf3', fg: '#067647', dot: '#12b76a' },
  Rejected:            { bg: '#fef3f2', fg: '#b42318', dot: '#f04438' },
  'KYC Pending':       { bg: '#fffaeb', fg: '#b54708', dot: '#f79009' },
  'Return Pending':    { bg: '#fffaeb', fg: '#b54708', dot: '#f79009' },
  'Ready for Pickup':  { bg: '#eef4ff', fg: '#3538cd', dot: '#6172f3' },
  'During Rental':     { bg: '#eff8ff', fg: '#175cd3', dot: '#2e90fa' },
  'Picked Up':         { bg: '#eff8ff', fg: '#175cd3', dot: '#2e90fa' },
  Active:              { bg: '#eff8ff', fg: '#175cd3', dot: '#2e90fa' },
  'Request Submitted': { bg: '#f2f4f7', fg: '#344054', dot: '#98a2b3' },
}

const PRE_PICKUP  = ['Request Submitted', 'KYC Pending', 'KYC Approved', 'Approved', 'Ready for Pickup']
const RENTED_OUT  = ['Picked Up', 'During Rental', 'Return Pending', 'Active']
const READY       = ['Ready for Pickup', 'Approved']
const UPCOMING    = ['Request Submitted', 'KYC Pending', 'KYC Approved', 'Approved']
const DONE        = ['Returned', 'Closed']

const fmtDate = d => d ? dayjs(d).format('DD MMM') : '—'
const fmtDateTime = d => d ? dayjs(d).format('DD MMM, h:mm A') : '—'

const StatusPill = ({ status }) => {
  const st = STATUS_STYLE[status] || STATUS_STYLE['Request Submitted']
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
      background: st.bg, color: st.fg, borderRadius: 999, padding: '3px 10px 3px 8px',
      fontSize: 12, fontWeight: 500, lineHeight: '18px',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot }} />
      {status}
    </span>
  )
}

const Chip = ({ children, tone = 'indigo' }) => {
  const t = tone === 'indigo' ? ['#eef2ff', '#4f46e5'] : ['#ecfeff', '#0e7490']
  return <span style={{ fontSize: 11, fontWeight: 600, color: t[1], background: t[0], borderRadius: 6, padding: '1px 7px', letterSpacing: '0.02em' }}>{children}</span>
}

const card = {
  background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16,
  boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
}

const Delta = ({ value }) => {
  if (value == null) return null
  const up = value >= 0
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600,
      color: up ? '#067647' : '#b42318', background: up ? '#ecfdf3' : '#fef3f2',
      borderRadius: 999, padding: '2px 8px',
    }}>
      {up ? <ArrowUpOutlined style={{ fontSize: 10 }} /> : <ArrowDownOutlined style={{ fontSize: 10 }} />}
      {Math.abs(value).toFixed(0)}%
    </span>
  )
}

const KpiCard = ({ icon, label, value, suffix, tone = '#eef2ff', toneFg = '#4f46e5', loading, alert, delta, hint }) => (
  <div
    style={{ ...card, padding: 20, display: 'flex', flexDirection: 'column', gap: 16, borderColor: alert ? '#fecdca' : LINE, transition: 'box-shadow .15s, transform .15s' }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(16,24,40,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = card.boxShadow; e.currentTarget.style.transform = 'none' }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ width: 40, height: 40, borderRadius: 12, background: tone, color: toneFg, display: 'grid', placeItems: 'center', fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 14, fontWeight: 500, color: BODY, flex: 1 }}>{label}</span>
    </div>
    {loading ? (
      <Skeleton.Input active size="large" style={{ width: 130, height: 36, minWidth: 0 }} />
    ) : (
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 32, fontWeight: 700, color: alert ? '#b42318' : INK, letterSpacing: '-0.025em', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
          {suffix && <span style={{ fontSize: 13, color: MUTED, fontWeight: 500 }}>{suffix}</span>}
        </div>
        {(delta != null || hint) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <Delta value={delta} />
            {hint && <span style={{ fontSize: 12.5, color: MUTED }}>{hint}</span>}
          </div>
        )}
      </div>
    )}
  </div>
)

const ListSkeleton = () => (
  <div style={{ padding: '8px 20px' }}>
    {[0, 1, 2, 3, 4].map(i => (
      <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 0' }}>
        <Skeleton.Avatar active shape="square" size={40} />
        <Skeleton active title={{ width: '45%' }} paragraph={{ rows: 1, width: '30%' }} style={{ flex: 1 }} />
      </div>
    ))}
  </div>
)

const SchedulePanel = ({ title, subtitle, icon, count, range, onRange, loading, rows, emptyText, renderRow }) => (
  <div style={{ ...card, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <span style={{ width: 36, height: 36, borderRadius: 10, background: '#f4f3ff', color: '#5925dc', display: 'grid', placeItems: 'center', fontSize: 16 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 120 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: INK }}>{title}</span>
          {!loading && <span style={{ fontSize: 12, fontWeight: 600, color: BODY, background: '#f2f4f7', borderRadius: 999, padding: '1px 9px' }}>{count}</span>}
        </div>
        <div style={{ fontSize: 12.5, color: MUTED, marginTop: 1 }}>{subtitle}</div>
      </div>
      <RangePicker
        value={range[0] ? range : null}
        onChange={v => onRange(v || [null, null])}
        size="small" format="DD MMM" allowClear
        placeholder={['From', 'To']} style={{ width: 180 }}
      />
    </div>
    <div style={{ height: 372, overflowY: 'auto' }}>
      {loading ? <ListSkeleton /> : rows.length === 0 ? (
        <div style={{ height: '100%', display: 'grid', placeItems: 'center' }}>
          <Empty image={<InboxOutlined style={{ fontSize: 34, color: '#d0d5dd' }} />} description={<span style={{ color: MUTED, fontSize: 13 }}>{emptyText}</span>} />
        </div>
      ) : rows.map(renderRow)}
    </div>
  </div>
)

const ItemRow = ({ item, dateLabel, dateTone, action }) => {
  const sku      = item.displayItem?.productId?.sku || item.displayItem?.sku || '—'
  const unitCode = item.displayItem?.unitCode || '—'
  const toneColor = dateTone === 'danger' ? '#b42318' : dateTone === 'warn' ? '#b54708' : BODY
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', borderBottom: `1px solid #f2f4f7`, transition: 'background .12s' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#fafafb')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <img
        src={getImageUrl(item.displayItem?.imageUrl || item.displayItem?.productId?.imageUrl)}
        loading="lazy" alt=""
        style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', border: `1px solid ${LINE}`, background: '#f9fafb', flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.displayItem?.name || item.displayItem?.productId?.name || 'Unknown item'}
        </div>
        <div style={{ fontSize: 12.5, color: MUTED, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.userName}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: toneColor }}>{dateLabel}</span>
        <div style={{ display: 'flex', gap: 4 }}><Chip>{sku}</Chip><Chip tone="cyan">{unitCode}</Chip></div>
      </div>
      {action}
    </div>
  )
}

const AdminOverview = () => {
  const { user, adminStats, dashOrders: allOrders, refreshAdminDash, API_URL, adminDashLoading: loading } = useGlobal()
  const [dateRange,          setDateRange]          = useState([null, null])
  const [startDate,          endDate]               = dateRange
  const [searchTerm,         setSearchTerm]         = useState('')
  const [activeTab,          setActiveTab]          = useState('all')
  const [isReturnConfirming, setIsReturnConfirming] = useState(null)
  const [returnDateTime,     setReturnDateTime]     = useState(null)
  const [scheduleRangeOut,   setScheduleRangeOut]   = useState([null, null])
  const [scheduleRangeIn,    setScheduleRangeIn]    = useState([null, null])
  const [returnCondition,    setReturnCondition]    = useState('Good')
  const [returnNotes,        setReturnNotes]        = useState('')
  const [refreshing,         setRefreshing]         = useState(false)

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const flattenItems = useCallback((orders) =>
    orders.flatMap(order => {
      const items = order.items?.length ? order.items : [{ productId: order.productId, name: order.productId?.name, imageUrl: order.productId?.imageUrl || order.imageUrl, _id: 'legacy' }]
      return items.map((item, idx) => ({ ...order, displayItem: item, uniqueKey: `${order._id}-${item.productId?._id || item._id || idx}` }))
    }), [])

  const inRange = (date, [from, to]) => {
    if (!from || !to) return true
    const d = new Date(date)
    return d >= from.startOf('day').toDate() && d <= to.endOf('day').toDate()
  }

  // Going out = booked but not picked up yet (soonest first). Coming back = currently rented out (earliest due first).
  const flattenedOut = useMemo(() => flattenItems(
    allOrders.filter(o => PRE_PICKUP.includes(o.status) && inRange(o.startDate, scheduleRangeOut))
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
  ), [allOrders, scheduleRangeOut, flattenItems])

  const flattenedIn = useMemo(() => flattenItems(
    allOrders.filter(o => RENTED_OUT.includes(o.status) && inRange(o.endDate, scheduleRangeIn))
      .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
  ), [allOrders, scheduleRangeIn, flattenItems])

  const counts = useMemo(() => {
    const rentedOut = allOrders.filter(o => RENTED_OUT.includes(o.status))
    return {
      rentedOut: rentedOut.length,
      overdue:   rentedOut.filter(o => new Date(o.endDate) < new Date()).length,
    }
  }, [allOrders])

  const analytics = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => dayjs().subtract(5 - i, 'month').startOf('month'))
    const idx = Object.fromEntries(months.map((m, i) => [m.format('YYYY-MM'), i]))
    const series = months.map(m => ({ month: m.format('MMM'), revenue: 0, bookings: 0 }))
    allOrders.forEach(o => {
      const i = idx[dayjs(o.createdAt || o.startDate).format('YYYY-MM')]
      if (i == null) return
      series[i].revenue += o.totalPrice || 0
      series[i].bookings += 1
    })
    const cur = series[5], prev = series[4]
    const pct = (a, b) => (b ? ((a - b) / b) * 100 : null)
    const groups = [
      { name: 'Upcoming',   value: allOrders.filter(o => PRE_PICKUP.includes(o.status)).length,  color: '#6172f3' },
      { name: 'Rented out', value: allOrders.filter(o => RENTED_OUT.includes(o.status)).length,  color: '#2e90fa' },
      { name: 'Completed',  value: allOrders.filter(o => DONE.includes(o.status)).length,        color: '#12b76a' },
      { name: 'Other',      value: allOrders.filter(o => ![...PRE_PICKUP, ...RENTED_OUT, ...DONE].includes(o.status)).length, color: '#d0d5dd' },
    ].filter(g => g.value > 0)
    return {
      series, groups,
      revDelta: pct(cur.revenue, prev.revenue),
      bookDelta: pct(cur.bookings, prev.bookings),
      monthRevenue: cur.revenue, monthBookings: cur.bookings,
    }
  }, [allOrders])

  const filteredOrders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return allOrders.filter(order => {
      if (q) {
        const hit =
          order.userName?.toLowerCase().includes(q) ||
          order.userMobile?.toLowerCase().includes(q) ||
          order.userEmail?.toLowerCase().includes(q) ||
          order._id.toLowerCase().includes(q) ||
          order.items?.some(i => i.name?.toLowerCase().includes(q)) ||
          order.productId?.name?.toLowerCase().includes(q)
        if (!hit) return false
      }
      if (activeTab === 'rented'   && !RENTED_OUT.includes(order.status)) return false
      if (activeTab === 'ready'    && !READY.includes(order.status))      return false
      if (activeTab === 'returned' && !DONE.includes(order.status))       return false
      if (activeTab === 'upcoming' && !UPCOMING.includes(order.status))   return false
      if (activeTab === 'due' && (!RENTED_OUT.includes(order.status) || new Date(order.endDate) >= new Date())) return false
      if (startDate || endDate) {
        const d = new Date(order.startDate)
        if (startDate && d < startDate) return false
        if (endDate && d > endDate) return false
      }
      return true
    })
  }, [allOrders, searchTerm, activeTab, startDate, endDate])

  const updateBookingStatus = async (id, newStatus, condition = 'Good', notes = '', extra = {}) => {
    try {
      const res = await fetch(`${API_URL}/admin/bookings/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, returnCondition: condition, returnNotes: notes, ...extra }),
      })
      if (res.ok) { toast.success(`Marked as ${newStatus}`); refreshAdminDash() }
      else toast.error('Update failed')
    } catch { toast.error('Update failed') }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshAdminDash()
    setRefreshing(false)
  }

  const columns = [
    {
      title: 'Equipment',
      key: 'equipment',
      render: (_, order) => {
        const items   = order.items?.length ? order.items : [order.productId]
        const isMulti = items.length > 1
        const first   = items[0]
        const sku     = first?.productId?.sku || first?.sku || '—'
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={getImageUrl(first?.productId?.imageUrl || first?.imageUrl)} loading="lazy" alt=""
              style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', border: `1px solid ${LINE}`, background: '#f9fafb', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: INK }}>{isMulti ? `${items.length} items` : first?.name || '—'}</div>
              <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                <Chip>{isMulti ? 'Multiple' : sku}</Chip>
                {!isMulti && <Chip tone="cyan">{first?.unitCode || '—'}</Chip>}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      title: 'Client', key: 'client',
      render: (_, o) => (
        <div>
          <div style={{ fontWeight: 600, color: INK, fontSize: 14 }}>{o.userName}</div>
          <div style={{ color: MUTED, fontSize: 12.5 }}>{o.userMobile || '—'}</div>
        </div>
      ),
    },
    {
      title: 'Rental Period', key: 'period',
      render: (_, o) => (
        <div style={{ fontSize: 13.5, color: BODY, fontVariantNumeric: 'tabular-nums' }}>
          {fmtDate(o.startDate)} <span style={{ color: MUTED }}>→</span> {fmtDate(o.endDate)}
        </div>
      ),
    },
    {
      title: 'Return Date', dataIndex: 'endDate', key: 'endDate',
      render: (date, o) => {
        const late = RENTED_OUT.includes(o.status) && new Date(date) < now
        return (
          <div style={{ fontSize: 13.5, fontWeight: late ? 600 : 400, color: late ? '#b42318' : BODY, fontVariantNumeric: 'tabular-nums' }}>
            {fmtDateTime(date)}
            {late && <div style={{ fontSize: 11.5, fontWeight: 500 }}>Overdue</div>}
          </div>
        )
      },
    },
    { title: 'Status', key: 'status', render: (_, o) => <StatusPill status={o.status} /> },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1400 }}>
      {/* Hero */}
      <div style={{
        position: 'relative', overflow: 'hidden', borderRadius: 20, padding: '28px 32px',
        background: `linear-gradient(120deg, ${NAVY} 0%, #2e2a7a 60%, #4338ca 100%)`,
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap',
      }}>
        <div style={{ position: 'absolute', right: -60, top: -80, width: 260, height: 260, borderRadius: '50%', background: `radial-gradient(circle, ${ORANGE}55, transparent 70%)` }} />
        <div style={{ position: 'absolute', right: 140, bottom: -110, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.12), transparent 70%)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 13, fontWeight: 500, opacity: 0.7, letterSpacing: '0.02em' }}>{dayjs().format('dddd, D MMMM YYYY')}</div>
          <h1 style={{ margin: '6px 0 4px', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', lineHeight: 1.2 }}>
            {greeting}{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}
          </h1>
          <div style={{ fontSize: 14, opacity: 0.8 }}>
            {loading ? 'Loading your latest numbers…' : (
              <>
                <b>{counts.rentedOut}</b> rented out · <b>{flattenedOut.length}</b> pickups upcoming
                {counts.overdue > 0 && <> · <b style={{ color: '#fdba74' }}>{counts.overdue} overdue</b></>}
              </>
            )}
          </div>
        </div>
        <Button
          icon={<ReloadOutlined spin={refreshing} />} onClick={handleRefresh} disabled={loading}
          style={{ position: 'relative', background: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.25)', color: '#fff', height: 38, borderRadius: 10 }}
        >
          Refresh
        </Button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
        <KpiCard loading={loading} icon={<WalletOutlined />} label="Total Revenue" value={`₹${(adminStats.totalRevenue ?? 0).toLocaleString('en-IN')}`} tone="#ecfdf3" toneFg="#067647" delta={analytics.revDelta} hint="vs last month" />
        <KpiCard loading={loading} icon={<InboxOutlined />} label="Total Bookings" value={(adminStats.bookingCount ?? 0).toLocaleString('en-IN')} tone="#eff8ff" toneFg="#175cd3" delta={analytics.bookDelta} hint={`${analytics.monthBookings} this month`} />
        <KpiCard loading={loading} icon={<ShoppingOutlined />} label="Total Inventory" value={(adminStats.productCount ?? 0).toLocaleString('en-IN')} suffix="units" hint={`${counts.rentedOut} currently out`} />
        <KpiCard loading={loading} icon={<WarningOutlined />} label="Overdue Returns" value={counts.overdue} suffix="orders" tone="#fef3f2" toneFg="#d92d20" alert={counts.overdue > 0} hint={counts.overdue ? 'Needs follow-up' : 'All on time'} />
      </div>

      {/* Charts */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ ...card, padding: 22, flex: '2 1 480px', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: INK }}>Revenue</div>
              <div style={{ fontSize: 13, color: MUTED }}>Last 6 months</div>
            </div>
            {!loading && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: INK, letterSpacing: '-0.02em' }}>₹{analytics.monthRevenue.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: 12.5, color: MUTED }}>this month</div>
              </div>
            )}
          </div>
          {loading ? <Skeleton active paragraph={{ rows: 6 }} title={false} /> : (
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.series} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#f2f4f7" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: MUTED, fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: MUTED, fontSize: 12 }}
                    tickFormatter={v => (v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
                  <RTooltip
                    cursor={{ stroke: '#c7d2fe', strokeWidth: 1 }}
                    contentStyle={{ borderRadius: 10, border: `1px solid ${LINE}`, boxShadow: '0 8px 24px rgba(16,24,40,0.12)', fontSize: 13 }}
                    formatter={(v, n) => (n === 'revenue' ? [`₹${v.toLocaleString('en-IN')}`, 'Revenue'] : [v, 'Bookings'])}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2.5} fill="url(#revFill)" activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div style={{ ...card, padding: 22, flex: '1 1 300px', minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: INK }}>Booking status</div>
          <div style={{ fontSize: 13, color: MUTED, marginBottom: 8 }}>Where every order stands</div>
          {loading ? <Skeleton active paragraph={{ rows: 6 }} title={false} /> : (
            <>
              <div style={{ height: 170, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics.groups} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={3} stroke="none">
                      {analytics.groups.map(g => <Cell key={g.name} fill={g.color} />)}
                    </Pie>
                    <RTooltip contentStyle={{ borderRadius: 10, border: `1px solid ${LINE}`, fontSize: 13 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: INK, lineHeight: 1 }}>{allOrders.length}</div>
                    <div style={{ fontSize: 11.5, color: MUTED, marginTop: 3 }}>orders</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                {analytics.groups.map(g => (
                  <div key={g.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: g.color }} />
                    <span style={{ color: BODY, flex: 1 }}>{g.name}</span>
                    <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{g.value}</b>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Schedule */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 16 }}>
        <SchedulePanel
          title="Going Out" subtitle="Upcoming pickups, soonest first" icon={<ExportOutlined />}
          count={flattenedOut.length} range={scheduleRangeOut} onRange={setScheduleRangeOut}
          loading={loading} rows={flattenedOut} emptyText="No pickups scheduled"
          renderRow={item => (
            <ItemRow key={item.uniqueKey} item={item}
              dateLabel={`Pickup ${fmtDate(item.startDate)}`}
              dateTone={dayjs(item.startDate).isSame(dayjs(), 'day') ? 'warn' : undefined} />
          )}
        />
        <SchedulePanel
          title="Coming Back" subtitle="Rented out, earliest due first" icon={<ImportOutlined />}
          count={flattenedIn.length} range={scheduleRangeIn} onRange={setScheduleRangeIn}
          loading={loading} rows={flattenedIn} emptyText="No returns due"
          renderRow={item => {
            const late = new Date(item.endDate) < now
            return (
              <ItemRow key={item.uniqueKey} item={item}
                dateLabel={late ? `Overdue · ${fmtDate(item.endDate)}` : `Due ${fmtDate(item.endDate)}`}
                dateTone={late ? 'danger' : dayjs(item.endDate).isSame(dayjs(), 'day') ? 'warn' : undefined}
                action={<Button size="small" type="primary" onClick={() => setIsReturnConfirming(item._id)}>Return</Button>} />
            )
          }}
        />
      </div>

      {/* Pipeline */}
      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px 0', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 600, color: INK, fontSize: 16 }}>Rental Pipeline</div>
            <div style={{ fontSize: 13, color: MUTED, marginTop: 1 }}>Track, search and manage every booking</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Input prefix={<SearchOutlined style={{ color: MUTED }} />} placeholder="Search orders…" value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)} allowClear style={{ width: 230 }} />
            <RangePicker
              value={[startDate ? dayjs(startDate) : null, endDate ? dayjs(endDate) : null]}
              onChange={dates => setDateRange(dates ? [dates[0]?.toDate() || null, dates[1]?.toDate() || null] : [null, null])}
              format="DD/MM/YYYY" style={{ width: 250 }} />
          </div>
        </div>
        <div style={{ padding: '4px 20px 0' }}>
          <Tabs activeKey={activeTab} onChange={setActiveTab}
            items={[
              { key: 'all', label: 'All Rentals' },
              { key: 'upcoming', label: 'Upcoming' },
              { key: 'ready', label: 'Ready for Pickup' },
              { key: 'rented', label: 'Rented Out' },
              { key: 'returned', label: 'Returned' },
              { key: 'due', label: counts.overdue ? `Overdue (${counts.overdue})` : 'Overdue' },
            ]} />
        </div>
        <Table
          columns={columns} dataSource={filteredOrders} rowKey="_id" loading={loading}
          scroll={{ x: 760 }}
          pagination={{ defaultPageSize: 10, showSizeChanger: true, showTotal: (t, r) => `Showing ${r[0]}–${r[1]} of ${t}`, style: { padding: '0 20px' } }}
        />
      </div>

      {/* Return Confirmation Modal */}
      <Modal
        open={!!isReturnConfirming}
        onCancel={() => { setIsReturnConfirming(null); setReturnCondition('Good'); setReturnNotes(''); setReturnDateTime(null) }}
        title="Confirm Equipment Return"
        okText="Confirm Return"
        okButtonProps={{ style: returnCondition === 'Bad' ? { background: '#ef4444', borderColor: '#ef4444' } : {} }}
        onOk={() => {
          const extra = returnDateTime ? { returnedAt: returnDateTime.toISOString() } : {}
          updateBookingStatus(isReturnConfirming, 'Returned', returnCondition, returnNotes, extra)
          setIsReturnConfirming(null); setReturnCondition('Good'); setReturnNotes(''); setReturnDateTime(null)
        }}
        centered destroyOnHidden
      >
        <div style={{ paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Exact return date & time */}
          <div>
            <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>Exact Return Date &amp; Time</Text>
            <div style={{ display: 'flex', gap: 8 }}>
              <DatePicker
                style={{ flex: 1 }}
                value={returnDateTime}
                onChange={d => setReturnDateTime(d ? (returnDateTime ? d.hour(returnDateTime.hour()).minute(returnDateTime.minute()) : d) : null)}
                format="DD/MM/YYYY"
                placeholder="Return date"
                allowClear
              />
              <TimePicker
                style={{ flex: 1 }}
                value={returnDateTime}
                onChange={t => {
                  if (!t) return
                  const base = returnDateTime || dayjs()
                  setReturnDateTime(base.hour(t.hour()).minute(t.minute()).second(0))
                }}
                format="hh:mm A"
                use12Hours
                placeholder="Return time"
                allowClear={false}
                minuteStep={15}
              />
            </div>
          </div>

          <div>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>Physical Condition</Text>
            <Radio.Group value={returnCondition} onChange={e => setReturnCondition(e.target.value)} buttonStyle="solid">
              <Radio.Button value="Good">Good Condition</Radio.Button>
              <Radio.Button value="Bad">Found Issues</Radio.Button>
            </Radio.Group>
          </div>
          {returnCondition === 'Bad' && (
            <div>
              <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>Issue Details</Text>
              <TextArea rows={3} value={returnNotes} onChange={e => setReturnNotes(e.target.value)} placeholder="Describe the damage or issue…" />
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default AdminOverview
