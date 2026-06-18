import { useState, useEffect } from 'react'
import {
  Input, Button, Modal, Typography, Radio, DatePicker, Image,
  Row, Col, Descriptions, Table, Space, Tooltip, Popconfirm
} from 'antd'
import {
  EyeOutlined, SafetyCertificateOutlined, CheckCircleOutlined,
  ArrowRightOutlined, SearchOutlined, FilterOutlined, CloseOutlined,
  PrinterOutlined, EnvironmentOutlined, ExclamationCircleOutlined, DeleteOutlined,
} from '@ant-design/icons'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'
import { useGlobal, getImageUrl } from '../../context/GlobalContext'
import { getAdminSettings } from './Settings'
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
  'Reopened':          { color: '#f97316', bg: '#fff7ed', label: 'Reopened' },
  'Rejected':          { color: '#ef4444', bg: '#fef2f2', label: 'Rejected' },
}

const cfg = (status) => STATUS_CFG[status] || { color: '#94a3b8', bg: '#f8fafc', label: status }

// ── Active rental statuses ───────────────────────────────────────────
const ACTIVE_STATUSES   = ['Picked Up', 'During Rental', 'Return Pending', 'Active', 'Request Submitted', 'KYC Pending', 'KYC Approved', 'Approved', 'Ready for Pickup', 'Reopened']
const RETURNED_STATUSES = ['Returned', 'Closed']

