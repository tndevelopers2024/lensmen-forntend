import { useState, useEffect } from 'react'
import {
  Input, Button, Modal, Typography, Radio, DatePicker, TimePicker, Image,
  Table, Space, Tooltip, Popconfirm, Select, InputNumber, Tag,
  Drawer, Form, Switch,
} from 'antd'
import {
  EyeOutlined, SafetyCertificateOutlined,
  ArrowRightOutlined, SearchOutlined, FilterOutlined, CloseOutlined,
  PrinterOutlined, EnvironmentOutlined, ExclamationCircleOutlined, DeleteOutlined,
  EditOutlined, PlusOutlined, InboxOutlined, UndoOutlined, CloseCircleOutlined, ShopOutlined,
  ApartmentOutlined,
} from '@ant-design/icons'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import { useSearchParams, useNavigate } from 'react-router-dom'
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
  'Cancelled':         { color: '#ef4444', bg: '#fef2f2', label: 'Cancelled' },
}

const cfg = (status) => STATUS_CFG[status] || { color: '#94a3b8', bg: '#f8fafc', label: status }

// ── Active rental statuses ───────────────────────────────────────────
const ACTIVE_STATUSES        = ['Picked Up', 'During Rental', 'Return Pending', 'Active', 'Request Submitted', 'KYC Pending', 'KYC Approved', 'Approved', 'Ready for Pickup', 'Reopened']
const RENTED_OUT_STATUSES    = ['Picked Up', 'During Rental', 'Return Pending', 'Active']
const READY_PICKUP_STATUSES  = ['Ready for Pickup', 'Approved']
const RETURNED_STATUSES      = ['Returned', 'Closed']
const UPCOMING_STATUSES      = ['Request Submitted', 'KYC Pending', 'KYC Approved', 'Approved']

