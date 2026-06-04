import { useState } from 'react'
import {
  Input, Button, Modal, Typography, Radio, DatePicker, Image,
  Row, Col, Descriptions, Pagination, Space, Tooltip
} from 'antd'
import {
  EyeOutlined, SafetyCertificateOutlined, CheckCircleOutlined,
  ArrowRightOutlined, SearchOutlined, FilterOutlined, CloseOutlined,
} from '@ant-design/icons'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import { useGlobal } from '../../context/GlobalContext'
import PageHeader from '../../components/PageHeader'
import PaymentModal from '../../components/PaymentModal'

const { Text } = Typography
const { TextArea } = Input

// ── Status config ────────────────────────────────────────────────────
const STATUS_CFG = {
  'Request Submitted': { color: '#94a3b8', bg: '#f8fafc', label: 'Submitted' },
  'KYC Pending':       { color: '#f59e0b', bg: '#fffbeb', label: 'KYC Pending' },
  'KYC Approved':      { color: '#10b981', bg: '#f0fdf4', label: 'KYC Approved' },
  'Approved':          { color: '#10b981', bg: '#f0fdf4', label: 'Approved' },
  'Ready for Pickup':  { color: '#6366f1', bg: '#eef2ff', label: 'Ready for Pickup' },
  'During Rental':     { color: '#3b82f6', bg: '#eff6ff', label: 'Active Rental' },
  'Picked Up':         { color: '#3b82f6', bg: '#eff6ff', label: 'Picked Up' },
  'Active':            { color: '#3b82f6', bg: '#eff6ff', label: 'Active' },
  'Return Pending':    { color: '#f97316', bg: '#fff7ed', label: 'Return Pending' },
  'Returned':          { color: '#22c55e', bg: '#f0fdf4', label: 'Returned' },
  'Closed':            { color: '#22c55e', bg: '#f0fdf4', label: 'Closed' },
  'Rejected':          { color: '#ef4444', bg: '#fef2f2', label: 'Rejected' },
}

const cfg = (status) => STATUS_CFG[status] || { color: '#94a3b8', bg: '#f8fafc', label: status }

// ── Active rental statuses ───────────────────────────────────────────
const ACTIVE_STATUSES   = ['Picked Up', 'During Rental', 'Return Pending', 'Active', 'Request Submitted', 'KYC Pending', 'KYC Approved', 'Approved', 'Ready for Pickup']
const RETURNED_STATUSES = ['Returned', 'Closed']