// ── Main component ───────────────────────────────────────────────────
const OrdersMonitor = () => {
  const { allOrders, setAllOrders, API_URL } = useGlobal()
  const pickupLocs = getAdminSettings().pickupLocations || []
  const [searchParams] = useSearchParams()
  const orderIdParam = searchParams.get('orderId')

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
  const [approveTarget,     setApproveTarget]     = useState(null)   // { orderId, targetStatus, keepOpen }
  const [approveLocation,   setApproveLocation]   = useState(() => pickupLocs[0]?.id || '')
  const [reopenTarget,      setReopenTarget]      = useState(null)   // orderId
  const [reopenNotes,       setReopenNotes]       = useState('')

  // Auto-open order from URL param (navigated from Users page)
  useEffect(() => {
    if (!orderIdParam || !allOrders.length || selectedOrder) return
    const order = allOrders.find(o => o._id === orderIdParam)
    if (order) setSelectedOrder(order)
  }, [allOrders, orderIdParam])

  // ── Print order ────────────────────────────────────────────────────
  const printOrder = (order) => {
    if (!order) return
    const items = order.items?.length ? order.items : [order.productId ? [order.productId] : []].flat()
    const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')
    const invoiceDate = fmtDate(order.createdAt || new Date())
    const invoiceNo   = order.bookingCode || ('#' + order._id?.slice(-8).toUpperCase())
    const days        = order.totalDays || 1
    const discount    = order.discountAmount || 0
    const subTotal    = items.reduce((s, it) => s + (it?.pricePerDay || 0) * days * (it?.quantity || 1), 0)
    const total       = order.totalPrice || (subTotal - discount)
    const balanceDue  = order.pendingAmount ?? total

    const amountInWords = (n) => {
      const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
      const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
      const inWords = (num) => {
        if (num === 0) return ''
        if (num < 20) return a[num] + ' '
        if (num < 100) return b[Math.floor(num/10)] + (num%10 ? ' ' + a[num%10] : '') + ' '
        if (num < 1000) return a[Math.floor(num/100)] + ' Hundred ' + inWords(num%100)
        if (num < 100000) return inWords(Math.floor(num/1000)) + 'Thousand ' + inWords(num%1000)
        if (num < 10000000) return inWords(Math.floor(num/100000)) + 'Lakh ' + inWords(num%100000)
        return inWords(Math.floor(num/10000000)) + 'Crore ' + inWords(num%10000000)
      }
      const rupees = Math.floor(n)
      const paise  = Math.round((n - rupees) * 100)
      let words = 'Indian Rupee ' + inWords(rupees).trim()
      if (paise) words += ' and ' + inWords(paise).trim() + ' Paise'
      return words + ' Only'
    }

    const logoUrl = `${window.location.origin}/logo.jpg`

    const html = `<!DOCTYPE html><html><head>
<meta charset="utf-8">
<title>${invoiceNo}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #111; background: #fff; }
  .page { max-width: 750px; margin: 0 auto; padding: 32px 28px; border: 1px solid #ccc; }

  /* Header */
  .inv-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #ccc; padding-bottom: 16px; margin-bottom: 0; }
  .inv-header-left { display: flex; align-items: flex-start; gap: 16px; }
  .inv-header-left img { width: 90px; height: auto; object-fit: contain; }
  .company-name { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
  .company-addr { font-size: 11px; line-height: 1.55; color: #333; max-width: 340px; }
  .tax-invoice-label { font-size: 30px; font-weight: 400; letter-spacing: 1px; color: #111; align-self: flex-end; }

  /* Meta table */
  .meta-table { width: 100%; border-collapse: collapse; border: 1px solid #ccc; margin-top: 0; }
  .meta-table td { padding: 5px 10px; font-size: 12px; border: 1px solid #ccc; vertical-align: top; }
  .meta-table .meta-label { color: #555; width: 110px; }
  .meta-table .meta-val { font-weight: 600; }

  /* Bill To */
  .bill-to-header { background: #e8e8e8; padding: 5px 10px; font-size: 12px; font-weight: 600; border: 1px solid #ccc; border-top: none; }
  .bill-to-name { padding: 6px 10px 10px; font-size: 13px; font-weight: 700; border: 1px solid #ccc; border-top: none; }

  /* Items table */
  .items-table { width: 100%; border-collapse: collapse; margin-top: 0; }
  .items-table th { background: #e8e8e8; font-size: 12px; font-weight: 700; padding: 7px 10px; border: 1px solid #ccc; text-align: left; }
  .items-table th.num { width: 36px; text-align: center; }
  .items-table th.qty { width: 70px; text-align: right; }
  .items-table th.rate { width: 90px; text-align: right; }
  .items-table th.amt { width: 90px; text-align: right; }
  .items-table td { padding: 8px 10px; border: 1px solid #ccc; font-size: 12px; vertical-align: top; }
  .items-table td.num { text-align: center; }
  .items-table td.qty { text-align: right; }
  .items-table td.rate { text-align: right; }
  .items-table td.amt { text-align: right; }

  /* Footer split */
  .footer-split { display: flex; border: 1px solid #ccc; border-top: none; }
  .footer-left { flex: 1; padding: 12px 10px; border-right: 1px solid #ccc; font-size: 12px; }
  .footer-right { width: 260px; font-size: 12px; }
  .totals-row { display: flex; justify-content: space-between; padding: 5px 10px; border-bottom: 1px solid #ccc; }
  .totals-row.bold { font-weight: 700; font-size: 13px; }
  .sig-box { padding: 12px 10px; text-align: center; min-height: 80px; display: flex; flex-direction: column; justify-content: space-between; }

  @media print {
    body { margin: 0; }
    .page { border: none; padding: 20px; max-width: 100%; }
  }
</style>
</head><body>
<div class="page">

  <!-- Header -->
  <div class="inv-header">
    <div class="inv-header-left">
      <img src="${logoUrl}" alt="Lens Men Logo" />
      <div>
        <div class="company-name">LENS MEN</div>
        <div class="company-addr">
          flat no S3, 2nd floor, Sri Niketan Apartment, Sasi Nagar<br>
          Main road, Sasinagar Old no 7 new no 16, near Anbu Hospital, Velachery.<br>
          Chennai Tamil Nadu 600042<br>
          India<br>
          +919080086600<br>
          lensmen@live.com
        </div>
      </div>
    </div>
    <div class="tax-invoice-label">TAX INVOICE</div>
  </div>

  <!-- Invoice Meta -->
  <table class="meta-table">
    <tr>
      <td class="meta-label">#</td>
      <td class="meta-val">${invoiceNo}</td>
      <td rowspan="4" style="width:50%"></td>
    </tr>
    <tr>
      <td class="meta-label">Invoice Date</td>
      <td class="meta-val">${invoiceDate}</td>
    </tr>
    <tr>
      <td class="meta-label">Terms</td>
      <td class="meta-val">Due on Receipt</td>
    </tr>
    <tr>
      <td class="meta-label">Due Date</td>
      <td class="meta-val">${invoiceDate}</td>
    </tr>
  </table>

  <!-- Bill To -->
  <div class="bill-to-header">Bill To</div>
  <div class="bill-to-name">${order.userName || '—'}</div>

  <!-- Items Table -->
  <table class="items-table">
    <thead>
      <tr>
        <th class="num">#</th>
        <th>Item &amp; Description</th>
        <th class="qty">Qty</th>
        <th class="rate">Rate</th>
        <th class="amt">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item, i) => {
        const qty  = (item?.quantity || 1)
        const rate = (item?.pricePerDay || 0) * days
        const amt  = qty * rate
        return `<tr>
          <td class="num">${i + 1}</td>
          <td>${item?.name || 'Unknown'}<br><span style="font-size:11px;color:#666;">${days} day${days !== 1 ? 's' : ''} rental</span></td>
          <td class="qty">${qty}.0</td>
          <td class="rate">${rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td class="amt">${amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>`
      }).join('')}
    </tbody>
  </table>

  <!-- Footer split -->
  <div class="footer-split">
    <div class="footer-left">
      <div style="margin-bottom:8px;">
        <div style="font-size:11px;color:#555;margin-bottom:2px;">Total In Words</div>
        <div style="font-weight:700;font-style:italic;">${amountInWords(total)}</div>
      </div>
      <div style="margin-bottom:32px;">
        <div style="font-size:11px;color:#555;margin-bottom:2px;">Notes</div>
        <div>${order.notes || 'Thanks for your business.'}</div>
      </div>
      <div style="font-size:11px;color:#555;margin-top:8px;">Customer Signature.</div>
    </div>
    <div class="footer-right">
      <div class="totals-row">
        <span>Sub Total</span>
        <span>${subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
      ${discount > 0 ? `<div class="totals-row">
        <span>Discount</span>
        <span>(-) ${discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>` : ''}
      <div class="totals-row bold">
        <span>Total</span>
        <span>₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
      <div class="totals-row bold" style="border-bottom:none;">
        <span>Balance Due</span>
        <span>₹${balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
      <div class="sig-box" style="border-top:1px solid #ccc;">
        <div style="font-size:12px;margin-bottom:8px;">N Indrakumar</div>
        <div style="font-size:11px;color:#555;">Authorized Signature</div>
      </div>
    </div>
  </div>

</div>
</body></html>`

    const win = window.open('', '_blank', 'width=820,height=960')
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print() }, 600)
  }

  const handleDeleteOrder = async (orderId) => {
    try {
      const res = await fetch(`${API_URL}/admin/bookings/${orderId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Order deleted')
        setSelectedOrder(null)
        setAllOrders(prev => prev.filter(o => o._id !== orderId))
      } else toast.error('Delete failed')
    } catch { toast.error('Error') }
  }

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

  const handleTransition = async (orderId, targetStatus, extraBody = {}, opts = {}) => {
    setActionLoading(true)
    try {
      const res = await fetch(`${API_URL}/admin/bookings/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus, ...extraBody }),
      })
      if (res.ok) {
        toast.success(opts.keepOpen ? 'Location updated' : `→ ${targetStatus}`)
        if (!opts.keepOpen) setSelectedOrder(null)
      } else toast.error('Failed')
    } catch { toast.error('Error') }
    finally { setActionLoading(false) }
  }

  // ── Filtering ──────────────────────────────────────────────────────
  const filteredOrders = allOrders.filter(order => {
    const q = searchQuery.toLowerCase()
    const matchSearch =
      order.userName?.toLowerCase().includes(q) ||
      order.userMobile?.includes(q) ||
      order.userEmail?.toLowerCase().includes(q) ||
      order.bookingCode?.toLowerCase().includes(q)

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#22c55e', fontSize: 13, fontWeight: 600 }}>Closed</span>
        <button
          onClick={() => { setReopenNotes(''); setReopenTarget(order._id) }}
          style={{ fontSize: 11, fontWeight: 700, color: '#f97316', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 6, padding: '2px 9px', cursor: 'pointer' }}
        >Reopen</button>
      </div>
    )

    if (s === 'Reopened') return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#f97316', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 6, padding: '2px 8px' }}>Reopened</span>
        <button
          onClick={() => setIsReturnConfirming(order._id)}
          style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: '#1e1b4b', border: 'none', borderRadius: 6, padding: '2px 9px', cursor: 'pointer' }}
        >Return</button>
      </div>
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
              onClick={() => { setApproveLocation(pickupLocs[0]?.id || ''); setApproveTarget({ orderId: order._id, targetStatus: 'Approved' }) }}
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
    if (s === 'Closed')   map[s] = [{ label: 'Reopen Order', target: 'Reopened', needsNotes: true }]
    if (s === 'Reopened') map[s] = [{ label: 'Mark Returned', target: 'Returned', modal: true }, { label: 'Close Order', target: 'Closed', primary: true }]

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
              else if (a.needsNotes) { setReopenNotes(''); setReopenTarget(order._id) }
              else if (a.target === 'Approved') { setApproveLocation(pickupLocs[0]?.id || ''); setApproveTarget({ orderId: order._id, targetStatus: 'Approved' }) }
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

  // ── Table columns ─────────────────────────────────────────────────
  const tableColumns = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 100,
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      defaultSortOrder: 'descend',
      render: d => (
        <span style={{ fontSize: 12, color: '#6b7280' }}>
          {new Date(d).toLocaleDateString('en-GB')}
        </span>
      ),
    },
    {
      title: 'Invoice #',
      dataIndex: 'bookingCode',
      key: 'bookingCode',
      width: 115,
      render: (code, record) => (
        <span
          style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: '#E5550F', cursor: 'pointer' }}
          onClick={e => { e.stopPropagation(); setSelectedOrder(record) }}
        >
          {code || '#' + record._id?.slice(-8).toUpperCase()}
        </span>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'userName',
      key: 'userName',
      width: 160,
      sorter: (a, b) => (a.userName || '').localeCompare(b.userName || ''),
      render: (name, record) => (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{name}</div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>{record.userMobile}</div>
        </div>
      ),
    },
    {
      title: 'Equipment',
      key: 'equipment',
      width: 190,
      render: (_, record) => {
        const items = record.items?.length ? record.items : [record.productId]
        return (
          <div>
            {items.slice(0, 2).map((item, i) => (
              <div key={i} style={{ fontSize: 12, color: '#374151', display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#d1d5db', flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item?.name || '—'}
                </span>
              </div>
            ))}
            {items.length > 2 && (
              <div style={{ fontSize: 11, color: '#9ca3af' }}>+{items.length - 2} more</div>
            )}
          </div>
        )
      },
    },
    {
      title: 'Rental Status',
      key: 'status',
      width: 180,
      render: (_, record) => <InlineStatus order={record} />,
    },
    {
      title: 'Payment',
      key: 'payment',
      width: 130,
      render: (_, record) => {
        const overdue = (record.pendingAmount || 0) > 0 && new Date(record.endDate) < new Date()
        const overdueDays = overdue
          ? Math.floor((new Date() - new Date(record.endDate)) / (1000 * 60 * 60 * 24))
          : 0
        if ((record.pendingAmount || 0) === 0 || record.paymentStatus === 'Fully Paid')
          return <span style={{ color: '#10b981', fontWeight: 700, fontSize: 12 }}>PAID</span>
        if (overdue)
          return <span style={{ color: '#ef4444', fontWeight: 700, fontSize: 12 }}>OVERDUE {overdueDays}d</span>
        if (record.paymentStatus === 'Advance Paid')
          return <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 12 }}>PARTIAL</span>
        return <span style={{ color: '#9ca3af', fontWeight: 700, fontSize: 12 }}>UNPAID</span>
      },
    },
    {
      title: 'Return Date',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 100,
      sorter: (a, b) => new Date(a.endDate) - new Date(b.endDate),
      render: d => (
        <span style={{ fontSize: 12, color: '#374151' }}>
          {new Date(d).toLocaleDateString('en-GB')}
        </span>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 95,
      sorter: (a, b) => (a.totalPrice || 0) - (b.totalPrice || 0),
      render: amt => <span style={{ fontWeight: 600, fontSize: 13 }}>₹{(amt || 0).toLocaleString()}</span>,
    },
    {
      title: 'Balance',
      dataIndex: 'pendingAmount',
      key: 'pendingAmount',
      width: 95,
      sorter: (a, b) => (a.pendingAmount || 0) - (b.pendingAmount || 0),
      render: amt => (
        <span style={{ fontWeight: 600, fontSize: 13, color: (amt || 0) > 0 ? '#ef4444' : '#10b981' }}>
          ₹{(amt || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Days',
      dataIndex: 'totalDays',
      key: 'totalDays',
      width: 60,
      sorter: (a, b) => (a.totalDays || 0) - (b.totalDays || 0),
      render: d => <span style={{ fontSize: 13, color: '#374151' }}>{d || 1}</span>,
    },
    {
      title: '',
      key: 'actions',
      width: 90,
      render: (_, record) => {
        const hasKyc = record.userKyc?.kycDocuments &&
          (record.userKyc.kycDocuments.aadhaarFront || record.userKyc.kycDocuments.panFront)
        return (
          <Space size={4} onClick={e => e.stopPropagation()}>
            <Tooltip title="View Details">
              <Button size="small" icon={<EyeOutlined />} onClick={() => setSelectedOrder(record)} />
            </Tooltip>
            {hasKyc && (
              <Tooltip title="KYC Docs">
                <Button size="small" icon={<SafetyCertificateOutlined />} onClick={() => setSelectedKycOrder(record)} />
              </Tooltip>
            )}
            {['Ready for Pickup', 'During Rental', 'Picked Up', 'Return Pending', 'Returned', 'Closed', 'Reopened', 'Active'].includes(record.status) && (
              <Tooltip title={record.pendingAmount > 0 ? `₹${record.pendingAmount?.toLocaleString()} pending` : 'Fully Paid'}>
                <Button size="small" style={{ fontWeight: 800 }} onClick={() => setPaymentTarget(record)}>₹</Button>
              </Tooltip>
            )}
          </Space>
        )
      },
    },
  ]

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

      {/* Order list table */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        border: '1px solid #f0f0f0',
      }}>
        <Table
          columns={tableColumns}
          dataSource={filteredOrders}
          rowKey="_id"
          size="small"
          scroll={{ x: 1280 }}
          pagination={{
            current: currentPage,
            pageSize,
            total: filteredOrders.length,
            onChange: (p, ps) => { setCurrentPage(p); setPageSize(ps) },
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} orders`,
            size: 'small',
            style: { padding: '10px 16px' },
          }}
          onRow={record => ({
            onClick: () => setSelectedOrder(record),
            style: { cursor: 'pointer' },
          })}
          locale={{
            emptyText: (
              <div style={{ padding: '60px 0', textAlign: 'center', color: '#d1d5db' }}>
                <FilterOutlined style={{ fontSize: 32, marginBottom: 12, display: 'block' }} />
                <div style={{ fontSize: 13, fontWeight: 600 }}>No orders match your filters</div>
              </div>
            ),
          }}
        />
      </div>

      {/* ── Order Detail Modal ───────────────────────────────────────── */}
      <Modal
        open={!!selectedOrder}
        onCancel={() => setSelectedOrder(null)}
        footer={null}
        width={1140}
        styles={{ body: { padding: '0 28px 28px' } }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 32 }}>
            <Space align="center" wrap>
              <span style={{ color: '#1e1b4b', fontWeight: 700, fontSize: 16 }}>Order Details</span>
              <Text type="secondary" style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700 }}>{selectedOrder?.bookingCode || '#' + selectedOrder?._id?.slice(-8).toUpperCase()}</Text>
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
              {selectedOrder?.createdAt && (
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Placed {new Date(selectedOrder.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Text>
              )}
            </Space>
            <Button
              icon={<PrinterOutlined />}
              size="small"
              onClick={() => printOrder(selectedOrder)}
              style={{ fontWeight: 600, fontSize: 12 }}
            >
              Print
            </Button>
            <Popconfirm
              title="Delete this order?"
              description="This permanently removes the order record. Cannot be undone."
              onConfirm={() => handleDeleteOrder(selectedOrder._id)}
              okText="Delete"
              okButtonProps={{ danger: true }}
            >
              <Button icon={<DeleteOutlined />} size="small" danger style={{ fontWeight: 600, fontSize: 12 }}>
                Delete
              </Button>
            </Popconfirm>
          </div>
        }
        destroyOnHidden
      >
        {selectedOrder && (() => {
          const MILESTONES = [
            { label: 'Submitted',  statuses: ['Request Submitted', 'KYC Pending'] },
            { label: 'KYC Done',   statuses: ['KYC Approved'] },
            { label: 'Approved',   statuses: ['Approved'] },
            { label: 'Ready',      statuses: ['Ready for Pickup'] },
            { label: 'Active',     statuses: ['Picked Up', 'During Rental', 'Return Pending', 'Active', 'Reopened'] },
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
                        <img src={getImageUrl(item?.productId?.imageUrl || item?.imageUrl)} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'contain', background: '#fff', border: '1px solid #f0f0f0', padding: 2, flexShrink: 0 }} />
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
                    {selectedOrder.reopenNotes && (
                      <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '10px 12px' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Reopen Notes</div>
                        <div style={{ fontSize: 12, color: '#9a3412' }}>{selectedOrder.reopenNotes}</div>
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
                    {selectedOrder.createdAt && (
                      <Descriptions.Item label="Order Placed">
                        {new Date(selectedOrder.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {' '}
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                  {(['Approved', 'Ready for Pickup', 'Picked Up', 'During Rental', 'Return Pending'].includes(selectedOrder.status)) && (
                    <div style={{ marginTop: 12, background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 10, padding: '10px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          📍 Pickup Location
                        </div>
                        <button
                          onClick={() => {
                            setApproveLocation(selectedOrder.pickupLocation || pickupLocs[0]?.id || '')
                            setApproveTarget({ orderId: selectedOrder._id, targetStatus: selectedOrder.status, keepOpen: true })
                          }}
                          style={{
                            fontSize: 11, fontWeight: 700, color: '#4338ca', background: 'none',
                            border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline',
                          }}
                        >
                          Change
                        </button>
                      </div>
                      {selectedOrder.pickupLocation ? (
                        <>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b' }}>
                            {pickupLocs.find(l => l.id === selectedOrder.pickupLocation)?.label || selectedOrder.pickupLocation}
                          </div>
                          <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>
                            {pickupLocs.find(l => l.id === selectedOrder.pickupLocation)?.address}
                          </div>
                        </>
                      ) : (
                        <div style={{ fontSize: 12, color: '#6366f1', fontStyle: 'italic' }}>
                          Not assigned yet — click Change to set
                        </div>
                      )}
                    </div>
                  )}
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

      {/* ── Reopen Notes Modal ──────────────────────────────────────── */}
      <Modal
        open={!!reopenTarget}
        onCancel={() => { setReopenTarget(null); setReopenNotes('') }}
        title={
          <Space>
            <span style={{ color: '#f97316', fontSize: 18, display: 'flex', alignItems: 'center' }}>
              <ExclamationCircleOutlined />
            </span>
            <span style={{ color: '#1e1b4b', fontWeight: 700 }}>Reopen Order</span>
          </Space>
        }
        okText="Confirm Reopen"
        okButtonProps={{ loading: actionLoading }}
        cancelText="Cancel"
        onOk={() => {
          handleTransition(reopenTarget, 'Reopened', reopenNotes.trim() ? { reopenNotes: reopenNotes.trim() } : {})
          setReopenTarget(null)
          setReopenNotes('')
        }}
        centered
        destroyOnHidden
      >
        <div style={{ paddingBlock: 8 }}>
          <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
            Optionally add a note explaining why this order is being reopened.
          </Text>
          <TextArea
            rows={4}
            autoFocus
            value={reopenNotes}
            onChange={e => setReopenNotes(e.target.value)}
            placeholder="e.g. Customer returned early, gear needs re-inspection, extended rental agreed..."
          />
        </div>
      </Modal>

      {/* ── Pickup Location Picker Modal ─────────────────────────────── */}
      <Modal
        open={!!approveTarget}
        onCancel={() => setApproveTarget(null)}
        title={
          <Space>
            <span style={{ color: '#6366f1', fontSize: 18, display: 'flex', alignItems: 'center' }}>
              <EnvironmentOutlined />
            </span>
            <span style={{ color: '#1e1b4b', fontWeight: 700 }}>Select Pickup Location</span>
          </Space>
        }
        okText={approveTarget?.keepOpen ? 'Update Location' : 'Confirm & Approve'}
        okButtonProps={{ style: { background: '#E5550F', borderColor: '#E5550F' }, loading: actionLoading }}
        cancelText="Cancel"
        onOk={async () => {
          const loc = pickupLocs.find(l => l.id === approveLocation)
          if (!loc) return
          const keepOpen = !!approveTarget?.keepOpen
          await handleTransition(
            approveTarget.orderId,
            approveTarget.targetStatus,
            { pickupLocation: loc.id },
            { keepOpen },
          )
          setApproveTarget(null)
          if (keepOpen) {
            setSelectedOrder(prev => prev ? { ...prev, pickupLocation: loc.id } : prev)
          }
        }}
        centered
        destroyOnHidden
      >
        <div style={{ paddingBlock: 12 }}>
          <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 16 }}>
            Choose the office where the customer will collect the equipment. They will be notified with this location.
          </Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pickupLocs.map(loc => (
              <div
                key={loc.id}
                onClick={() => setApproveLocation(loc.id)}
                style={{
                  border: `2px solid ${approveLocation === loc.id ? '#6366f1' : '#e5e7eb'}`,
                  borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
                  background: approveLocation === loc.id ? '#eef2ff' : '#fafafa',
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                  border: `2px solid ${approveLocation === loc.id ? '#6366f1' : '#d1d5db'}`,
                  background: approveLocation === loc.id ? '#6366f1' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {approveLocation === loc.id && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#1e1b4b', fontSize: 14 }}>{loc.label}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{loc.address}</div>
                </div>
              </div>
            ))}
          </div>
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
