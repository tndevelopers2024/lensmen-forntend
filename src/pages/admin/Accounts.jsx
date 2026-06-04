import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Space, Typography, Select, Spin } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'
import { useGlobal } from '../../context/GlobalContext'
import PageHeader from '../../components/PageHeader'

const { Text } = Typography

const NAVY = '#1e1b4b'

// ── Stat card ─────────────────────────────────────────────────────────
const StatCard = ({ title, value, prefix, suffix, sub }) => (
  <Card style={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: 'none', height: '100%' }}>
    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>{title}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: NAVY, lineHeight: 1.2 }}>
      {prefix && <span style={{ fontSize: 16, color: '#9ca3af', marginRight: 1 }}>{prefix}</span>}
      {typeof value === 'number' ? value.toLocaleString() : (value ?? '—')}
      {suffix && <span style={{ fontSize: 13, color: '#9ca3af', marginLeft: 4, fontWeight: 400 }}>{suffix}</span>}
    </div>
    {sub && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{sub}</div>}
  </Card>
)

// ── Bar chart ─────────────────────────────────────────────────────────
const BarChart = ({ data }) => {
  if (!data?.length) return (
    <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d1d5db', fontSize: 13 }}>
      No payment data yet — record payments to see the chart.
    </div>
  )
  const max = Math.max(...data.map(d => d.amount), 1)
  return (
    <div style={{ paddingTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 160 }}>
        {data.map((d, i) => {
          const pct    = Math.max(4, (d.amount / max) * 100)
          const isLast = i === data.length - 1
          return (
            <div key={i} title={`${d.label}: ₹${d.amount.toLocaleString()}`}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'default' }}
            >
              {isLast && (
                <div style={{ fontSize: 10, fontWeight: 700, color: NAVY }}>{d.amount >= 1000 ? `₹${(d.amount / 1000).toFixed(1)}k` : `₹${d.amount}`}</div>
              )}
              <div
                style={{ width: '100%', height: `${pct}%`, background: isLast ? NAVY : '#e5e7eb', borderRadius: '3px 3px 0 0', minHeight: 4 }}
                onMouseEnter={e => { e.currentTarget.style.background = NAVY }}
                onMouseLeave={e => { e.currentTarget.style.background = isLast ? NAVY : '#e5e7eb' }}
              />
            </div>
          )
        })}
      </div>
      <div style={{ height: 1, background: '#f0f0f0', margin: '4px 0' }} />
      <div style={{ display: 'flex', gap: 4 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {d.label}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────
const Accounts = () => {
  const { accountsSummary: s, revenueData, fetchAccounts, fetchAdminData } = useGlobal()
  const [period,  setPeriod]  = useState('daily')
  const [loading, setLoading] = useState(!s)

  useEffect(() => {
    setLoading(true)
    fetchAdminData('/admin/accounts').finally(() => setLoading(false))
  }, [])

  const onPeriodChange = async (p) => { setPeriod(p); await fetchAccounts(p) }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
      <Spin size="large" />
    </div>
  )
  if (!s) return null

  const cardStyle = { borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: 'none' }

  const returnCols = [
    {
      title: 'Customer',
      key: 'customer',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: NAVY }}>{r.userName}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>{r.userMobile}</div>
        </div>
      ),
    },
    {
      title: 'Return Date',
      dataIndex: 'endDate',
      key: 'endDate',
      render: d => {
        const date    = new Date(d)
        const isToday = date.toDateString() === new Date().toDateString()
        return (
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: isToday ? '#ef4444' : NAVY }}>
              {isToday ? 'TODAY' : date.toLocaleDateString('en-GB')}
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>
              {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </div>
          </div>
        )
      },
    },
    {
      title: 'Pending',
      dataIndex: 'pendingAmount',
      key: 'pending',
      render: v => (
        <Text style={{ fontWeight: 600, fontSize: 13, color: v > 0 ? '#ef4444' : '#10b981' }}>
          {v > 0 ? `₹${v.toLocaleString()}` : <><CheckCircleOutlined style={{ marginRight: 4 }} />Paid</>}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: st => <Tag style={{ fontSize: 11 }}>{st}</Tag>,
    },
  ]

  const productCols = [
    {
      title: '#',
      key: 'rank',
      width: 36,
      render: (_, __, i) => (
        <span style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af' }}>{i + 1}</span>
      ),
    },
    {
      title: 'Product',
      dataIndex: 'name',
      key: 'name',
      render: n => <Text style={{ fontSize: 13, color: NAVY, fontWeight: 500 }}>{n}</Text>,
    },
    {
      title: 'Rentals',
      dataIndex: 'count',
      key: 'count',
      align: 'center',
      render: c => <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{c}×</span>,
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      align: 'right',
      render: v => <Text style={{ fontSize: 13, color: NAVY, fontWeight: 600 }}>₹{(v || 0).toLocaleString()}</Text>,
    },
  ]

  const customerCols = [
    {
      title: 'Customer',
      key: 'customer',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: NAVY }}>{r.name}</div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>{r.email}</div>
        </div>
      ),
    },
    {
      title: 'Orders',
      dataIndex: 'orders',
      key: 'orders',
      align: 'center',
      render: v => <Tag>{v}</Tag>,
    },
    {
      title: 'Total Spent',
      dataIndex: 'spend',
      key: 'spend',
      align: 'right',
      render: v => <Text style={{ fontSize: 13, color: NAVY, fontWeight: 600 }}>₹{(v || 0).toLocaleString()}</Text>,
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        eyebrow="Finance"
        title="Accounts"
        subtitle="Revenue, payments, upcoming returns and top performers"
      />

      {/* ── Primary KPIs ─────────────────────────────────────────────── */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Total Revenue"     value={s.totalRevenue}   prefix="₹" sub="All orders" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Total Collected"   value={s.totalCollected} prefix="₹"
            sub={`Advance ₹${(s.totalAdvance || 0).toLocaleString()} · Final ₹${(s.totalFinal || 0).toLocaleString()}`}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Pending Payments"  value={s.totalPending}   prefix="₹" sub="Active orders" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Outstanding Dues"  value={s.outstanding}    prefix="₹" sub="Returned but unpaid" />
        </Col>
      </Row>

      {/* ── Secondary stats ───────────────────────────────────────────── */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}><StatCard title="Active Orders"    value={s.activeOrders} /></Col>
        <Col xs={12} sm={6}><StatCard title="In Shop"          value={s.productsInShop} suffix="units" /></Col>
        <Col xs={12} sm={6}><StatCard title="Rented Out"       value={s.productsRented} suffix="units" /></Col>
        <Col xs={12} sm={6}><StatCard title="Inventory Value"  value={s.inventoryValue} prefix="₹" /></Col>
      </Row>

      {/* ── Revenue chart ─────────────────────────────────────────────── */}
      <Card
        style={cardStyle}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, color: NAVY, fontSize: 14 }}>Revenue Collection</div>
              <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 400 }}>Payments recorded per period</div>
            </div>
            <Select
              value={period}
              onChange={onPeriodChange}
              size="small"
              style={{ width: 110 }}
              options={[
                { value: 'daily',   label: 'Daily' },
                { value: 'weekly',  label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
              ]}
            />
          </div>
        }
      >
        <BarChart data={revenueData} />
      </Card>

      {/* ── Upcoming returns + Top products ───────────────────────────── */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            style={cardStyle}
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, color: NAVY, fontSize: 14 }}>Upcoming Returns</span>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>{s.upcomingReturns?.length || 0} in next 7 days</span>
              </div>
            }
          >
            {(s.upcomingReturns || []).length === 0 ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: '#d1d5db', fontSize: 13 }}>No returns due in the next 7 days</div>
            ) : (
              <Table columns={returnCols} dataSource={s.upcomingReturns} rowKey="_id" pagination={false} size="small" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            style={{ ...cardStyle, height: '100%' }}
            title={<span style={{ fontWeight: 600, color: NAVY, fontSize: 14 }}>Top Products</span>}
          >
            {(s.topProducts || []).length === 0 ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: '#d1d5db', fontSize: 13 }}>No rental data yet</div>
            ) : (
              <Table columns={productCols} dataSource={s.topProducts} rowKey="name" pagination={false} size="small" />
            )}
          </Card>
        </Col>
      </Row>

      {/* ── Top customers ─────────────────────────────────────────────── */}
      <Card
        style={cardStyle}
        title={<span style={{ fontWeight: 600, color: NAVY, fontSize: 14 }}>Top Customers</span>}
      >
        {(s.topCustomers || []).length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: '#d1d5db', fontSize: 13 }}>No customer data yet</div>
        ) : (
          <Table columns={customerCols} dataSource={s.topCustomers} rowKey="email" pagination={false} size="small" />
        )}
      </Card>
    </div>
  )
}

export default Accounts