// ── Main component ───────────────────────────────────────────────────
const OrdersMonitor = () => {
  const { allOrders, setAllOrders, refreshAllOrders, API_URL, products, fetchProducts, allUsers, fetchAdminData } = useGlobal()
  const pickupLocs = getAdminSettings().pickupLocations || []
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const orderIdParam = searchParams.get('orderId')

  const [selectedOrder,     setSelectedOrder]     = useState(null)
  const [searchQuery,       setSearchQuery]       = useState('')
  const [activeTab,         setActiveTab]         = useState('all')
  const [dateFilter,        setDateFilter]        = useState(null)
  const [currentPage,       setCurrentPage]       = useState(1)
  const [pageSize,          setPageSize]          = useState(10)
  const [isReturnConfirming,setIsReturnConfirming]= useState(null)  // full order object
  const [returnCondition,   setReturnCondition]   = useState('Good')
  const [isEarlyReturn,     setIsEarlyReturn]     = useState(false)
  const [actualReturnDate,  setActualReturnDate]  = useState(null)  // dayjs
  const [returnDateTime,    setReturnDateTime]    = useState(null)  // dayjs — exact return time
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
  const [cancelTarget,      setCancelTarget]      = useState(null)   // order object
  const [cancelReason,      setCancelReason]      = useState('')
  const [editingOrder,      setEditingOrder]      = useState(false)
  const [editItems,         setEditItems]         = useState([])
  const [editDates,         setEditDates]         = useState(null)   // [dayjs, dayjs]
  const [editSaving,        setEditSaving]        = useState(false)
  const [showArchive,       setShowArchive]       = useState(false)
  const [vendors,           setVendors]           = useState([])
  const [vendorTarget,      setVendorTarget]      = useState(null)  // { order, itemIndex }
  const [vendorForm,        setVendorForm]        = useState({ vendorId: '', vendorCost: '' })
  const [unitTarget,        setUnitTarget]        = useState(null)  // { itemIndex }
  const [unitOptions,       setUnitOptions]       = useState([])
  const [unitLoading,       setUnitLoading]       = useState(false)
  const [assigningUnit,     setAssigningUnit]     = useState(false)
  const [editingPrice,      setEditingPrice]      = useState(null)  // { itemIndex, value }
  const [adminNoteInput,    setAdminNoteInput]    = useState('')
  const [adminNoteSaving,   setAdminNoteSaving]   = useState(false)
  const [adminNoteAdding,   setAdminNoteAdding]   = useState(false)
  const [manualOrderOpen,   setManualOrderOpen]   = useState(false)
  const [manualOrderSaving, setManualOrderSaving] = useState(false)
  const [moItems,           setMoItems]           = useState([])
  const [moDates,           setMoDates]           = useState(null)   // [dayjs, dayjs]
  const [moCustomer,        setMoCustomer]        = useState({ name: '', email: '', mobile: '', address: '', accountType: 'Private' })
  const [moDiscount,        setMoDiscount]        = useState(0)
  const [moNotes,           setMoNotes]           = useState('')
  const [moGst,             setMoGst]             = useState(false)
  const [moUserSearch,      setMoUserSearch]      = useState('')

  // Sync selectedOrder with URL param
  useEffect(() => {
    if (!orderIdParam) { setSelectedOrder(null); return }
    if (!allOrders.length) return
    const order = allOrders.find(o => o._id === orderIdParam)
    if (order) setSelectedOrder(order)
  }, [allOrders, orderIdParam])

  useEffect(() => { if (products.length === 0) fetchProducts() }, [])
  useEffect(() => { if (allOrders.length === 0) refreshAllOrders() }, [])
  useEffect(() => { if (allUsers.length === 0) fetchAdminData('/admin/users') }, [])
  useEffect(() => {
    setAdminNoteInput('')
    setAdminNoteAdding(false)
  }, [selectedOrder?._id])
  useEffect(() => {
    fetch(`${API_URL}/vendors`).then(r => r.json()).then(setVendors).catch(() => {})
  }, [])

  const openEditMode = (order) => {
    setEditItems((order.items?.length ? order.items : [order.productId]).map(it => ({ ...it })))
    setEditDates([dayjs(order.startDate), dayjs(order.endDate)])
    setEditingOrder(true)
  }

  const saveOrderDetails = async () => {
    if (editItems.length === 0) { toast.error('Add at least one item'); return }
    setEditSaving(true)
    try {
      const res = await fetch(`${API_URL}/admin/bookings/${selectedOrder._id}/details`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: editItems,
          startDate: editDates[0].toDate(),
          endDate:   editDates[1].toDate(),
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        toast.success('Order updated')
        setAllOrders(prev => prev.map(o => o._id === updated._id ? updated : o))
        setSelectedOrder(updated)
        setEditingOrder(false)
      } else {
        toast.error('Update failed')
      }
    } catch { toast.error('Error') }
    finally { setEditSaving(false) }
  }

  const addAdminNote = async () => {
    if (!adminNoteInput.trim()) return
    setAdminNoteSaving(true)
    try {
      const res = await fetch(`${API_URL}/admin/bookings/${selectedOrder._id}/admin-notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: adminNoteInput }),
      })
      if (res.ok) {
        const updated = await res.json()
        setAllOrders(prev => prev.map(o => o._id === updated._id ? updated : o))
        setSelectedOrder(updated)
        setAdminNoteInput('')
        setAdminNoteAdding(false)
      } else {
        toast.error('Failed to save note')
      }
    } catch { toast.error('Error saving note') }
    finally { setAdminNoteSaving(false) }
  }

  const deleteAdminNote = async (index) => {
    try {
      const res = await fetch(`${API_URL}/admin/bookings/${selectedOrder._id}/admin-notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteIndex: index }),
      })
      if (res.ok) {
        const updated = await res.json()
        setAllOrders(prev => prev.map(o => o._id === updated._id ? updated : o))
        setSelectedOrder(updated)
      } else {
        toast.error('Failed to delete note')
      }
    } catch { toast.error('Error deleting note') }
  }

  const resetManualOrder = () => {
    setMoItems([]); setMoDates(null)
    setMoCustomer({ name: '', email: '', mobile: '', address: '', accountType: 'Private' })
    setMoDiscount(0); setMoNotes(''); setMoUserSearch(''); setMoGst(false)
  }

  const saveManualOrder = async () => {
    if (!moCustomer.name.trim()) { toast.error('Customer name is required'); return }
    if (moItems.length === 0) { toast.error('Add at least one item'); return }
    if (!moDates?.[0] || !moDates?.[1]) { toast.error('Select rental dates'); return }
    setManualOrderSaving(true)
    try {
      const days = Math.max(1, moDates[1].diff(moDates[0], 'day') + 1)
      const subtotal   = moItems.reduce((s, it) => s + (it.pricePerDay || 0) * (it.quantity || 1) * days, 0)
      const totalPrice = Math.max(0, subtotal - (moDiscount || 0))
      const res = await fetch(`${API_URL}/admin/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName:    moCustomer.name,
          userEmail:   moCustomer.email,
          userMobile:  moCustomer.mobile,
          userAddress: moCustomer.address,
          accountType: moCustomer.accountType,
          items:       moItems.map(it => ({ productId: it.productId, name: it.name, pricePerDay: it.pricePerDay, imageUrl: it.imageUrl, quantity: it.quantity || 1 })),
          startDate:   moDates[0].toDate(),
          endDate:     moDates[1].toDate(),
          totalDays:   days,
          totalPrice,
          discountAmount: moDiscount || 0,
          notes:       moNotes,
          gstEnabled:  moGst,
          gstRate:     18,
        }),
      })
      if (res.ok) {
        const newOrder = await res.json()
        toast.success(`Order ${newOrder.bookingCode} created`)
        setAllOrders(prev => [newOrder, ...prev])
        setManualOrderOpen(false)
        resetManualOrder()
      } else {
        const d = await res.json()
        toast.error(d.message || 'Failed to create order')
      }
    } catch { toast.error('Network error') }
    finally { setManualOrderSaving(false) }
  }

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
    const baseTotal   = order.totalPrice || (subTotal - discount)
    const gstEnabled  = order.gstEnabled || false
    const gstRate     = order.gstRate || 18
    const gstAmt      = gstEnabled ? +(baseTotal * gstRate / 100).toFixed(2) : 0
    const total       = +(baseTotal + gstAmt).toFixed(2)
    const balanceDue  = Math.max(0, total - (order.totalPaid || 0))

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
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #111; background: #fff; }
  .page { max-width: 780px; margin: 0 auto; padding: 24px 28px; border: 1px solid #ccc; }

  /* Compact header */
  .inv-header { display: flex; align-items: center; gap: 14px; border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 0; }
  .inv-header img { width: 52px; height: 52px; object-fit: contain; flex-shrink: 0; }
  .company-block { flex: 1; }
  .company-name { font-size: 14px; font-weight: 800; letter-spacing: 0.04em; margin-bottom: 2px; }
  .company-addr { font-size: 10px; line-height: 1.4; color: #444; }
  .invoice-ref { text-align: right; }
  .invoice-ref .inv-num { font-size: 16px; font-weight: 800; color: #111; }
  .invoice-ref .inv-meta { font-size: 10px; color: #555; margin-top: 3px; line-height: 1.6; }

  /* Bill To + Meta side by side */
  .info-row { display: flex; border: 1px solid #ccc; border-top: none; }
  .bill-to { flex: 1; padding: 8px 12px; border-right: 1px solid #ccc; }
  .bill-to-label { font-size: 9px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
  .bill-to-name { font-size: 13px; font-weight: 700; margin-bottom: 2px; }
  .bill-to-detail { font-size: 10px; color: #555; line-height: 1.5; }
  .inv-meta-box { width: 260px; padding: 8px 12px; }
  .inv-meta-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px; }
  .inv-meta-row .lbl { color: #666; }
  .inv-meta-row .val { font-weight: 600; }

  /* Items table */
  .items-table { width: 100%; border-collapse: collapse; }
  .items-table th { background: #e8e8e8; font-size: 11px; font-weight: 700; padding: 6px 8px; border: 1px solid #ccc; text-align: left; }
  .items-table th.r, .items-table td.r { text-align: right; }
  .items-table th.c, .items-table td.c { text-align: center; width: 28px; }
  .items-table td { padding: 5px 8px; border: 1px solid #ccc; font-size: 11px; vertical-align: top; }
  .items-table td .sub { font-size: 10px; color: #777; }

  /* Footer split */
  .footer-split { display: flex; border: 1px solid #ccc; border-top: none; }
  .footer-left { flex: 1; padding: 10px 10px; border-right: 1px solid #ccc; font-size: 11px; }
  .footer-right { width: 260px; font-size: 11px; }
  .totals-row { display: flex; justify-content: space-between; padding: 4px 10px; border-bottom: 1px solid #ccc; }
  .totals-row.bold { font-weight: 700; font-size: 12px; }
  .sig-box { padding: 10px; text-align: center; min-height: 60px; display: flex; flex-direction: column; justify-content: space-between; border-top: 1px solid #ccc; }

  @media print {
    body { margin: 0; }
    .page { border: none; padding: 16px; max-width: 100%; }
  }
</style>
</head><body>
<div class="page">

  <!-- Compact Header -->
  <div class="inv-header">
    <img src="${logoUrl}" alt="Lensmen Logo" />
    <div class="company-block">
      <div class="company-name">LENSMEN RENTALS</div>
      <div class="company-addr">
        Flat S3, 2nd floor, Sri Niketan Apt, Sasi Nagar Main Rd, Sasinagar (Old No.7, New No.16), near Anbu Hospital, Velachery, Chennai – 600042 &nbsp;|&nbsp; +91 90800 86600 &nbsp;|&nbsp; lensmen@live.com
      </div>
    </div>
    <div class="invoice-ref">
      <div class="inv-num">INVOICE</div>
      <div class="inv-meta">${invoiceNo}<br>${invoiceDate}</div>
    </div>
  </div>

  <!-- Bill To + Invoice Meta side by side -->
  <div class="info-row">
    <div class="bill-to">
      <div class="bill-to-label">Bill To</div>
      <div class="bill-to-name">${order.userGstBusinessName || order.userName || '—'}</div>
      ${order.userGstBusinessName && order.userGstBusinessName !== order.userName ? `<div style="font-size:11px;color:#555;margin-bottom:2px;">${order.userName}</div>` : ''}
      <div class="bill-to-detail">
        ${order.userMobile  ? order.userMobile + '<br>' : ''}
        ${order.userEmail   ? order.userEmail  + '<br>' : ''}
        ${order.userAddress ? order.userAddress + '<br>' : ''}
        ${order.userGstNumber ? `<span style="font-weight:700;color:#111;">GSTIN: ${order.userGstNumber}</span>` : ''}
      </div>
    </div>
    <div class="inv-meta-box">
      <div class="inv-meta-row"><span class="lbl">Invoice #</span><span class="val">${invoiceNo}</span></div>
      <div class="inv-meta-row"><span class="lbl">Invoice Date</span><span class="val">${invoiceDate}</span></div>
      <div class="inv-meta-row"><span class="lbl">Due Date</span><span class="val">${invoiceDate}</span></div>
      <div class="inv-meta-row"><span class="lbl">Terms</span><span class="val">Due on Receipt</span></div>
    </div>
  </div>

  <!-- Items Table -->
  <table class="items-table">
    <thead>
      <tr>
        <th class="c">#</th>
        <th>Item &amp; Description</th>
        <th class="r" style="width:50px">Qty</th>
        <th class="r" style="width:80px">Rate</th>
        <th class="r" style="width:85px">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item, i) => {
        const qty  = (item?.quantity || 1)
        const rate = (item?.pricePerDay || 0) * days
        const amt  = qty * rate
        return `<tr>
          <td class="c">${i + 1}</td>
          <td>${item?.name || 'Unknown'}<span class="sub"> &nbsp;${days} day${days !== 1 ? 's' : ''} rental</span></td>
          <td class="r">${qty}</td>
          <td class="r">${rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td class="r">${amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>`
      }).join('')}
    </tbody>
  </table>

  <!-- Footer split -->
  <div class="footer-split">
    <div class="footer-left">
      <div style="margin-bottom:6px;">
        <div style="font-size:10px;color:#555;margin-bottom:2px;">Total In Words</div>
        <div style="font-weight:700;font-style:italic;">${amountInWords(total)}</div>
      </div>
      <div style="margin-bottom:24px;">
        <div style="font-size:10px;color:#555;margin-bottom:2px;">Notes</div>
        <div>${order.notes || 'Thanks for your business.'}</div>
      </div>
      <div style="font-size:10px;color:#555;margin-top:6px;">Customer Signature.</div>
    </div>
    <div class="footer-right">
      <div class="totals-row">
        <span>Sub Total</span>
        <span>${baseTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
      ${discount > 0 ? `<div class="totals-row"><span>Discount</span><span>(-) ${discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>` : ''}
      ${gstEnabled ? `
      <div class="totals-row">
        <span>GST (${gstRate}%)</span>
        <span>${gstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>` : ''}
      <div class="totals-row bold" style="border-top:2px solid #111;">
        <span>Total${gstEnabled ? ' (Incl. GST)' : ''}</span>
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
        toast.success('Order moved to archive')
        setSelectedOrder(null); navigate('/admin/orders')
        setAllOrders(prev => prev.map(o => o._id === orderId ? { ...o, isArchived: true, archivedAt: new Date().toISOString() } : o))
      } else toast.error('Archive failed')
    } catch { toast.error('Error') }
  }

  const openUnitPicker = async (item, itemIndex) => {
    setUnitTarget({ item, itemIndex })
    setUnitLoading(true)
    try {
      const res = await fetch(
        `${API_URL}/products/${item.productId?._id || item.productId}/units/available` +
        (item.unitId ? `?currentUnitId=${item.unitId}` : '')
      )
      setUnitOptions(await res.json())
    } catch { toast.error('Could not load units') }
    finally { setUnitLoading(false) }
  }

  const handleAssignUnit = async (unitId) => {
    if (!unitTarget || !selectedOrder) return
    const unit = unitOptions.find(u => u._id === unitId)
    setAssigningUnit(true)
    try {
      const res = await fetch(`${API_URL}/admin/bookings/${selectedOrder._id}/item-unit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemIndex: unitTarget.itemIndex,
          unitId:    unitId || null,
          unitCode:  unit?.unitCode || '',
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(unitId ? `Unit ${unit?.unitCode} assigned` : 'Unit cleared')
        setAllOrders(prev => prev.map(o => o._id === data.booking._id ? data.booking : o))
        setSelectedOrder(data.booking)
        setUnitTarget(null)
        setUnitOptions([])
      } else { toast.error(data.message || 'Failed') }
    } catch { toast.error('Network error') }
    finally { setAssigningUnit(false) }
  }

  const handleAssignVendor = async () => {
    if (!vendorTarget) return
    const { order, itemIndex } = vendorTarget
    const vendor = vendors.find(v => v._id === vendorForm.vendorId)
    try {
      const res = await fetch(`${API_URL}/admin/bookings/${order._id}/item-vendor`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemIndex,
          vendorId:   vendorForm.vendorId || null,
          vendorName: vendor?.name || '',
          vendorCost: Number(vendorForm.vendorCost) || 0,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Vendor assigned')
        setAllOrders(prev => prev.map(o => o._id === data.booking._id ? data.booking : o))
        setSelectedOrder(data.booking)
        setVendorTarget(null)
        setVendorForm({ vendorId: '', vendorCost: '' })
      } else { toast.error(data.message || 'Failed') }
    } catch { toast.error('Network error') }
  }

  const savePriceEdit = async (itemIndex, newPrice) => {
    if (!selectedOrder) return
    const updatedItems = (selectedOrder.items?.length ? selectedOrder.items : [selectedOrder.productId]).map((it, idx) =>
      idx === itemIndex ? { ...it, pricePerDay: newPrice } : it
    )
    try {
      const res = await fetch(`${API_URL}/admin/bookings/${selectedOrder._id}/details`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedItems, startDate: selectedOrder.startDate, endDate: selectedOrder.endDate }),
      })
      if (res.ok) {
        const updated = await res.json()
        toast.success('Price updated')
        setAllOrders(prev => prev.map(o => o._id === updated._id ? updated : o))
        setSelectedOrder(updated)
      } else toast.error('Update failed')
    } catch { toast.error('Error') }
    finally { setEditingPrice(null) }
  }

  const handleSendReminder = async (order) => {
    try {
      const res = await fetch(`${API_URL}/admin/bookings/${order._id}/remind`, { method: 'POST' })
      if (res.ok) toast.success(`WhatsApp reminder sent to ${order.userName}`)
      else { const d = await res.json(); toast.error(d.message || 'Failed to send') }
    } catch { toast.error('Network error') }
  }

  const handleCancelOrder = async () => {
    if (!cancelTarget) return
    setActionLoading(true)
    try {
      const res = await fetch(`${API_URL}/admin/bookings/${cancelTarget._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelled', cancellationReason: cancelReason }),
      })
      if (res.ok) {
        const data = await res.json()
        const updated = data.booking || { ...cancelTarget, status: 'Cancelled', cancellationReason: cancelReason }
        setAllOrders(prev => prev.map(o => o._id === updated._id ? updated : o))
        setSelectedOrder(updated)
        toast.success('Order cancelled')
        setCancelTarget(null); setCancelReason('')
      } else toast.error('Failed to cancel order')
    } catch { toast.error('Error') }
    setActionLoading(false)
  }

  const handleRestoreOrder = async (orderId) => {
    try {
      const res = await fetch(`${API_URL}/admin/bookings/${orderId}/restore`, { method: 'PUT' })
      if (res.ok) {
        toast.success('Order restored')
        setAllOrders(prev => prev.map(o => o._id === orderId ? { ...o, isArchived: false, archivedAt: null } : o))
      } else toast.error('Restore failed')
    } catch { toast.error('Error') }
  }

  const handlePermanentDelete = async (orderId) => {
    try {
      const res = await fetch(`${API_URL}/admin/bookings/${orderId}/permanent`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Order permanently deleted')
        setAllOrders(prev => prev.filter(o => o._id !== orderId))
      } else toast.error('Delete failed')
    } catch { toast.error('Error') }
  }

  const handleGstToggle = async (val) => {
    // Optimistic update — reflect change instantly in UI
    const optimistic = { ...selectedOrder, gstEnabled: val, gstRate: selectedOrder.gstRate || 18 }
    setSelectedOrder(optimistic)
    setAllOrders(prev => prev.map(o => o._id === optimistic._id ? optimistic : o))
    try {
      const res = await fetch(`${API_URL}/admin/bookings/${selectedOrder._id}/details`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gstEnabled: val, gstRate: selectedOrder.gstRate || 18 }),
      })
      if (res.ok) {
        const updated = await res.json()
        // Merge — preserve gstEnabled in case old backend doesn't return it yet
        const merged = { ...updated, gstEnabled: val, gstRate: updated.gstRate || 18 }
        setSelectedOrder(merged)
        setAllOrders(prev => prev.map(o => o._id === merged._id ? merged : o))
        toast.success(val ? 'GST enabled' : 'GST disabled')
      } else {
        toast.error('Failed to save GST setting')
      }
    } catch { toast.error('Error updating GST') }
  }

  // ── API helpers ────────────────────────────────────────────────────
  const updateBookingStatus = async (id, newStatus, condition = 'Good', notes = '', extraBody = {}) => {
    try {
      const res = await fetch(`${API_URL}/admin/bookings/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, returnCondition: condition, returnNotes: notes, ...extraBody }),
      })
      if (res.ok) {
        const data = await res.json()
        const updated = data.booking || data
        if (updated && updated._id) {
          setAllOrders(prev => prev.map(o => o._id === updated._id ? { ...o, ...updated } : o))
          if (selectedOrder?._id === updated._id) setSelectedOrder(prev => ({ ...prev, ...updated }))
        }
        toast.success(`Marked as ${newStatus}`)
      }
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
        if (!opts.keepOpen) { setSelectedOrder(null); navigate('/admin/orders') }
      } else toast.error('Failed')
    } catch { toast.error('Error') }
    finally { setActionLoading(false) }
  }

  // ── Filtering ──────────────────────────────────────────────────────
  const activeOrders   = allOrders.filter(o => !o.isArchived)
  const archivedOrders = allOrders.filter(o =>  o.isArchived)

  const filteredOrders = (showArchive ? archivedOrders : activeOrders).filter(order => {
    const q = searchQuery.toLowerCase()
    const matchSearch =
      order.userName?.toLowerCase().includes(q) ||
      order.userMobile?.includes(q) ||
      order.userEmail?.toLowerCase().includes(q) ||
      order.bookingCode?.toLowerCase().includes(q)

    if (showArchive) return matchSearch

    let matchTab = true
    if (activeTab === 'upcoming')  matchTab = UPCOMING_STATUSES.includes(order.status)
    if (activeTab === 'rented')    matchTab = RENTED_OUT_STATUSES.includes(order.status)
    if (activeTab === 'ready')     matchTab = READY_PICKUP_STATUSES.includes(order.status)
    if (activeTab === 'returned')  matchTab = RETURNED_STATUSES.includes(order.status)
    if (activeTab === 'due') {
      matchTab = RENTED_OUT_STATUSES.includes(order.status) &&
        new Date(order.endDate) < new Date()
    }

    const matchDate = !dateFilter?.[0] || !dateFilter?.[1] || (() => {
      const d = new Date(order.startDate)
      const from = dateFilter[0].startOf('day').toDate()
      const to   = dateFilter[1].endOf('day').toDate()
      return d >= from && d <= to
    })()

    return matchSearch && matchTab && matchDate
  })

  const counts = {
    all:      activeOrders.length,
    upcoming: activeOrders.filter(o => UPCOMING_STATUSES.includes(o.status)).length,
    rented:   activeOrders.filter(o => RENTED_OUT_STATUSES.includes(o.status)).length,
    ready:    activeOrders.filter(o => READY_PICKUP_STATUSES.includes(o.status)).length,
    returned: activeOrders.filter(o => RETURNED_STATUSES.includes(o.status)).length,
    due: activeOrders.filter(o =>
      RENTED_OUT_STATUSES.includes(o.status) && new Date(o.endDate) < new Date()
    ).length,
    archived: archivedOrders.length,
  }

  // ── Row: status badge only ─────────────────────────────────────────
  const InlineStatus = ({ order }) => {
    const { color, bg, label } = cfg(order.status)
    return (
      <span style={{
        fontSize: 12, fontWeight: 600, color,
        background: bg,
        border: `1px solid ${color}30`,
        borderRadius: 6, padding: '3px 10px',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
    )
  }

  // ── Detail modal action buttons ────────────────────────────────────
  const DetailActions = ({ order }) => {
    const s = order.status
    const items = order.items?.length ? order.items : []
    const unassignedItems = items.filter(it => !it.unitId)
    const allUnitsAssigned = unassignedItems.length === 0
    const paymentSettled = (order.pendingAmount || 0) <= 0

    const UNIT_REQUIRED_TARGETS    = new Set(['Ready for Pickup', 'During Rental'])
    const PAYMENT_REQUIRED_TARGETS = new Set(['Closed'])

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
        {!allUnitsAssigned && UNIT_REQUIRED_TARGETS.has(actions.find(a => UNIT_REQUIRED_TARGETS.has(a.target))?.target) && (
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#92400e' }}>
            ⚠ Assign a unit to all items before proceeding:
            <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
              {unassignedItems.map((it, i) => <li key={i}>{it.name}</li>)}
            </ul>
          </div>
        )}
        {!paymentSettled && actions.some(a => PAYMENT_REQUIRED_TARGETS.has(a.target)) && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#991b1b' }}>
            ⚠ Payment not settled — ₹{(order.pendingAmount || 0).toLocaleString()} pending. Collect full payment before closing.
          </div>
        )}
        {actions.map(a => {
          const needsUnit    = UNIT_REQUIRED_TARGETS.has(a.target)
          const needsPayment = PAYMENT_REQUIRED_TARGETS.has(a.target)
          const blocked      = (needsUnit && !allUnitsAssigned) || (needsPayment && !paymentSettled)
          const tooltip      = needsUnit && !allUnitsAssigned
            ? 'Assign a unit to every item first'
            : needsPayment && !paymentSettled
              ? `Collect ₹${(order.pendingAmount || 0).toLocaleString()} pending payment first`
              : null
          const btn = (
            <Button
              key={a.label}
              type={a.primary ? 'primary' : 'default'}
              danger={a.danger}
              block
              disabled={blocked}
              loading={actionLoading}
              onClick={() => {
                if (a.modal) { setIsEarlyReturn(false); setActualReturnDate(null); setIsReturnConfirming(order) }
                else if (a.needsReason) { setRejectReason(''); setRejectTarget({ orderId: order._id, targetStatus: a.target }) }
                else if (a.needsNotes) { setReopenNotes(''); setReopenTarget(order._id) }
                else if (a.target === 'Approved') { setApproveLocation(pickupLocs[0]?.id || ''); setApproveTarget({ orderId: order._id, targetStatus: 'Approved' }) }
                else handleTransition(order._id, a.target)
              }}
            >{a.label}</Button>
          )
          return tooltip
            ? <Tooltip key={a.label} title={tooltip} placement="left">{btn}</Tooltip>
            : btn
        })}
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
      title: showArchive ? 'Archived On' : 'Date',
      dataIndex: showArchive ? 'archivedAt' : 'createdAt',
      key: 'date',
      width: 100,
      sorter: showArchive
        ? (a, b) => new Date(a.archivedAt) - new Date(b.archivedAt)
        : (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      defaultSortOrder: 'descend',
      render: d => (
        <span style={{ fontSize: 12, color: showArchive ? '#f59e0b' : '#6b7280' }}>
          {d ? new Date(d).toLocaleDateString('en-GB') : '—'}
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
          onClick={e => { e.stopPropagation(); setSelectedOrder(record); setSearchParams({ orderId: record._id }) }}
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
        const noPending = (record.pendingAmount || 0) === 0
        const hasPaid   = (record.totalPaid || 0) > 0
        if ((noPending && hasPaid) || record.paymentStatus === 'Fully Paid')
          return <span style={{ color: '#10b981', fontWeight: 700, fontSize: 12 }}>PAID</span>
        if (overdue)
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#ef4444', fontWeight: 700, fontSize: 12 }}>OVERDUE {overdueDays}d</span>
              <Tooltip title="Send WhatsApp reminder">
                <button
                  onClick={e => { e.stopPropagation(); handleSendReminder(record) }}
                  style={{
                    background: '#25d366', border: 'none', borderRadius: 6,
                    width: 22, height: 22, cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </button>
              </Tooltip>
            </div>
          )
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
      key: 'pendingAmount',
      width: 95,
      sorter: (a, b) => {
        const balA = Math.max(0, (a.totalPrice || 0) - (a.totalPaid || 0))
        const balB = Math.max(0, (b.totalPrice || 0) - (b.totalPaid || 0))
        return balA - balB
      },
      render: (_, record) => {
        const balance = Math.max(0, (record.totalPrice || 0) - (record.totalPaid || 0))
        return (
          <span style={{ fontWeight: 600, fontSize: 13, color: balance > 0 ? '#ef4444' : '#10b981' }}>
            ₹{balance.toLocaleString()}
          </span>
        )
      },
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
      width: showArchive ? 160 : 90,
      render: (_, record) => {
        if (showArchive) {
          return (
            <Space size={4} onClick={e => e.stopPropagation()}>
              <Tooltip title="Restore Order">
                <Button size="small" icon={<UndoOutlined />} style={{ color: '#10b981', borderColor: '#10b981' }}
                  onClick={() => handleRestoreOrder(record._id)} />
              </Tooltip>
              <Popconfirm
                title="Permanently delete?"
                description="This cannot be undone. The order will be gone forever."
                onConfirm={() => handlePermanentDelete(record._id)}
                okText="Delete Forever"
                okButtonProps={{ danger: true }}
              >
                <Tooltip title="Delete Forever">
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Tooltip>
              </Popconfirm>
            </Space>
          )
        }
        const hasKyc = record.userKyc?.kycDocuments &&
          (record.userKyc.kycDocuments.aadhaarFront || record.userKyc.kycDocuments.panFront)
        return (
          <Space size={4} onClick={e => e.stopPropagation()}>
            <Tooltip title="View Details">
              <Button size="small" icon={<EyeOutlined />} onClick={() => { setSelectedOrder(record); setSearchParams({ orderId: record._id }) }} />
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

  // ── Sub-modals (overlaid on both list view and detail view) ────────
  const subModals = () => (
    <>
      {/* Return Confirmation Modal */}
      {(() => {
        const order = isReturnConfirming
        if (!order) return null

        const scheduledEnd = order.endDate ? dayjs(order.endDate) : null
        const pickupDate   = order.startDate ? dayjs(order.startDate) : null
        const today        = dayjs()

        // Early return recalculation
        let actualDays = order.totalDays || 1
        let adjustedTotal = order.totalPrice || 0
        if (isEarlyReturn && actualReturnDate && pickupDate) {
          const s = pickupDate.startOf('day')
          const e = actualReturnDate.startOf('day')
          actualDays = Math.max(1, e.diff(s, 'day') + 1)
          const items = order.items?.length ? order.items : [{ pricePerDay: order.totalPrice / (order.totalDays || 1), quantity: 1 }]
          const subtotal = items.reduce((sum, it) => sum + (it.pricePerDay || 0) * (it.quantity || 1) * actualDays, 0)
          adjustedTotal = Math.max(0, subtotal - (order.discountAmount || 0))
        }
        // net balance: positive = refund owed to customer, negative = customer still owes
        const paid       = order.totalPaid || 0
        const netBalance = paid - adjustedTotal

        const earlyEnough = scheduledEnd && actualReturnDate && actualReturnDate.isBefore(scheduledEnd, 'day')

        return (
          <Modal
            open={!!isReturnConfirming}
            onCancel={() => { setIsReturnConfirming(null); setReturnCondition('Good'); setReturnNotes(''); setIsEarlyReturn(false); setActualReturnDate(null); setReturnDateTime(null) }}
            title={
              <Space>
                <span style={{ color: '#1e1b4b', fontWeight: 700 }}>Confirm Equipment Return</span>
                {order.bookingCode && <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>{order.bookingCode}</span>}
              </Space>
            }
            okText="Confirm Return"
            okButtonProps={{
              style: returnCondition === 'Bad'
                ? { background: '#ef4444', borderColor: '#ef4444' }
                : { background: '#10b981', borderColor: '#10b981' },
            }}
            onOk={() => {
              const extra = {
                ...(returnDateTime ? { returnedAt: returnDateTime.toISOString() } : {}),
                ...(isEarlyReturn && actualReturnDate
                  ? { isEarlyReturn: true, actualReturnDate: actualReturnDate.toISOString(), actualDays, adjustedTotal }
                  : {}),
              }
              updateBookingStatus(order._id, 'Returned', returnCondition, returnNotes, extra)
              setIsReturnConfirming(null)
              setReturnCondition('Good'); setReturnNotes('')
              setIsEarlyReturn(false); setActualReturnDate(null); setReturnDateTime(null)
            }}
            centered destroyOnHidden width={480}
          >
            <div style={{ paddingBlock: 8, display: 'flex', flexDirection: 'column', gap: 16 }}>

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
                      if (!t) { setReturnDateTime(prev => prev); return }
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
                {scheduledEnd && (
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                    Scheduled return: {scheduledEnd.format('DD/MM/YYYY HH:mm')}
                  </div>
                )}
              </div>

              {/* Condition */}
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

              {/* Early return toggle */}
              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isEarlyReturn ? 12 : 0 }}>
                  <div>
                    <Text strong style={{ fontSize: 13, color: '#1e1b4b' }}>Early Return?</Text>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>
                      Scheduled: {scheduledEnd ? scheduledEnd.format('DD/MM/YYYY') : '—'}
                    </div>
                  </div>
                  <button
                    onClick={() => { setIsEarlyReturn(v => !v); setActualReturnDate(null) }}
                    style={{
                      padding: '5px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12,
                      background: isEarlyReturn ? '#6366f1' : '#f3f4f6',
                      color: isEarlyReturn ? '#fff' : '#6b7280',
                    }}
                  >
                    {isEarlyReturn ? 'Yes — Early' : 'No — On Time'}
                  </button>
                </div>

                {isEarlyReturn && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <Text style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Actual Return Date</Text>
                      <DatePicker
                        style={{ width: '100%' }}
                        value={actualReturnDate}
                        onChange={d => setActualReturnDate(d)}
                        format="DD/MM/YYYY"
                        placeholder="Select actual return date"
                        allowClear
                      />
                    </div>

                    {actualReturnDate && (
                      <div style={{ background: earlyEnough ? (netBalance >= 0 ? '#f0fdf4' : '#fff7ed') : '#fffbeb', border: `1px solid ${earlyEnough ? (netBalance >= 0 ? '#bbf7d0' : '#fed7aa') : '#fde68a'}`, borderRadius: 10, padding: '12px 14px' }}>
                        {earlyEnough ? (
                          <>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 8 }}>Price Adjustment</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <Text style={{ fontSize: 12, color: '#6b7280' }}>Original ({order.totalDays} days)</Text>
                              <Text style={{ fontSize: 12, fontWeight: 600 }}>₹{(order.totalPrice || 0).toLocaleString()}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <Text style={{ fontSize: 12, color: '#6b7280' }}>Adjusted ({actualDays} days)</Text>
                              <Text style={{ fontSize: 12, fontWeight: 700, color: '#1e1b4b' }}>₹{adjustedTotal.toLocaleString()}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                              <Text style={{ fontSize: 12, color: '#6b7280' }}>Already Paid</Text>
                              <Text style={{ fontSize: 12, fontWeight: 600, color: '#10b981' }}>₹{paid.toLocaleString()}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: `1px solid ${netBalance >= 0 ? '#bbf7d0' : '#fed7aa'}` }}>
                              {netBalance > 0 ? (
                                <>
                                  <Text style={{ fontSize: 13, fontWeight: 700, color: '#15803d' }}>Refund to Customer</Text>
                                  <Text style={{ fontSize: 14, fontWeight: 900, color: '#15803d' }}>₹{netBalance.toLocaleString()}</Text>
                                </>
                              ) : netBalance < 0 ? (
                                <>
                                  <Text style={{ fontSize: 13, fontWeight: 700, color: '#ea580c' }}>Balance to Collect</Text>
                                  <Text style={{ fontSize: 14, fontWeight: 900, color: '#ea580c' }}>₹{Math.abs(netBalance).toLocaleString()}</Text>
                                </>
                              ) : (
                                <>
                                  <Text style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>Fully Settled</Text>
                                  <Text style={{ fontSize: 14, fontWeight: 900, color: '#10b981' }}>✓</Text>
                                </>
                              )}
                            </div>
                          </>
                        ) : (
                          <div style={{ fontSize: 12, color: '#92400e', fontWeight: 600 }}>
                            ⚠ Selected date is not earlier than the scheduled return date — no price adjustment will be made.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Modal>
        )
      })()}

      {/* Edit Return Notes Modal */}
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

      {/* Payment Modal */}
      <PaymentModal
        open={!!paymentTarget}
        booking={paymentTarget}
        onClose={() => setPaymentTarget(null)}
        onSuccess={(updatedBooking) => {
          if (updatedBooking) {
            setAllOrders(prev => prev.map(o => o._id === updatedBooking._id ? updatedBooking : o))
            if (selectedOrder?._id === updatedBooking._id) setSelectedOrder(updatedBooking)
          }
          setPaymentTarget(null)
        }}
      />

      {/* Rejection Reason Modal */}
      <Modal
        open={!!rejectTarget}
        onCancel={() => { setRejectTarget(null); setRejectReason('') }}
        title={<Space><span style={{ color: '#ef4444', fontSize: 18, display: 'flex', alignItems: 'center' }}><CloseOutlined /></span><span style={{ color: '#1e1b4b', fontWeight: 700 }}>Reject Order</span></Space>}
        okText="Confirm Rejection"
        okButtonProps={{ danger: true, disabled: !rejectReason.trim(), loading: actionLoading }}
        onOk={() => { if (!rejectReason.trim()) return; handleTransition(rejectTarget.orderId, rejectTarget.targetStatus, { rejectionReason: rejectReason.trim() }) }}
        centered destroyOnHidden
      >
        <div style={{ paddingBlock: 8 }}>
          <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>Let the customer know why this order is being rejected. This message will be shared with them.</Text>
          <TextArea rows={4} autoFocus value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="e.g. KYC document is blurry, requested dates unavailable, gear under maintenance..." />
        </div>
      </Modal>

      {/* Reopen Notes Modal */}
      <Modal
        open={!!reopenTarget}
        onCancel={() => { setReopenTarget(null); setReopenNotes('') }}
        title={<Space><span style={{ color: '#f97316', fontSize: 18, display: 'flex', alignItems: 'center' }}><ExclamationCircleOutlined /></span><span style={{ color: '#1e1b4b', fontWeight: 700 }}>Reopen Order</span></Space>}
        okText="Confirm Reopen"
        okButtonProps={{ loading: actionLoading }}
        onOk={() => { handleTransition(reopenTarget, 'Reopened', reopenNotes.trim() ? { reopenNotes: reopenNotes.trim() } : {}); setReopenTarget(null); setReopenNotes('') }}
        centered destroyOnHidden
      >
        <div style={{ paddingBlock: 8 }}>
          <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>Optionally add a note explaining why this order is being reopened.</Text>
          <TextArea rows={4} autoFocus value={reopenNotes} onChange={e => setReopenNotes(e.target.value)} placeholder="e.g. Customer returned early, gear needs re-inspection, extended rental agreed..." />
        </div>
      </Modal>

      {/* Assign Unit Modal */}
      <Modal
        open={!!unitTarget}
        onCancel={() => { setUnitTarget(null); setUnitOptions([]) }}
        footer={null}
        width={400}
        centered
        destroyOnHidden
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ApartmentOutlined style={{ color: '#3730a3' }} />
            <span style={{ color: '#1e1b4b', fontWeight: 700 }}>
              Assign Unit — {unitTarget && selectedOrder?.items?.[unitTarget.itemIndex]?.name}
            </span>
          </div>
        }
      >
        {unitLoading ? (
          <div style={{ textAlign: 'center', padding: 32 }}><span>Loading units…</span></div>
        ) : unitOptions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>
            No available units for this product.<br />
            <span style={{ fontSize: 12 }}>Add units from Inventory → Products → Unit IDs.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBlock: 8 }}>
            {/* Clear option */}
            {unitTarget && selectedOrder?.items?.[unitTarget.itemIndex]?.unitCode && (
              <button
                onClick={() => handleAssignUnit(null)}
                disabled={assigningUnit}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px dashed #d1d5db', background: '#fafafa', cursor: 'pointer', textAlign: 'left', color: '#6b7280', fontSize: 12 }}
              >
                ✕ Clear unit assignment
              </button>
            )}
            {unitOptions.map(unit => {
              const isCurrent = unit._id === unitTarget && selectedOrder?.items?.[unitTarget?.itemIndex]?.unitId
              const statusColor = { available: '#10b981', rented: '#3b82f6', maintenance: '#f59e0b', damaged: '#ef4444' }[unit.status] || '#9ca3af'
              return (
                <button key={unit._id}
                  onClick={() => handleAssignUnit(unit._id)}
                  disabled={assigningUnit}
                  style={{
                    padding: '10px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    border: `1px solid ${isCurrent ? '#c7d2fe' : '#e5e7eb'}`,
                    background: isCurrent ? '#eef2ff' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, color: '#1e1b4b', fontFamily: 'monospace', fontSize: 14 }}>{unit.unitCode}</div>
                    {unit.serialNumber && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>SN: {unit.serialNumber}</div>}
                    {unit.notes && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{unit.notes}</div>}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, background: statusColor + '18', padding: '2px 8px', borderRadius: 10 }}>
                    {unit.status}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </Modal>

      {/* Assign Vendor Modal */}
      <Modal
        open={!!vendorTarget}
        onCancel={() => { setVendorTarget(null); setVendorForm({ vendorId: '', vendorCost: '' }) }}
        title={
          <Space>
            <ShopOutlined style={{ color: '#7c3aed', fontSize: 16 }} />
            <span style={{ color: '#1e1b4b', fontWeight: 700 }}>
              Assign Vendor — {vendorTarget && selectedOrder?.items?.[vendorTarget.itemIndex]?.name}
            </span>
          </Space>
        }
        okText="Assign"
        okButtonProps={{ style: { background: '#7c3aed', borderColor: '#7c3aed' } }}
        onOk={handleAssignVendor}
        centered destroyOnHidden width={440}
      >
        <div style={{ paddingBlock: 8, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Vendor</div>
            <Select
              showSearch
              allowClear
              placeholder="Select a vendor…"
              style={{ width: '100%' }}
              size="large"
              value={vendorForm.vendorId || undefined}
              onChange={v => setVendorForm(f => ({ ...f, vendorId: v || '' }))}
              filterOption={(input, opt) => opt?.label?.toLowerCase().includes(input.toLowerCase())}
              options={[
                ...vendors.map(v => ({ value: v._id, label: `${v.name}${v.companyName ? ' · ' + v.companyName : ''}` })),
              ]}
            />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Vendor Cost (₹/day)</div>
            <InputNumber
              min={0} prefix="₹" size="large" style={{ width: '100%' }}
              placeholder="What you pay this vendor per day"
              value={vendorForm.vendorCost || undefined}
              onChange={v => setVendorForm(f => ({ ...f, vendorCost: v || '' }))}
            />
            {vendorForm.vendorCost && selectedOrder && (
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                Total vendor cost: ₹{(Number(vendorForm.vendorCost) * (selectedOrder.totalDays || 1)).toLocaleString()} for {selectedOrder.totalDays} day(s)
              </div>
            )}
          </div>
          {vendorTarget && selectedOrder?.items?.[vendorTarget.itemIndex]?.vendorName && (
            <div style={{ background: '#f3e8ff', border: '1px solid #e9d5ff', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#7c3aed' }}>
              Currently: <strong>{selectedOrder.items[vendorTarget.itemIndex].vendorName}</strong> @ ₹{selectedOrder.items[vendorTarget.itemIndex].vendorCost}/day.
              Clear Vendor field to remove.
            </div>
          )}
        </div>
      </Modal>

      {/* Cancel Order Modal */}
      <Modal
        open={!!cancelTarget}
        onCancel={() => { setCancelTarget(null); setCancelReason('') }}
        title={<Space><CloseCircleOutlined style={{ color: '#ef4444', fontSize: 18 }} /><span style={{ color: '#1e1b4b', fontWeight: 700 }}>Cancel Order</span></Space>}
        okText="Confirm Cancellation"
        okButtonProps={{ danger: true, loading: actionLoading }}
        onOk={handleCancelOrder}
        centered destroyOnHidden
      >
        <div style={{ paddingBlock: 8 }}>
          <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
            This will mark the order as <strong>Cancelled</strong>. Optionally add a reason for the cancellation.
          </Text>
          <TextArea
            rows={3} autoFocus
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            placeholder="e.g. Customer requested cancellation, equipment unavailable…"
          />
        </div>
      </Modal>

      {/* Pickup Location Picker Modal */}
      <Modal
        open={!!approveTarget}
        onCancel={() => setApproveTarget(null)}
        title={<Space><span style={{ color: '#6366f1', fontSize: 18, display: 'flex', alignItems: 'center' }}><EnvironmentOutlined /></span><span style={{ color: '#1e1b4b', fontWeight: 700 }}>Select Pickup Location</span></Space>}
        okText={approveTarget?.keepOpen ? 'Update Location' : 'Confirm & Approve'}
        okButtonProps={{ style: { background: '#E5550F', borderColor: '#E5550F' }, loading: actionLoading }}
        onOk={async () => {
          const loc = pickupLocs.find(l => l.id === approveLocation)
          if (!loc) return
          const keepOpen = !!approveTarget?.keepOpen
          await handleTransition(approveTarget.orderId, approveTarget.targetStatus, { pickupLocation: loc.id }, { keepOpen })
          setApproveTarget(null)
          if (keepOpen) setSelectedOrder(prev => prev ? { ...prev, pickupLocation: loc.id } : prev)
        }}
        centered destroyOnHidden
      >
        <div style={{ paddingBlock: 12 }}>
          <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 16 }}>Choose the office where the customer will collect the equipment. They will be notified with this location.</Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pickupLocs.map(loc => (
              <div key={loc.id} onClick={() => setApproveLocation(loc.id)}
                style={{ border: `2px solid ${approveLocation === loc.id ? '#6366f1' : '#e5e7eb'}`, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', background: approveLocation === loc.id ? '#eef2ff' : '#fafafa', transition: 'all 0.15s', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 2, border: `2px solid ${approveLocation === loc.id ? '#6366f1' : '#d1d5db'}`, background: approveLocation === loc.id ? '#6366f1' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

      {/* KYC Viewer Modal */}
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
                }}>Reject KYC</Button>
              <Button type="primary" style={{ background: '#10b981' }}
                onClick={async () => {
                  const uid = selectedKycOrder.userKyc?._id
                  if (!uid) return toast.error('User not found')
                  await fetch(`${API_URL}/admin/users/${uid}/kyc`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kycStatus: 'Approved' }) })
                  await handleTransition(selectedKycOrder._id, 'Approved')
                  setSelectedKycOrder(null)
                }}>Approve KYC</Button>
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
              {[{ name: 'Aadhaar Front', key: 'aadhaarFront' }, { name: 'Aadhaar Back', key: 'aadhaarBack' }, { name: 'PAN Front', key: 'panFront' }, { name: 'PAN Back', key: 'panBack' }].map(doc => {
                const url = selectedKycOrder.userKyc?.kycDocuments?.[doc.key]
                return (
                  <div key={doc.key} style={{ background: '#f9fafb', borderRadius: 12, padding: 12, border: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{doc.name}</Text>
                    {url
                      ? <Image src={url} alt={doc.name} height={160} style={{ objectFit: 'contain', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                      : <div style={{ width: '100%', height: 160, border: '2px dashed #e5e7eb', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d1d5db', fontSize: 12, fontWeight: 600 }}>Not Submitted</div>}
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
    </>
  )

  // ── Render ─────────────────────────────────────────────────────────

  // ── Full-page order detail view ────────────────────────────────────
  if (selectedOrder) {
    const MILESTONES = [
      { label: 'Submitted',  statuses: ['Request Submitted', 'KYC Pending'] },
      { label: 'KYC Done',   statuses: ['KYC Approved'] },
      { label: 'Approved',   statuses: ['Approved'] },
      { label: 'Ready',      statuses: ['Ready for Pickup'] },
      { label: 'Active',     statuses: ['Picked Up', 'During Rental', 'Return Pending', 'Active', 'Reopened'] },
      { label: 'Closed',     statuses: ['Returned', 'Closed'] },
    ]
    const isRejected = selectedOrder.status === 'Rejected'
    const activeIdx  = isRejected ? -1 : MILESTONES.findIndex(m => m.statuses.includes(selectedOrder.status))
    const trackPct   = activeIdx >= 0 ? (activeIdx / (MILESTONES.length - 1)) * 100 : 0
    const items      = selectedOrder.items?.length ? selectedOrder.items : [selectedOrder.productId]

    return (
      <div>
        {/* ── Page header ────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <Button
            icon={<ArrowRightOutlined style={{ transform: 'rotate(180deg)' }} />}
            onClick={() => { setSelectedOrder(null); setEditingOrder(false); navigate('/admin/orders') }}
            style={{ borderRadius: 8, fontWeight: 600 }}
          >
            Back to Orders
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ color: '#1e1b4b', fontWeight: 700, fontSize: 18 }}>Order Details</span>
            <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#6b7280' }}>
              {selectedOrder.bookingCode || '#' + selectedOrder._id?.slice(-8).toUpperCase()}
            </span>
            <Tooltip title="Internal Order ID">
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#9ca3af', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 4, padding: '2px 6px', letterSpacing: '0.02em' }}>
                ID: {selectedOrder._id}
              </span>
            </Tooltip>
          </div>
          <div style={{ flex: 1 }} />
          <span style={{
            fontSize: 12, fontWeight: 700,
            color: cfg(selectedOrder.status).color,
            background: cfg(selectedOrder.status).bg,
            border: `1px solid ${cfg(selectedOrder.status).color}30`,
            borderRadius: 6, padding: '3px 10px',
          }}>
            {cfg(selectedOrder.status).label}
          </span>
          <Button icon={<PrinterOutlined />} onClick={() => printOrder(selectedOrder)}>Print</Button>
        </div>

        {/* ── Status stepper ─────────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0', padding: '20px 32px', marginBottom: 20 }}>
          {isRejected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#ef4444', fontSize: 18, fontWeight: 700 }}>✕</span>
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#991b1b', fontSize: 14 }}>Rental Request Rejected</div>
                {selectedOrder.rejectionReason && (
                  <div style={{ fontSize: 12, color: '#b91c1c', marginTop: 2 }}>Reason: <em>"{selectedOrder.rejectionReason}"</em></div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ position: 'relative', padding: '0 0 8px' }}>
              <div style={{ position: 'absolute', left: '4%', right: '4%', top: 17, height: 3, background: '#e5e7eb', borderRadius: 2, zIndex: 0 }} />
              <div style={{ position: 'absolute', left: '4%', top: 17, height: 3, background: 'linear-gradient(90deg, #10b981, #1e1b4b)', borderRadius: 2, zIndex: 1, width: `${trackPct * 0.92}%`, transition: 'width 0.5s ease' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                {MILESTONES.map((m, i) => {
                  const done = i < activeIdx; const active = i === activeIdx
                  const isLast = i === MILESTONES.length - 1
                  const showCheck = done || (active && isLast)
                  return (
                    <div key={m.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: showCheck ? '#10b981' : active ? '#1e1b4b' : '#fff', border: showCheck || active ? 'none' : '2px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: showCheck || active ? '#fff' : '#d1d5db', boxShadow: active ? '0 0 0 5px rgba(30,27,75,0.12)' : showCheck ? '0 0 0 3px rgba(16,185,129,0.15)' : 'none' }}>
                        {showCheck ? '✓' : i + 1}
                      </div>
                      <span style={{ fontSize: 9, fontWeight: active ? 700 : done ? 600 : 500, color: showCheck ? '#10b981' : active ? '#1e1b4b' : '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                        {m.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── 2-column layout ────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

          {/* ── LEFT: Equipment + Notes ────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Info cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {/* Customer */}
              <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Customer</div>
                <div style={{ fontWeight: 700, color: '#1e1b4b', fontSize: 15 }}>{selectedOrder.userName}</div>
                {selectedOrder.userMobile  && <div style={{ color: '#E5550F', fontSize: 13, marginTop: 3 }}>{selectedOrder.userMobile}</div>}
                {selectedOrder.userEmail   && <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>{selectedOrder.userEmail}</div>}
                {selectedOrder.userAddress && <div style={{ color: '#9ca3af', fontSize: 11, marginTop: 2 }}>{selectedOrder.userAddress}</div>}
              </div>
              {/* Rental Period */}
              <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Rental Period</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700 }}>PICKUP</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b' }}>{new Date(selectedOrder.startDate).toLocaleDateString('en-GB')}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{new Date(selectedOrder.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <ArrowRightOutlined style={{ color: '#d1d5db', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700 }}>RETURN</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b' }}>{new Date(selectedOrder.endDate).toLocaleDateString('en-GB')}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{new Date(selectedOrder.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>Duration</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#E5550F' }}>
                    {selectedOrder.actualDays || selectedOrder.totalDays || 1} Day(s)
                    {selectedOrder.isEarlyReturn && (
                      <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: '#6366f1', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 4, padding: '1px 6px' }}>
                        Early Return
                      </span>
                    )}
                  </span>
                </div>
                {selectedOrder.createdAt && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Placed</span>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>
                      {new Date(selectedOrder.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}{' '}
                      {new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
                {selectedOrder.isEarlyReturn && (() => {
                  const paid    = selectedOrder.totalPaid || 0
                  const owed    = selectedOrder.totalPrice || 0
                  const balance = paid - owed   // positive = refund, negative = still owes
                  if (balance > 0) return (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: '#15803d', fontWeight: 700 }}>Refund Due</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#15803d' }}>₹{balance.toLocaleString()}</span>
                    </div>
                  )
                  if (balance < 0) return (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: '#E5550F', fontWeight: 700 }}>Balance to Collect</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#E5550F' }}>₹{Math.abs(balance).toLocaleString()}</span>
                    </div>
                  )
                  return (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: '#10b981', fontWeight: 700 }}>Fully Settled</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#10b981' }}>✓</span>
                    </div>
                  )
                })()}
                {(['Approved', 'Ready for Pickup', 'Picked Up', 'During Rental', 'Return Pending'].includes(selectedOrder.status)) && selectedOrder.pickupLocation && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #e5e7eb', fontSize: 12 }}>
                    <span style={{ color: '#4338ca', fontWeight: 700 }}>📍 </span>
                    <span style={{ color: '#1e1b4b', fontWeight: 600 }}>
                      {pickupLocs.find(l => l.id === selectedOrder.pickupLocation)?.label || selectedOrder.pickupLocation}
                    </span>
                    {(['Approved', 'Ready for Pickup', 'Picked Up', 'During Rental', 'Return Pending'].includes(selectedOrder.status)) && (
                      <button onClick={() => { setApproveLocation(selectedOrder.pickupLocation || pickupLocs[0]?.id || ''); setApproveTarget({ orderId: selectedOrder._id, targetStatus: selectedOrder.status, keepOpen: true }) }}
                        style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: '#4338ca', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>Change</button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Equipment table (edit mode or view mode) */}
            {editingOrder ? (
              <div style={{ background: '#fff', border: '2px solid #6366f1', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: '#6366f1' }}>
                  <Text style={{ fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>Edit Equipment & Dates</Text>
                  <button onClick={() => setEditingOrder(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 14 }}>✕ Cancel</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 }}>Pickup Date & Time</div>
                    <DatePicker showTime={{ format: 'HH:mm' }} format="DD/MM/YYYY HH:mm" value={editDates?.[0]} onChange={d => setEditDates(prev => [d, prev?.[1]])} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 }}>Return Date & Time</div>
                    <DatePicker showTime={{ format: 'HH:mm' }} format="DD/MM/YYYY HH:mm" value={editDates?.[1]} onChange={d => setEditDates(prev => [prev?.[0], d])} style={{ width: '100%' }} />
                  </div>
                </div>
                {editItems.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #f9fafb', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <img src={getImageUrl(item?.imageUrl)} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'contain', border: '1px solid #f0f0f0', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1e1b4b' }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>₹{item.pricePerDay}/day</div>
                    </div>
                    <InputNumber min={1} max={20} size="small" value={item.quantity || 1} onChange={v => setEditItems(prev => prev.map((it, idx) => idx === i ? { ...it, quantity: v || 1 } : it))} style={{ width: 70 }} />
                    <button onClick={() => setEditItems(prev => prev.filter((_, idx) => idx !== i))} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, color: '#ef4444', fontSize: 12, fontWeight: 700, padding: '4px 10px', cursor: 'pointer' }}>Remove</button>
                  </div>
                ))}
                <div style={{ padding: '10px 16px', borderBottom: '1px solid #f0f0f0' }}>
                  <Select showSearch placeholder="Add a product..." style={{ width: '100%' }}
                    filterOption={(input, opt) => opt.label.toLowerCase().includes(input.toLowerCase())}
                    options={products.filter(p => !editItems.find(it => String(it.productId) === String(p._id))).map(p => ({ value: p._id, label: `${p.name} — ₹${p.pricePerDay}/day` }))}
                    value={null}
                    onChange={pid => { const p = products.find(x => x._id === pid); if (p) setEditItems(prev => [...prev, { productId: p._id, name: p.name, pricePerDay: p.pricePerDay, imageUrl: p.imageUrl, quantity: 1 }]) }}
                  />
                </div>
                <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <Button onClick={() => setEditingOrder(false)}>Cancel</Button>
                  <Button type="primary" loading={editSaving} onClick={saveOrderDetails} style={{ background: '#6366f1', borderColor: '#6366f1' }}>Save Changes</Button>
                </div>
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 56px 130px', padding: '10px 16px', background: '#1e1b4b' }}>
                  {['Equipment', 'Rate/Day', 'Qty', 'Amount'].map(h => (
                    <Text key={h} style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase' }}>{h}</Text>
                  ))}
                </div>
                {items.map((item, i) => (
                  <div key={i} style={{ padding: '10px 16px', background: i % 2 === 0 ? '#fff' : '#fafafa', borderTop: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 60px 100px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img src={getImageUrl(item?.productId?.imageUrl || item?.imageUrl)} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'contain', background: '#f9fafb', border: '1px solid #f0f0f0', padding: 2, flexShrink: 0 }} />
                        <div>
                          <Text style={{ fontWeight: 600, color: '#1e1b4b', fontSize: 14 }}>{item?.name || '—'}</Text>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                            {item?.unitCode && (
                              <span style={{
                                fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
                                background: '#eef2ff', color: '#3730a3',
                                border: '1px solid #c7d2fe', borderRadius: 4,
                                padding: '1px 6px', letterSpacing: '0.04em',
                              }}>
                                {item.unitCode}
                              </span>
                            )}
                            {item?.vendorName && (
                              <>
                                <Tag color="purple" style={{ fontSize: 10, padding: '0 5px', lineHeight: '16px', margin: 0 }}>VENDOR</Tag>
                                <span style={{ fontSize: 11, color: '#7c3aed' }}>{item.vendorName}</span>
                                <span style={{ fontSize: 11, color: '#9ca3af' }}>· ₹{item.vendorCost}/day</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {editingPrice?.itemIndex === i ? (
                        <InputNumber
                          min={0} size="small" prefix="₹" autoFocus
                          value={editingPrice.value}
                          onChange={v => setEditingPrice(p => ({ ...p, value: v ?? 0 }))}
                          onBlur={() => savePriceEdit(i, editingPrice.value)}
                          onPressEnter={() => savePriceEdit(i, editingPrice.value)}
                          style={{ width: 90 }}
                        />
                      ) : (
                        <Tooltip title="Click to edit price">
                          <div
                            onClick={() => setEditingPrice({ itemIndex: i, value: item?.pricePerDay || 0 })}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                          >
                            <Text style={{ fontSize: 13, color: '#6b7280' }}>₹{(item?.pricePerDay || 0).toLocaleString()}</Text>
                            <EditOutlined style={{ fontSize: 10, color: '#d1d5db' }} />
                          </div>
                        </Tooltip>
                      )}
                      <Text style={{ fontSize: 13, color: '#6b7280' }}>{item?.quantity || 1}</Text>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontWeight: 700, color: '#1e1b4b', fontSize: 14, whiteSpace: 'nowrap' }}>
                          ₹{((item?.pricePerDay || 0) * (item?.quantity || 1) * (selectedOrder.totalDays || 1)).toLocaleString()}
                        </Text>
                        <Tooltip title={item?.unitCode ? `Unit: ${item.unitCode} — click to change` : 'Assign unit ID'}>
                          <button
                            onClick={() => openUnitPicker(item, i)}
                            style={{
                              width: 22, height: 22, borderRadius: 5,
                              border: `1px solid ${item?.unitCode ? '#c7d2fe' : '#e5e7eb'}`,
                              background: item?.unitCode ? '#eef2ff' : '#fafafa',
                              cursor: 'pointer', fontSize: 11,
                              color: item?.unitCode ? '#3730a3' : '#9ca3af',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}
                          >
                            <ApartmentOutlined />
                          </button>
                        </Tooltip>
                        <Tooltip title={item?.vendorName ? 'Change vendor' : 'Assign vendor'}>
                          <button
                            onClick={() => {
                              setVendorTarget({ order: selectedOrder, itemIndex: i })
                              setVendorForm({ vendorId: item?.vendorId || '', vendorCost: item?.vendorCost || '' })
                            }}
                            style={{
                              width: 22, height: 22, borderRadius: 5, border: '1px solid #e9d5ff',
                              background: item?.vendorName ? '#f3e8ff' : '#fafafa',
                              cursor: 'pointer', fontSize: 11, color: '#7c3aed',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}
                          >
                            <ShopOutlined />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Notes */}
            {(selectedOrder.notes || selectedOrder.reopenNotes || selectedOrder.cancellationReason) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedOrder.notes && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', marginBottom: 3 }}>Customer Notes</div>
                    <div style={{ fontSize: 13, color: '#78350f' }}>{selectedOrder.notes}</div>
                  </div>
                )}
                {selectedOrder.reopenNotes && (
                  <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#c2410c', textTransform: 'uppercase', marginBottom: 3 }}>Reopen Notes</div>
                    <div style={{ fontSize: 13, color: '#9a3412' }}>{selectedOrder.reopenNotes}</div>
                  </div>
                )}
                {selectedOrder.cancellationReason && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', marginBottom: 3 }}>Cancellation Reason</div>
                    <div style={{ fontSize: 13, color: '#7f1d1d' }}>{selectedOrder.cancellationReason}</div>
                  </div>
                )}
              </div>
            )}

            {/* Admin Notes */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Admin Notes {(selectedOrder.adminNotes?.length > 0) && <span style={{ color: '#6366f1' }}>({selectedOrder.adminNotes.length})</span>}
                </div>
                {!adminNoteAdding && (
                  <button
                    onClick={() => setAdminNoteAdding(true)}
                    style={{ fontSize: 12, fontWeight: 600, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    + Add Note
                  </button>
                )}
              </div>

              {/* Existing notes list */}
              {(selectedOrder.adminNotes?.length > 0) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: adminNoteAdding ? 12 : 0 }}>
                  {[...selectedOrder.adminNotes].reverse().map((note, revIdx) => {
                    const realIdx = selectedOrder.adminNotes.length - 1 - revIdx
                    const d = new Date(note.createdAt)
                    const timeStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    return (
                      <div key={realIdx} style={{ background: '#f8fafc', borderRadius: 8, padding: '9px 12px', border: '1px solid #e5e7eb', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap', lineHeight: 1.6, flex: 1 }}>{note.text}</div>
                          <Popconfirm title="Delete this note?" onConfirm={() => deleteAdminNote(realIdx)} okText="Delete" okButtonProps={{ danger: true }} placement="left">
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', padding: 0, fontSize: 13, flexShrink: 0, lineHeight: 1 }}>✕</button>
                          </Popconfirm>
                        </div>
                        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 5 }}>{timeStr}</div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* No notes state */}
              {!selectedOrder.adminNotes?.length && !adminNoteAdding && (
                <div style={{ fontSize: 13, color: '#d1d5db', fontStyle: 'italic' }}>No admin notes yet.</div>
              )}

              {/* Add note input */}
              {adminNoteAdding && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <TextArea
                    value={adminNoteInput}
                    onChange={e => setAdminNoteInput(e.target.value)}
                    placeholder="Type a note..."
                    autoSize={{ minRows: 2, maxRows: 6 }}
                    style={{ borderRadius: 8, fontSize: 13 }}
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addAdminNote() }}
                  />
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <Button size="small" onClick={() => { setAdminNoteInput(''); setAdminNoteAdding(false) }}>Cancel</Button>
                    <Button size="small" type="primary" loading={adminNoteSaving} onClick={addAdminNote} style={{ background: '#6366f1', borderColor: '#6366f1' }}>Save Note</Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Revenue + Actions ────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Revenue card */}
            <div style={{ background: '#1e1b4b', borderRadius: 14, padding: '20px 20px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ fontSize: 11, color: '#93c5fd', fontWeight: 700 }}>
                  {selectedOrder.gstEnabled ? 'TOTAL (INCL. GST)' : 'TOTAL REVENUE'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                  <span style={{ fontSize: 10, color: '#93c5fd' }}>GST</span>
                  <Switch
                    size="small"
                    checked={!!selectedOrder.gstEnabled}
                    onChange={handleGstToggle}
                  />
                </div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                ₹{(() => {
                  const base = selectedOrder.totalPrice || 0
                  if (!selectedOrder.gstEnabled) return base.toLocaleString()
                  const rate = selectedOrder.gstRate || 18
                  return (+(base * (1 + rate / 100)).toFixed(2)).toLocaleString()
                })()}
              </div>
            </div>

            {/* Payment breakdown */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedOrder.gstEnabled && (() => {
                const base  = selectedOrder.totalPrice || 0
                const rate  = selectedOrder.gstRate || 18
                const gst   = +(base * rate / 100).toFixed(2)
                const grand = +(base + gst).toFixed(2)
                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 11, color: '#9ca3af' }}>Sub Total</Text>
                      <Text style={{ fontSize: 12 }}>₹{base.toLocaleString()}</Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 11, color: '#9ca3af' }}>GST ({rate}%)</Text>
                      <Text style={{ fontSize: 12 }}>₹{gst.toLocaleString()}</Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>
                      <Text style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>Grand Total</Text>
                      <Text style={{ fontSize: 12, fontWeight: 700 }}>₹{grand.toLocaleString()}</Text>
                    </div>
                  </>
                )
              })()}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>Collected</Text>
                <Text strong style={{ color: '#10b981' }}>₹{(selectedOrder.totalPaid || 0).toLocaleString()}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>Pending</Text>
                <Text strong style={{ color: (selectedOrder.pendingAmount || 0) > 0 ? '#ef4444' : '#10b981' }}>
                  ₹{(selectedOrder.pendingAmount || 0).toLocaleString()}
                </Text>
              </div>
              {(selectedOrder.payments || []).map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid #f0f0f0' }}>
                  <Text style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>{p.type} {p.mode}</Text>
                  <Text style={{ fontSize: 12, fontWeight: 600 }}>₹{p.amount?.toLocaleString()}</Text>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Button block onClick={() => setPaymentTarget(selectedOrder)} size="large">₹ Record Payment</Button>
              {(() => {
                const isOverdue = (selectedOrder.pendingAmount || 0) > 0 && new Date(selectedOrder.endDate) < new Date()
                if (!isOverdue) return null
                const days = Math.max(0, Math.floor((Date.now() - new Date(selectedOrder.endDate)) / 86400000))
                return (
                  <Button
                    block size="large"
                    onClick={() => handleSendReminder(selectedOrder)}
                    style={{ background: '#25d366', borderColor: '#25d366', color: '#fff', fontWeight: 700 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white" style={{ marginRight: 6, verticalAlign: 'middle' }}>
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Remind via WhatsApp ({days}d overdue)
                  </Button>
                )
              })()}
              <Button block icon={<SafetyCertificateOutlined />} onClick={() => setSelectedKycOrder(selectedOrder)} size="large">KYC Docs</Button>
              <Button block icon={<EditOutlined />} onClick={() => openEditMode(selectedOrder)} size="large" style={{ borderColor: '#6366f1', color: '#6366f1' }}>Edit Details</Button>
              <Popconfirm title="Move to Archive?" description="The order will be archived. You can restore it later from the Archive view." onConfirm={() => handleDeleteOrder(selectedOrder._id)} okText="Archive" okButtonProps={{ style: { background: '#f59e0b', borderColor: '#f59e0b' } }}>
                <Button block icon={<InboxOutlined />} size="large" style={{ borderColor: '#f59e0b', color: '#f59e0b' }}>Archive Order</Button>
              </Popconfirm>
              {!['Cancelled', 'Closed', 'Returned'].includes(selectedOrder.status) && (
                <Button
                  block danger size="large"
                  icon={<CloseCircleOutlined />}
                  onClick={() => { setCancelTarget(selectedOrder); setCancelReason('') }}
                >
                  Cancel Order
                </Button>
              )}
              <div style={{ marginTop: 4 }}>
                <DetailActions order={selectedOrder} />
              </div>
            </div>
          </div>
        </div>

      {subModals()}
      </div>
    )
  }

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
            <DatePicker.RangePicker
              placeholder={['From date', 'To date']}
              value={dateFilter}
              onChange={d => { setDateFilter(d); setCurrentPage(1) }}
              allowClear
              style={{ width: 240 }}
              format="DD MMM YYYY"
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => { resetManualOrder(); setManualOrderOpen(true) }}
              style={{ background: '#1e1b4b', borderColor: '#1e1b4b', fontWeight: 600 }}
            >
              New Order
            </Button>
          </Space>
        }
      />

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {!showArchive && (
          <>
            <TabPill id="all"      label="All Rentals" />
            <TabPill id="upcoming" label="Upcoming" />
            <TabPill id="ready"    label="Ready for Pickup" />
            <TabPill id="rented"   label="Rented Out" />
            <TabPill id="returned" label="Returned" />
            <TabPill id="due"      label="Due Orders" />
          </>
        )}
        <button
          onClick={() => { setShowArchive(v => !v); setCurrentPage(1); setSearchQuery('') }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 14px', borderRadius: 20, border: '1.5px solid',
            fontWeight: 700, fontSize: 12, cursor: 'pointer',
            borderColor: showArchive ? '#f59e0b' : '#e5e7eb',
            background: showArchive ? '#fffbeb' : '#fff',
            color: showArchive ? '#d97706' : '#6b7280',
            marginLeft: 'auto',
          }}
        >
          <InboxOutlined />
          Archive
          {counts.archived > 0 && (
            <span style={{ background: '#f59e0b', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
              {counts.archived}
            </span>
          )}
        </button>
      </div>

      {/* Archive banner */}
      {showArchive && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <InboxOutlined style={{ color: '#f59e0b', fontSize: 20 }} />
          <div>
            <div style={{ fontWeight: 700, color: '#92400e', fontSize: 14 }}>Archive View</div>
            <div style={{ fontSize: 12, color: '#b45309' }}>These orders have been archived. Restore them to make them active again, or permanently delete them.</div>
          </div>
        </div>
      )}

      {/* Order list table */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        border: showArchive ? '2px solid #fde68a' : '1px solid #f0f0f0',
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
            onClick: () => { if (!showArchive) { setSelectedOrder(record); setSearchParams({ orderId: record._id }) } },
            style: { cursor: showArchive ? 'default' : 'pointer', opacity: showArchive ? 0.8 : 1 },
          })}
          locale={{
            emptyText: (
              <div style={{ padding: '60px 0', textAlign: 'center', color: '#d1d5db' }}>
                <InboxOutlined style={{ fontSize: 32, marginBottom: 12, display: 'block' }} />
                <div style={{ fontSize: 13, fontWeight: 600 }}>{showArchive ? 'No archived orders' : 'No orders match your filters'}</div>
              </div>
            ),
          }}
        />
      </div>

      {subModals()}

      {/* ── Manual Order Drawer ─────────────────────────────────── */}
      <Drawer
        open={manualOrderOpen}
        onClose={() => setManualOrderOpen(false)}
        title={<span style={{ fontWeight: 700, color: '#1e1b4b' }}>Create Manual Order</span>}
        width={560}
        destroyOnHidden
        footer={
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button onClick={() => setManualOrderOpen(false)}>Cancel</Button>
            <Button type="primary" loading={manualOrderSaving} onClick={saveManualOrder}
              style={{ background: '#1e1b4b', borderColor: '#1e1b4b', fontWeight: 600 }}>
              Create Order
            </Button>
          </div>
        }
      >
        {/* Customer */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Customer</div>
          <Select
            showSearch placeholder="Search registered user..."
            style={{ width: '100%', marginBottom: 10 }}
            filterOption={false}
            onSearch={v => setMoUserSearch(v)}
            value={null}
            options={(allUsers || [])
              .filter(u => {
                const q = moUserSearch.toLowerCase()
                return !q || u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.mobile?.includes(q)
              })
              .slice(0, 20)
              .map(u => ({ value: u._id, label: `${u.fullName} — ${u.email || u.mobile}`, u }))
            }
            onChange={(_, opt) => {
              const u = opt?.u
              if (u) setMoCustomer({ name: u.fullName, email: u.email || '', mobile: u.mobile || '', address: u.address || '', accountType: u.accountType || 'Private' })
            }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Name *</div>
              <Input value={moCustomer.name} onChange={e => setMoCustomer(p => ({ ...p, name: e.target.value }))} placeholder="Customer name" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Mobile</div>
              <Input value={moCustomer.mobile} onChange={e => setMoCustomer(p => ({ ...p, mobile: e.target.value }))} placeholder="Phone number" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Email</div>
              <Input value={moCustomer.email} onChange={e => setMoCustomer(p => ({ ...p, email: e.target.value }))} placeholder="Email address" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Address / City</div>
              <Input value={moCustomer.address} onChange={e => setMoCustomer(p => ({ ...p, address: e.target.value }))} placeholder="City" />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Rental Period *</div>
          <DatePicker.RangePicker
            showTime={{ format: 'HH:mm' }}
            format="DD MMM YYYY HH:mm"
            value={moDates}
            onChange={v => setMoDates(v)}
            style={{ width: '100%' }}
            placeholder={['Pickup date & time', 'Return date & time']}
          />
          {moDates?.[0] && moDates?.[1] && (
            <div style={{ marginTop: 6, fontSize: 12, color: '#6366f1', fontWeight: 600 }}>
              {Math.max(1, moDates[1].diff(moDates[0], 'day') + 1)} day(s)
            </div>
          )}
        </div>

        {/* Equipment */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Equipment *</div>
          <Select
            showSearch placeholder="Search and add a product..."
            style={{ width: '100%', marginBottom: 10 }}
            filterOption={(input, opt) => opt.label.toLowerCase().includes(input.toLowerCase())}
            options={products.filter(p => !moItems.find(it => String(it.productId) === String(p._id))).map(p => ({ value: p._id, label: `${p.name} — ₹${p.pricePerDay}/day` }))}
            value={null}
            onChange={pid => {
              const p = products.find(x => x._id === pid)
              if (p) setMoItems(prev => [...prev, { productId: p._id, name: p.name, pricePerDay: p.pricePerDay, imageUrl: p.imageUrl, quantity: 1 }])
            }}
          />
          {moItems.map((item, i) => {
            const days = moDates?.[0] && moDates?.[1] ? Math.max(1, moDates[1].diff(moDates[0], 'day') + 1) : 1
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#f9fafb', borderRadius: 8, border: '1px solid #f0f0f0', marginBottom: 6 }}>
                <img src={getImageUrl(item.imageUrl)} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'contain', border: '1px solid #e5e7eb', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1e1b4b' }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>₹{item.pricePerDay}/day × {days}d = ₹{(item.pricePerDay * (item.quantity || 1) * days).toLocaleString()}</div>
                </div>
                <InputNumber min={1} max={20} size="small" value={item.quantity || 1}
                  onChange={v => setMoItems(prev => prev.map((it, idx) => idx === i ? { ...it, quantity: v || 1 } : it))}
                  style={{ width: 60 }} />
                <button onClick={() => setMoItems(prev => prev.filter((_, idx) => idx !== i))}
                  style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, color: '#ef4444', fontSize: 12, padding: '3px 8px', cursor: 'pointer' }}>✕</button>
              </div>
            )
          })}
        </div>

        {/* Pricing summary */}
        {moItems.length > 0 && moDates?.[0] && moDates?.[1] && (() => {
          const days     = Math.max(1, moDates[1].diff(moDates[0], 'day') + 1)
          const subtotal = moItems.reduce((s, it) => s + (it.pricePerDay || 0) * (it.quantity || 1) * days, 0)
          const total    = Math.max(0, subtotal - (moDiscount || 0))
          return (
            <div style={{ marginBottom: 20, background: '#1e1b4b', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>Subtotal</span>
                <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>₹{subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>Discount (₹)</span>
                <InputNumber
                  min={0} max={subtotal} value={moDiscount}
                  onChange={v => setMoDiscount(v || 0)}
                  size="small"
                  style={{ width: 100, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 6 }}
                  prefix="₹"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 10 }}>
                <span style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>Total</span>
                <span style={{ fontSize: 22, color: '#fff', fontWeight: 900 }}>₹{total.toLocaleString()}</span>
              </div>
            </div>
          )
        })()}

        {/* GST Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: moGst ? '#f0fdf4' : '#f9fafb', border: `1px solid ${moGst ? '#bbf7d0' : '#e5e7eb'}`, borderRadius: 10, padding: '12px 16px' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#1e1b4b' }}>Enable GST (18%)</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
              {moGst && moDates?.[0] && moItems.length > 0
                ? (() => {
                    const days = Math.max(1, moDates[1].diff(moDates[0], 'day') + 1)
                    const base = moItems.reduce((s, it) => s + (it.pricePerDay || 0) * (it.quantity || 1) * days, 0) - (moDiscount || 0)
                    const gst  = +(base * 0.18).toFixed(2)
                    return `GST: ₹${gst.toLocaleString()} · Grand Total: ₹${(base + gst).toLocaleString()}`
                  })()
                : 'Add 18% GST on top of rental price'}
            </div>
          </div>
          <Switch checked={moGst} onChange={setMoGst} />
        </div>

        {/* Notes */}
        <div>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>Notes (optional)</div>
          <Input.TextArea
            value={moNotes}
            onChange={e => setMoNotes(e.target.value)}
            placeholder="Special instructions or requirements..."
            rows={3}
            style={{ borderRadius: 8 }}
          />
        </div>
      </Drawer>
    </div>
  )
}

export default OrdersMonitor