// ── Main component ───────────────────────────────────────────────────
const OrdersMonitor = () => {
  const { allOrders, API_URL } = useGlobal()

  const [selectedOrder,     setSelectedOrder]     = useState(null)
  const [searchQuery,       setSearchQuery]       = useState('')
  const [activeTab,         setActiveTab]         = useState('all')
  const [dateFilter,        setDateFilter]        = useState(null)
  const [currentPage,       setCurrentPage]       = useState(1)
  const [pageSize,          setPageSize]          = useState(10)
  const [isReturnConfirming,setIsReturnConfirming]= useState(null)
  const [returnCondition,   setReturnCondition]   = useState('Good')
  const [returnNotes,       setReturnNotes]       = useState('')
  const [editingNotes,      setEditingNotes]      = useState({ id: null, notes: '', condition: '' })
  const [selectedKycOrder,  setSelectedKycOrder]  = useState(null)
  const [kycRejectionReason,setKycRejectionReason]= useState('')
  const [actionLoading,     setActionLoading]     = useState(false)
  const [paymentTarget,     setPaymentTarget]     = useState(null)
  const [rejectTarget,      setRejectTarget]      = useState(null) // { orderId, targetStatus }
  const [rejectReason,      setRejectReason]      = useState('')

  // ── API helpers ────────────────────────────────────────────────────
  const updateBookingStatus = async (id, newStatus, condition = 'Good', notes = '') => {
    try {
      const res = await fetch(`${API_URL}/admin/bookings/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, returnCondition: condition, returnNotes: notes }),
      })
      if (res.ok) { toast.success(`Marked as ${newStatus}`) }
    } catch { toast.error('Update failed') }
  }

  const handleTransition = async (orderId, targetStatus, extraBody = {}) => {
    setActionLoading(true)
    try {
      const res = await fetch(`${API_URL}/admin/bookings/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus, ...extraBody }),
      })
      if (res.ok) { toast.success(`→ ${targetStatus}`); setSelectedOrder(null) }
      else toast.error('Failed')
    } catch { toast.error('Error') }
    finally { setActionLoading(false) }
  }

  // ── Filtering ──────────────────────────────────────────────────────
  const filteredOrders = allOrders.filter(order => {
    const q = searchQuery.toLowerCase()
    const matchSearch =
      order.userName?.toLowerCase().includes(q) ||
      order.userMobile?.includes(q) ||
      order.userEmail?.toLowerCase().includes(q)

    let matchTab = true
    if (activeTab === 'rented')   matchTab = ACTIVE_STATUSES.includes(order.status)
    if (activeTab === 'returned') matchTab = RETURNED_STATUSES.includes(order.status)
    if (activeTab === 'due') {
      const soon = new Date(); soon.setDate(soon.getDate() + 3)
      matchTab = ACTIVE_STATUSES.includes(order.status) &&
        new Date(order.endDate) <= soon && new Date(order.endDate) >= new Date()
    }

    const matchDate = !dateFilter ||
      new Date(order.startDate).toDateString() === dateFilter.toDate().toDateString()

    return matchSearch && matchTab && matchDate
  })

  const counts = {
    all:      allOrders.length,
    rented:   allOrders.filter(o => ACTIVE_STATUSES.includes(o.status)).length,
    returned: allOrders.filter(o => RETURNED_STATUSES.includes(o.status)).length,
    due: allOrders.filter(o => {
      const soon = new Date(); soon.setDate(soon.getDate() + 3)
      return ACTIVE_STATUSES.includes(o.status) && new Date(o.endDate) <= soon && new Date(o.endDate) >= new Date()
    }).length,
  }

  const paginated = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // ── Row: inline status actions ─────────────────────────────────────
  const InlineStatus = ({ order }) => {
    const s = order.status
    const { color, label } = cfg(s)

    if (s === 'Returned') return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#22c55e', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          <CheckCircleOutlined /> Returned
        </span>
        {order.returnCondition && (
          <button
            onClick={() => setEditingNotes({ id: order._id, notes: order.returnNotes || '', condition: order.returnCondition })}
            style={{
              fontSize: 11, fontWeight: 600,
              color: order.returnCondition === 'Good' ? '#22c55e' : '#ef4444',
              background: order.returnCondition === 'Good' ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${order.returnCondition === 'Good' ? '#bbf7d0' : '#fecaca'}`,
              borderRadius: 6, padding: '2px 8px', cursor: 'pointer',
            }}
          >
            {order.returnCondition}
          </button>
        )}
      </div>
    )

    if (s === 'Rejected') return (
      <span style={{ color: '#ef4444', fontSize: 13, fontWeight: 600 }}>Rejected</span>
    )

    if (s === 'Closed') return (
      <span style={{ color: '#22c55e', fontSize: 13, fontWeight: 600 }}>Closed</span>
    )

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 12, fontWeight: 600, color,
          background: cfg(s).bg,
          border: `1px solid ${color}30`,
          borderRadius: 6, padding: '2px 8px',
        }}>{label}</span>

        {(s === 'KYC Pending' || s === 'Request Submitted') && (
          <>
            <button
              onClick={() => handleTransition(order._id, 'Approved')}
              style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: '#10b981', border: 'none', borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}
            >Approve</button>
            <button
              onClick={() => { setRejectReason(''); setRejectTarget({ orderId: order._id, targetStatus: 'Rejected' }) }}
              style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', background: '#fff', border: '1px solid #fecaca', borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}
            >Reject</button>
          </>
        )}

        {['During Rental', 'Picked Up', 'Active', 'Return Pending'].includes(s) && (
          <button
            onClick={() => setIsReturnConfirming(order._id)}
            style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: '#1e1b4b', border: 'none', borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}
          >Mark Returned</button>
        )}
      </div>
    )
  }

  // ── Detail modal action buttons ────────────────────────────────────
  const DetailActions = ({ order }) => {
    const s = order.status
    const map = {
      'Request Submitted': [
        { label: 'Approve Rental', target: 'Approved', primary: true },
        { label: 'Reject',         target: 'Rejected', danger: true, needsReason: true },
      ],
      'KYC Pending': [
        { label: 'Approve KYC',    target: 'Approved', primary: true },
        { label: 'Reject KYC',     target: 'Rejected', danger: true, needsReason: true },
      ],
    }
    if (['Approved', 'KYC Approved'].includes(s)) {
      map[s] = [
        { label: 'Ready for Pickup', target: 'Ready for Pickup', primary: true },
        { label: 'Reject', target: 'Rejected', danger: true, needsReason: true },
      ]
    }
    if (s === 'Ready for Pickup') map[s] = [{ label: 'Confirm Pickup', target: 'During Rental', primary: true }]
    if (['During Rental', 'Picked Up', 'Return Pending', 'Active'].includes(s)) {
      map[s] = [{ label: 'Mark Returned', target: 'Returned', modal: true }]
    }
    if (s === 'Returned') map[s] = [{ label: 'Close Order', target: 'Closed', primary: true }]

    const actions = map[s] || []
    if (!actions.length) return <Text type="secondary" style={{ fontSize: 12 }}>No pending actions</Text>

    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        {actions.map(a => (
          <Button
            key={a.label}
            type={a.primary ? 'primary' : 'default'}
            danger={a.danger}
            block
            loading={actionLoading}
            onClick={() => {
              if (a.modal) { setIsReturnConfirming(order._id) }
              else if (a.needsReason) { setRejectReason(''); setRejectTarget({ orderId: order._id, targetStatus: a.target }) }
              else handleTransition(order._id, a.target)
            }}
          >{a.label}</Button>
        ))}
      </Space>
    )
  }

  // ── Tab pill ───────────────────────────────────────────────────────
  const TabPill = ({ id, label }) => {
    const active = activeTab === id
    return (
      <button
        onClick={() => { setActiveTab(id); setCurrentPage(1) }}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 14px',
          borderRadius: 20,
          border: active ? '1.5px solid #1e1b4b' : '1.5px solid #e5e7eb',
          background: active ? '#1e1b4b' : 'transparent',
          color: active ? '#fff' : '#6b7280',
          fontSize: 13, fontWeight: active ? 600 : 500,
          cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        {label}
        <span style={{
          fontSize: 11, fontWeight: 700,
          background: active ? 'rgba(255,255,255,0.2)' : '#e5e7eb',
          color: active ? '#fff' : '#6b7280',
          borderRadius: 10, padding: '1px 7px',
          minWidth: 20, textAlign: 'center',
        }}>
          {counts[id]}
        </span>
      </button>
    )
  }

  // ── Order row ──────────────────────────────────────────────────────
  const OrderRow = ({ order }) => {
    const items = order.items?.length ? order.items : [order.productId]
    const hasKyc = order.userKyc?.kycDocuments &&
      (order.userKyc.kycDocuments.aadhaarFront || order.userKyc.kycDocuments.panFront)

    return (
      <div
        style={{
          display: 'flex', alignItems: 'center',
          borderBottom: '1px solid #f3f4f6',
          padding: '14px 20px 14px 18px',
          gap: 0,
          background: '#fff',
          transition: 'background 0.12s',
          cursor: 'pointer',
        }}
        onClick={() => setSelectedOrder(order)}
        onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
        onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
      >
        {/* Equipment */}
        <div style={{ flex: '0 0 300px', display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
            {items.slice(0, 3).map((item, i) => (
              <img
                key={i}
                src={item?.productId?.imageUrl || item?.imageUrl || ''}
                alt=""
                style={{
                  width: 36, height: 36, borderRadius: 7,
                  objectFit: 'cover', objectPosition: 'center',
                  border: '1px solid #f0f0f0', background: '#f9f9f9',
                }}
              />
            ))}
          </div>
          <div style={{ minWidth: 0 }}>
            {items.slice(0, 2).map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#d1d5db', flexShrink: 0 }} />
                <span style={{
                  fontSize: 13, fontWeight: 600, color: '#111827',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {item?.name || 'Unknown Item'}
                </span>
              </div>
            ))}
            {items.length > 2 && (
              <div style={{ fontSize: 11, color: '#9ca3af', marginLeft: 11, marginTop: 2 }}>
                +{items.length - 2} More Items
              </div>
            )}
          </div>
        </div>

        {/* Client */}
        <div style={{ flex: '0 0 220px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{order.userName}</span>
            <span style={{
              fontSize: 10, fontWeight: 600,
              background: '#f3f4f6', color: '#6b7280',
              padding: '1px 6px', borderRadius: 4,
            }}>
              {order.accountType || 'Private'}
            </span>
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 1 }}>
            {order.userMobile || '—'}
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>{order.userEmail}</div>
        </div>

        {/* Return date */}
        <div style={{ flex: '0 0 140px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
            {new Date(order.endDate).toLocaleDateString('en-GB')}
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>
            At {new Date(order.endDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </div>
        </div>

        {/* Actions + Status */}
        <div
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}
          onClick={e => e.stopPropagation()}
        >
          <Tooltip title="View Order Details">
            <button
              onClick={() => setSelectedOrder(order)}
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: '#f9fafb', border: '1px solid #f0f0f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#9ca3af',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#374151' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.color = '#9ca3af' }}
            >
              <EyeOutlined style={{ fontSize: 14 }} />
            </button>
          </Tooltip>

          {hasKyc && (
            <Tooltip title="View KYC Documents">
              <button
                onClick={() => setSelectedKycOrder(order)}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: '#f9fafb', border: '1px solid #e5e7eb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#6b7280',
                  transition: 'all 0.15s',
                }}
              >
                <SafetyCertificateOutlined style={{ fontSize: 14 }} />
              </button>
            </Tooltip>
          )}

          <InlineStatus order={order} />

          {/* Payment button — shown for financially active orders */}
          {['Ready for Pickup', 'During Rental', 'Picked Up', 'Return Pending', 'Returned', 'Closed', 'Active'].includes(order.status) && (
            <Tooltip title={order.pendingAmount > 0 ? `₹${order.pendingAmount?.toLocaleString()} pending` : 'Fully Paid'}>
              <button
                onClick={() => setPaymentTarget(order)}
                style={{
                  width: 32, height: 32, borderRadius: 8, fontWeight: 800, fontSize: 13,
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  color: order.pendingAmount > 0 ? '#374151' : '#6b7280',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >₹</button>
            </Tooltip>
          )}
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        eyebrow="Rental Pipeline"
        title="Orders Monitor"
        subtitle="Track, search and manage every booking"
        actions={
          <Space>
            <Input
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Search by name, mobile..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1) }}
              allowClear
              style={{ width: 240 }}
            />
            <DatePicker
              placeholder="Filter by date"
              value={dateFilter}
              onChange={d => { setDateFilter(d); setCurrentPage(1) }}
              allowClear
              style={{ width: 155 }}
            />
          </Space>
        }
      />

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        <TabPill id="all"      label="All Rentals" />
        <TabPill id="rented"   label="Rented Out" />
        <TabPill id="returned" label="Returned" />
        <TabPill id="due"      label="Return in 3 Days" />
      </div>

      {/* Order list card */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        border: '1px solid #f0f0f0',
      }}>
        {/* Column headers */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 20px 10px 22px',
          background: '#fafafa',
          borderBottom: '1px solid #f0f0f0',
          gap: 0,
        }}>
          <div style={{ flex: '0 0 300px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Equipment Details</div>
          <div style={{ flex: '0 0 220px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Client & Contact</div>
          <div style={{ flex: '0 0 140px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Return Schedule</div>
          <div style={{ flex: 1,          fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Actions & Status</div>
        </div>

        {/* Rows */}
        {paginated.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#d1d5db' }}>
            <FilterOutlined style={{ fontSize: 32, marginBottom: 12, display: 'block' }} />
            <div style={{ fontSize: 13, fontWeight: 600 }}>No orders match your filters</div>
          </div>
        ) : (
          paginated.map(order => <OrderRow key={order._id} order={order} />)
        )}

        {/* Pagination */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px',
          borderTop: '1px solid #f3f4f6',
          background: '#fafafa',
        }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Showing {filteredOrders.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredOrders.length)} of {filteredOrders.length}
          </Text>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={filteredOrders.length}
            onChange={(p, ps) => { setCurrentPage(p); setPageSize(ps) }}
            showSizeChanger
            pageSizeOptions={['5', '10', '20', '50']}
            size="small"
          />
        </div>
      </div>

      {/* ── Order Detail Modal ───────────────────────────────────────── */}
      <Modal
        open={!!selectedOrder}
        onCancel={() => setSelectedOrder(null)}
        footer={null}
        width={1140}
        styles={{ body: { padding: '0 28px 28px' } }}
        title={
          <Space>
            <span style={{ color: '#1e1b4b', fontWeight: 700, fontSize: 16 }}>Order Details</span>
            <Text type="secondary" style={{ fontSize: 12 }}>#{selectedOrder?._id?.slice(-8).toUpperCase()}</Text>
            {selectedOrder && (
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: cfg(selectedOrder.status).color,
                background: cfg(selectedOrder.status).bg,
                border: `1px solid ${cfg(selectedOrder.status).color}30`,
                borderRadius: 6, padding: '2px 10px',
              }}>
                {cfg(selectedOrder.status).label}
              </span>
            )}
          </Space>
        }
        destroyOnHidden
      >
        {selectedOrder && (() => {
          const MILESTONES = [
            { label: 'Submitted',  statuses: ['Request Submitted', 'KYC Pending'] },
            { label: 'KYC Done',   statuses: ['KYC Approved'] },
            { label: 'Approved',   statuses: ['Approved'] },
            { label: 'Ready',      statuses: ['Ready for Pickup'] },
            { label: 'Active',     statuses: ['Picked Up', 'During Rental', 'Return Pending', 'Active'] },
            { label: 'Closed',     statuses: ['Returned', 'Closed'] },
          ]
          const isRejected   = selectedOrder.status === 'Rejected'
          const activeIdx    = isRejected ? -1 : MILESTONES.findIndex(m => m.statuses.includes(selectedOrder.status))
          const trackPct     = activeIdx >= 0 ? (activeIdx / (MILESTONES.length - 1)) * 100 : 0

          return (
            <>
              {/* ── Status stepper ─────────────────────────── */}
              <div style={{ background: '#f8fafc', border: '1px solid #eef0f3', borderRadius: 14, padding: '20px 28px', marginBottom: 24, marginTop: 8 }}>
                {isRejected ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: '#ef4444', fontSize: 20 }}>✕</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#991b1b', fontSize: 14 }}>Rental Request Rejected</div>
                      {selectedOrder.rejectionReason && (
                        <div style={{ fontSize: 12, color: '#b91c1c', marginTop: 3 }}>
                          Reason: <em>"{selectedOrder.rejectionReason}"</em>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    {/* Track */}
                    <div style={{ position: 'absolute', left: '6%', right: '6%', top: 16, height: 3, background: '#e5e7eb', borderRadius: 2, zIndex: 0 }} />
                    <div style={{
                      position: 'absolute', left: '6%', top: 16, height: 3,
                      background: 'linear-gradient(90deg, #10b981, #1e1b4b)',
                      borderRadius: 2, zIndex: 1,
                      width: `${trackPct * 0.88}%`,
                      transition: 'width 0.5s ease',
                    }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                      {MILESTONES.map((m, i) => {
                        const done   = i < activeIdx
                        const active = i === activeIdx
                        return (
                          <div key={m.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: '50%',
                              background: done ? '#10b981' : active ? '#1e1b4b' : '#fff',
                              border: done || active ? 'none' : '2px solid #e5e7eb',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 13, fontWeight: 700,
                              color: done || active ? '#fff' : '#d1d5db',
                              boxShadow: active ? '0 0 0 5px rgba(30,27,75,0.12)' : done ? '0 0 0 3px rgba(16,185,129,0.15)' : 'none',
                              transition: 'all 0.3s',
                            }}>
                              {done ? '✓' : i + 1}
                            </div>
                            <span style={{
                              fontSize: 10, fontWeight: active ? 700 : done ? 600 : 500,
                              color: done ? '#10b981' : active ? '#1e1b4b' : '#9ca3af',
                              textTransform: 'uppercase', letterSpacing: '0.06em',
                              whiteSpace: 'nowrap',
                            }}>
                              {m.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ── 3-column content ───────────────────────── */}
              <Row gutter={20}>
                {/* Equipment */}
                <Col span={8}>
                  <Text strong style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Equipment</Text>
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(selectedOrder.items?.length ? selectedOrder.items : [selectedOrder.productId]).map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, padding: 12, background: '#fafafa', borderRadius: 12, border: '1px solid #f0f0f0' }}>
                        <img src={item?.productId?.imageUrl || item?.imageUrl || ''} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'contain', background: '#fff', border: '1px solid #f0f0f0', padding: 2, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b' }}>
                            {item?.name}
                            {(item?.quantity > 1) && (
                              <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: '#E5550F', background: '#fff7ed', padding: '1px 6px', borderRadius: 4 }}>
                                ×{item.quantity}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>₹{item?.pricePerDay}/day</div>
                        </div>
                      </div>
                    ))}
                    {selectedOrder.notes && (
                      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 12px' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Customer Notes</div>
                        <div style={{ fontSize: 12, color: '#78350f' }}>{selectedOrder.notes}</div>
                      </div>
                    )}
                  </div>
                </Col>

                {/* Logistics */}
                <Col span={8}>
                  <Text strong style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Logistics</Text>
                  <div style={{ marginTop: 12, background: '#fafafa', borderRadius: 14, padding: 16, border: '1px solid #f0f0f0', marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700 }}>PICKUP</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{new Date(selectedOrder.startDate).toLocaleDateString('en-GB')}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{new Date(selectedOrder.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <ArrowRightOutlined style={{ color: '#d1d5db' }} />
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700 }}>RETURN</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{new Date(selectedOrder.endDate).toLocaleDateString('en-GB')}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{new Date(selectedOrder.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                    <div style={{ borderTop: '1px dashed #e5e7eb', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>Duration</Text>
                      <Text strong style={{ fontSize: 12 }}>{selectedOrder.totalDays || 1} Day(s)</Text>
                    </div>
                  </div>
                  <Descriptions column={1} size="small" bordered style={{ borderRadius: 10 }}>
                    <Descriptions.Item label="Client">{selectedOrder.userName}</Descriptions.Item>
                    <Descriptions.Item label="Mobile">{selectedOrder.userMobile}</Descriptions.Item>
                    <Descriptions.Item label="Email">{selectedOrder.userEmail}</Descriptions.Item>
                    <Descriptions.Item label="Address">{selectedOrder.userAddress}</Descriptions.Item>
                  </Descriptions>
                </Col>

                {/* Revenue & Actions */}
                <Col span={8}>
                  <Text strong style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Revenue & Actions</Text>
                  <div style={{ marginTop: 12, background: '#1e1b4b', borderRadius: 14, padding: '20px 16px', marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: '#93c5fd', fontWeight: 700 }}>TOTAL REVENUE</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginTop: 4 }}>
                      ₹{selectedOrder.totalPrice?.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ background: '#f9fafb', borderRadius: 12, padding: '12px 14px', border: '1px solid #f0f0f0', marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>Collected</Text>
                      <Text strong style={{ color: '#10b981' }}>₹{(selectedOrder.totalPaid || 0).toLocaleString()}</Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>Pending</Text>
                      <Text strong style={{ color: (selectedOrder.pendingAmount || 0) > 0 ? '#ef4444' : '#10b981' }}>
                        ₹{(selectedOrder.pendingAmount || 0).toLocaleString()}
                      </Text>
                    </div>
                    {(selectedOrder.payments || []).map((p, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', borderTop: '1px solid #f0f0f0' }}>
                        <Space size={4}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>{p.type}</span>
                          <span style={{ color: '#6b7280' }}>{p.mode}</span>
                        </Space>
                        <Text strong>₹{p.amount?.toLocaleString()}</Text>
                      </div>
                    ))}
                  </div>
                  <Button block style={{ marginBottom: 12 }} onClick={() => { setSelectedOrder(null); setPaymentTarget(selectedOrder) }}>
                    ₹ Record Payment
                  </Button>
                  {selectedOrder.userKyc?.kycDocuments && (
                    <Button block icon={<SafetyCertificateOutlined />} style={{ marginBottom: 12 }} onClick={() => setSelectedKycOrder(selectedOrder)}>
                      View KYC Documents
                    </Button>
                  )}
                  <DetailActions order={selectedOrder} />
                </Col>
              </Row>
            </>
          )
        })()}
      </Modal>

      {/* ── Return Confirmation Modal ────────────────────────────────── */}
      <Modal
        open={!!isReturnConfirming}
        onCancel={() => { setIsReturnConfirming(null); setReturnCondition('Good'); setReturnNotes('') }}
        title="Confirm Equipment Return"
        okText="Confirm Return"
        okButtonProps={{ style: returnCondition === 'Bad' ? { background: '#ef4444', borderColor: '#ef4444' } : {} }}
        onOk={() => {
          updateBookingStatus(isReturnConfirming, 'Returned', returnCondition, returnNotes)
          setIsReturnConfirming(null); setReturnCondition('Good'); setReturnNotes('')
          if (selectedOrder) setSelectedOrder(null)
        }}
        centered destroyOnHidden
      >
        <div style={{ paddingBlock: 8, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>Physical Condition</Text>
            <Radio.Group value={returnCondition} onChange={e => setReturnCondition(e.target.value)} buttonStyle="solid">
              <Radio.Button value="Good">Good Condition</Radio.Button>
              <Radio.Button value="Bad" style={returnCondition === 'Bad' ? { background: '#ef4444', borderColor: '#ef4444' } : {}}>Found Issues</Radio.Button>
            </Radio.Group>
          </div>
          {returnCondition === 'Bad' && (
            <div>
              <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>Issue Details</Text>
              <TextArea rows={3} value={returnNotes} onChange={e => setReturnNotes(e.target.value)} placeholder="Describe the damage..." />
            </div>
          )}
        </div>
      </Modal>

      {/* ── Edit Return Notes Modal ──────────────────────────────────── */}
      <Modal
        open={!!editingNotes.id}
        onCancel={() => setEditingNotes({ id: null, notes: '', condition: '' })}
        title="Edit Return Details"
        okText="Save Changes"
        onOk={() => {
          updateBookingStatus(editingNotes.id, 'Returned', editingNotes.condition, editingNotes.notes)
          setEditingNotes({ id: null, notes: '', condition: '' })
        }}
        centered destroyOnHidden
      >
        <div style={{ paddingBlock: 8, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>Condition</Text>
            <Radio.Group value={editingNotes.condition} onChange={e => setEditingNotes(p => ({ ...p, condition: e.target.value }))} buttonStyle="solid">
              <Radio.Button value="Good">Good</Radio.Button>
              <Radio.Button value="Bad">Bad</Radio.Button>
            </Radio.Group>
          </div>
          <div>
            <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>Notes</Text>
            <TextArea rows={3} value={editingNotes.notes} onChange={e => setEditingNotes(p => ({ ...p, notes: e.target.value }))} />
          </div>
        </div>
      </Modal>

      {/* ── Payment Modal ────────────────────────────────────────────── */}
      <PaymentModal
        open={!!paymentTarget}
        booking={paymentTarget}
        onClose={() => setPaymentTarget(null)}
        onSuccess={() => { setPaymentTarget(null) }}
      />

      {/* ── Rejection Reason Modal ───────────────────────────────────── */}
      <Modal
        open={!!rejectTarget}
        onCancel={() => { setRejectTarget(null); setRejectReason('') }}
        title={
          <Space>
            <span style={{ color: '#ef4444', fontSize: 18, display: 'flex', alignItems: 'center' }}>
              <CloseOutlined />
            </span>
            <span style={{ color: '#1e1b4b', fontWeight: 700 }}>Reject Order</span>
          </Space>
        }
        okText="Confirm Rejection"
        okButtonProps={{ danger: true, disabled: !rejectReason.trim(), loading: actionLoading }}
        cancelText="Cancel"
        onOk={() => {
          if (!rejectReason.trim()) return
          handleTransition(rejectTarget.orderId, rejectTarget.targetStatus, { rejectionReason: rejectReason.trim() })
        }}
        centered
        destroyOnHidden
      >
        <div style={{ paddingBlock: 8 }}>
          <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
            Let the customer know why this order is being rejected. This message will be shared with them.
          </Text>
          <TextArea
            rows={4}
            autoFocus
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="e.g. KYC document is blurry, requested dates unavailable, gear under maintenance..."
          />
        </div>
      </Modal>

      {/* ── KYC Viewer Modal ─────────────────────────────────────────── */}
      <Modal
        open={!!selectedKycOrder}
        onCancel={() => { setSelectedKycOrder(null); setKycRejectionReason('') }}
        title={`KYC Documents — ${selectedKycOrder?.userName}`}
        width={760}
        footer={
          selectedKycOrder?.userKyc?.kycStatus === 'Pending' ? (
            <Space>
              <Button onClick={() => { setSelectedKycOrder(null); setKycRejectionReason('') }}>Cancel</Button>
              <Button danger disabled={!kycRejectionReason.trim()}
                onClick={async () => {
                  const uid = selectedKycOrder.userKyc?._id
                  if (!uid) return toast.error('User not found')
                  await fetch(`${API_URL}/admin/users/${uid}/kyc`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kycStatus: 'Rejected', kycRejectionReason }) })
                  await handleTransition(selectedKycOrder._id, 'Rejected', { rejectionReason: kycRejectionReason })
                  setSelectedKycOrder(null); setKycRejectionReason('')
                }}>
                Reject KYC
              </Button>
              <Button type="primary" style={{ background: '#10b981' }}
                onClick={async () => {
                  const uid = selectedKycOrder.userKyc?._id
                  if (!uid) return toast.error('User not found')
                  await fetch(`${API_URL}/admin/users/${uid}/kyc`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kycStatus: 'Approved' }) })
                  await handleTransition(selectedKycOrder._id, 'Approved')
                  setSelectedKycOrder(null)
                }}>
                Approve KYC
              </Button>
            </Space>
          ) : (
            <Button onClick={() => setSelectedKycOrder(null)}>Close</Button>
          )
        }
        destroyOnHidden
      >
        {selectedKycOrder && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              {[
                { name: 'Aadhaar Front', key: 'aadhaarFront' },
                { name: 'Aadhaar Back',  key: 'aadhaarBack' },
                { name: 'PAN Front',     key: 'panFront' },
                { name: 'PAN Back',      key: 'panBack' },
              ].map(doc => {
                const url = selectedKycOrder.userKyc?.kycDocuments?.[doc.key]
                return (
                  <div key={doc.key} style={{ background: '#f9fafb', borderRadius: 12, padding: 12, border: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{doc.name}</Text>
                    {url
                      ? <Image src={url} alt={doc.name} height={160} style={{ objectFit: 'contain', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                      : <div style={{ width: '100%', height: 160, border: '2px dashed #e5e7eb', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d1d5db', fontSize: 12, fontWeight: 600 }}>Not Submitted</div>
                    }
                  </div>
                )
              })}
            </div>
            {selectedKycOrder.userKyc?.kycStatus === 'Pending' && (
              <div>
                <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>Rejection Reason (required if rejecting)</Text>
                <TextArea rows={3} value={kycRejectionReason} onChange={e => setKycRejectionReason(e.target.value)} placeholder="Explain why the documents are being rejected..." />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default OrdersMonitor
