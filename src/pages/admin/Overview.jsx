import { useState, useEffect } from 'react'
import {
  Row, Col, Card, Statistic, Table, Tabs, Tag, Button, Space,
  Input, Modal, Radio, DatePicker, TimePicker, Typography,
} from 'antd'
import { SearchOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useGlobal, getImageUrl } from '../../context/GlobalContext'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import { isWithinInterval, differenceInDays, isSameDay } from 'date-fns'
import PageHeader from '../../components/PageHeader'

const { Text } = Typography
const { TextArea } = Input
const { RangePicker } = DatePicker

const NAVY = '#1e1b4b'

const STATUS_TAG = {
  Closed:              { color: 'success' },
  Rejected:            { color: 'error' },
  Returned:            { color: 'success' },
  'KYC Pending':       { color: 'warning' },
  'KYC Approved':      { color: 'cyan' },
  Approved:            { color: 'green' },
  'Ready for Pickup':  { color: 'blue' },
  'During Rental':     { color: 'processing' },
  'Picked Up':         { color: 'processing' },
  Active:              { color: 'processing' },
  'Request Submitted': { color: 'default' },
  'Return Pending':    { color: 'warning' },
}

const AdminOverview = () => {
  const { adminStats, allOrders, refreshAllOrders, API_URL } = useGlobal()
  useEffect(() => { if (allOrders.length === 0) refreshAllOrders() }, [])
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
  const [editingNotes,       setEditingNotes]       = useState({ id: null, notes: '', condition: '' })

  const activeRentalStatuses   = ['Picked Up', 'During Rental', 'Return Pending', 'Active', 'Request Submitted', 'KYC Pending', 'KYC Approved', 'Approved', 'Ready for Pickup']
  const rentedOutStatuses      = ['Picked Up', 'During Rental', 'Return Pending', 'Active']
  const readyForPickupStatuses = ['Ready for Pickup', 'Approved']
  const returnedClosedStatuses = ['Returned', 'Closed']

  const [outFrom, outTo] = scheduleRangeOut
  const [inFrom,  inTo]  = scheduleRangeIn
  const scheduleOut = allOrders.filter(o => {
    if (!activeRentalStatuses.includes(o.status)) return false
    if (!outFrom || !outTo) return true
    const d = new Date(o.startDate)
    return d >= outFrom.startOf('day').toDate() && d <= outTo.endOf('day').toDate()
  })
  const scheduleIn = allOrders.filter(o => {
    if (!activeRentalStatuses.includes(o.status)) return false
    if (!inFrom || !inTo) return true
    const d = new Date(o.endDate)
    return d >= inFrom.startOf('day').toDate() && d <= inTo.endOf('day').toDate()
  })

  const flattenItems = (orders) =>
    orders.flatMap(order => {
      const items = order.items?.length ? order.items : [{ productId: order.productId, name: order.productId?.name, imageUrl: order.productId?.imageUrl || order.imageUrl, _id: 'legacy' }]
      return items.map((item, idx) => ({ ...order, displayItem: item, uniqueKey: `${order._id}-${item.productId?._id || item._id || idx}` }))
    })

  const flattenedOut = flattenItems(scheduleOut)
  const flattenedIn  = flattenItems(scheduleIn)

  const filteredOrders = allOrders.filter(order => {
    const searchMatch =
      order.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userMobile?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items?.some(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      order.productId?.name?.toLowerCase().includes(searchTerm.toLowerCase())

    if (!searchMatch) return false
    const isActive        = activeRentalStatuses.includes(order.status)
    const isReturned      = returnedClosedStatuses.includes(order.status)
    const isRentedOut     = rentedOutStatuses.includes(order.status)
    const isReadyPickup   = readyForPickupStatuses.includes(order.status)
    if (activeTab === 'rented'  && !isRentedOut)   return false
    if (activeTab === 'ready'   && !isReadyPickup)  return false
    if (activeTab === 'returned' && !isReturned)    return false
    if (activeTab === 'due') {
      if (!isRentedOut || new Date(order.endDate) >= new Date()) return false
    }
    const upcomingStatuses = ['Request Submitted', 'KYC Pending', 'KYC Approved', 'Approved']
    if (activeTab === 'upcoming' && !upcomingStatuses.includes(order.status)) return false
    if (!startDate && !endDate) return true
    const orderDate = new Date(order.startDate)
    if (startDate && !endDate)  return orderDate >= startDate
    if (startDate && endDate)   return isWithinInterval(orderDate, { start: startDate, end: endDate })
    return true
  })

  const updateBookingStatus = async (id, newStatus, condition = 'Good', notes = '') => {
    try {
      const res = await fetch(`${API_URL}/admin/bookings/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, returnCondition: condition, returnNotes: notes }),
      })
      if (res.ok) { toast.success(`Marked as ${newStatus}`); window.location.reload() }
    } catch { toast.error('Update failed') }
  }

  const renderStatusCell = (order) => {
    if (order.status === 'Returned') {
      return <Tag color="success" icon={<CheckCircleOutlined />}>Returned</Tag>
    }
    const tag = STATUS_TAG[order.status] || { color: 'default' }
    return <Tag color={tag.color}>{order.status}</Tag>
  }

  // ── Schedule item row ─────────────────────────────────────────────
  const ScheduleRow = ({ item }) => {
    const sku      = item.displayItem?.productId?.sku || item.displayItem?.sku || '—'
    const unitCode = item.displayItem?.unitCode || '—'
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid #f9fafb' }}>
        <img
          src={getImageUrl(item.displayItem?.imageUrl || item.displayItem?.productId?.imageUrl)}
          style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', border: '1px solid #f0f0f0', flexShrink: 0, background: '#f9fafb' }}
          alt=""
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.displayItem?.name || 'Unknown item'}
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{item.userName}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#6366f1', background: '#eef2ff', borderRadius: 4, padding: '1px 6px', letterSpacing: '0.03em' }}>{sku}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#0891b2', background: '#ecfeff', borderRadius: 4, padding: '1px 6px', letterSpacing: '0.03em' }}>{unitCode}</span>
        </div>
      </div>
    )
  }

  const columns = [
    {
      title: 'Equipment',
      key: 'equipment',
      render: (_, order) => {
        const items    = order.items?.length ? order.items : [order.productId]
        const isMulti  = items.length > 1
        const sku      = isMulti ? `${items.length} items` : (items[0]?.productId?.sku || items[0]?.sku || '—')
        const unitCode = isMulti ? '' : (items[0]?.unitCode || '—')
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src={getImageUrl(items[0]?.productId?.imageUrl || items[0]?.imageUrl)}
              style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', border: '1px solid #f0f0f0', flexShrink: 0, background: '#f9fafb' }}
              alt=""
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: NAVY }}>
                {isMulti ? `${items.length} items` : items[0]?.name || '—'}
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#6366f1', background: '#eef2ff', borderRadius: 4, padding: '1px 6px' }}>{sku}</span>
                {!isMulti && <span style={{ fontSize: 10, fontWeight: 600, color: '#0891b2', background: '#ecfeff', borderRadius: 4, padding: '1px 6px' }}>{unitCode}</span>}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      title: 'Client',
      key: 'client',
      render: (_, order) => (
        <div>
          <div style={{ fontWeight: 600, color: NAVY, fontSize: 13 }}>{order.userName}</div>
          <div style={{ color: '#6b7280', fontSize: 12 }}>{order.userMobile || '—'}</div>
        </div>
      ),
    },
    {
      title: 'Return Date',
      dataIndex: 'endDate',
      key: 'endDate',
      render: date => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{new Date(date).toLocaleDateString('en-GB')}</div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>
            {new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </div>
        </div>
      ),
    },
    {
      title: 'Status & Action',
      key: 'actions',
      render: (_, order) => renderStatusCell(order),
    },
  ]

  const cardStyle = { borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: 'none' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        subtitle="Business performance at a glance"
      />

      {/* ── KPI row ──────────────────────────────────────────────────── */}
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card style={cardStyle}>
            <Statistic
              title={<span style={{ fontSize: 13, color: '#6b7280' }}>Total Inventory</span>}
              value={adminStats.productCount}
              suffix={<span style={{ fontSize: 12, color: '#9ca3af' }}>units</span>}
              valueStyle={{ color: NAVY, fontWeight: 700, fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={cardStyle}>
            <Statistic
              title={<span style={{ fontSize: 13, color: '#6b7280' }}>Active Bookings</span>}
              value={adminStats.bookingCount}
              suffix={<span style={{ fontSize: 12, color: '#9ca3af' }}>orders</span>}
              valueStyle={{ color: NAVY, fontWeight: 700, fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={cardStyle}>
            <Statistic
              title={<span style={{ fontSize: 13, color: '#6b7280' }}>Total Revenue</span>}
              value={adminStats.totalRevenue}
              prefix={<span style={{ fontSize: 18, color: '#9ca3af' }}>₹</span>}
              valueStyle={{ color: NAVY, fontWeight: 700, fontSize: 28 }}
            />
          </Card>
        </Col>
      </Row>

      {/* ── Schedule row ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 12, fontSize: 13, fontWeight: 600, color: NAVY }}>Schedule</div>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card
            style={cardStyle}
            bodyStyle={{ padding: 0, height: 360, overflowY: 'auto' }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, color: NAVY, fontSize: 13 }}>Going Out</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400 }}>Pickups scheduled</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <RangePicker
                    value={scheduleRangeOut[0] ? scheduleRangeOut : [null, null]}
                    onChange={v => setScheduleRangeOut(v || [null, null])}
                    size="small"
                    format="DD MMM"
                    allowClear
                    placeholder={['From', 'To']}
                    style={{ width: 190 }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', background: '#f3f4f6', borderRadius: 20, padding: '2px 10px' }}>{flattenedOut.length}</span>
                </div>
              </div>
            }
          >
            {flattenedOut.length === 0 ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: '#d1d5db', fontSize: 12 }}>No pickups scheduled</div>
            ) : (
              flattenedOut.map(item => <ScheduleRow key={item.uniqueKey} item={item} />)
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card
            style={cardStyle}
            bodyStyle={{ padding: 0, height: 360, overflowY: 'auto' }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, color: NAVY, fontSize: 13 }}>Coming Back</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400 }}>Returns due</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <RangePicker
                    value={scheduleRangeIn[0] ? scheduleRangeIn : [null, null]}
                    onChange={v => setScheduleRangeIn(v || [null, null])}
                    size="small"
                    format="DD MMM"
                    allowClear
                    placeholder={['From', 'To']}
                    style={{ width: 190 }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', background: '#f3f4f6', borderRadius: 20, padding: '2px 10px' }}>{flattenedIn.length}</span>
                </div>
              </div>
            }
          >
            {flattenedIn.length === 0 ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: '#d1d5db', fontSize: 12 }}>No returns due</div>
            ) : (
              flattenedIn.map(item => {
                const sku      = item.displayItem?.productId?.sku || item.displayItem?.sku || '—'
                const unitCode = item.displayItem?.unitCode || '—'
                return (
                  <div key={item.uniqueKey} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid #f9fafb' }}>
                    <img
                      src={getImageUrl(item.displayItem?.imageUrl || item.displayItem?.productId?.imageUrl)}
                      style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', border: '1px solid #f0f0f0', flexShrink: 0, background: '#f9fafb' }}
                      alt=""
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: NAVY }}>{item.displayItem?.name || 'Unknown item'}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{item.userName}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, marginRight: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#6366f1', background: '#eef2ff', borderRadius: 4, padding: '1px 6px' }}>{sku}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#0891b2', background: '#ecfeff', borderRadius: 4, padding: '1px 6px' }}>{unitCode}</span>
                    </div>
                    <Button size="small" type="primary" onClick={() => setIsReturnConfirming(item._id)}>Return</Button>
                  </div>
                )
              })
            )}
          </Card>
        </Col>
      </Row>

      {/* ── Rental Pipeline ──────────────────────────────────────────── */}
      <Card
        style={cardStyle}
        bodyStyle={{ padding: 0 }}
        title={
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, color: NAVY, fontSize: 15 }}>Rental Pipeline</div>
              <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 400 }}>Track, search and manage every booking</div>
            </div>
            <Space>
              <Input
                prefix={<SearchOutlined style={{ color: '#d1d5db' }} />}
                placeholder="Search orders…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                allowClear
                style={{ width: 220 }}
              />
              <RangePicker
                value={[startDate ? dayjs(startDate) : null, endDate ? dayjs(endDate) : null]}
                onChange={dates => setDateRange(dates ? [dates[0]?.toDate() || null, dates[1]?.toDate() || null] : [null, null])}
                format="DD/MM/YYYY"
                style={{ width: 240 }}
              />
            </Space>
          </div>
        }
      >
        <div style={{ padding: '0 24px' }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: 'all',      label: 'All Rentals' },
              { key: 'upcoming', label: 'Upcoming' },
              { key: 'ready',    label: 'Ready for Pickup' },
              { key: 'rented',   label: 'Rented Out' },
              { key: 'returned', label: 'Returned' },
              { key: 'due',      label: 'Overdue Orders' },
            ]}
            size="small"
          />
        </div>
        <Table
          columns={columns}
          dataSource={filteredOrders}
          rowKey="_id"
          pagination={{ defaultPageSize: 10, showSizeChanger: true, showTotal: (t, r) => `Showing ${r[0]}-${r[1]} of ${t}` }}
          style={{ borderRadius: 0 }}
        />
      </Card>

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

      {/* Edit Return Notes Modal */}
      <Modal
        open={!!editingNotes.id}
        onCancel={() => setEditingNotes({ id: null, notes: '', condition: '' })}
        title="Edit Return Details"
        okText="Save Changes"
        onOk={() => { updateBookingStatus(editingNotes.id, 'Returned', editingNotes.condition, editingNotes.notes); setEditingNotes({ id: null, notes: '', condition: '' }) }}
        centered destroyOnHidden
      >
        <div style={{ paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>Condition</Text>
            <Radio.Group value={editingNotes.condition} onChange={e => setEditingNotes(p => ({ ...p, condition: e.target.value }))} buttonStyle="solid">
              <Radio.Button value="Good">Good</Radio.Button>
              <Radio.Button value="Bad">Bad</Radio.Button>
            </Radio.Group>
          </div>
          <div>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>Notes</Text>
            <TextArea rows={3} value={editingNotes.notes} onChange={e => setEditingNotes(p => ({ ...p, notes: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AdminOverview
