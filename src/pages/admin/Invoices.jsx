import { useState, useMemo, useEffect } from 'react'
import {
  Table, Input, Button, Tag, Modal, Drawer, Avatar,
  Typography, Divider,
} from 'antd'
import {
  SearchOutlined, PrinterOutlined, FileTextOutlined,
  UserOutlined, LinkOutlined, EditOutlined,
} from '@ant-design/icons'
import toast from 'react-hot-toast'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useGlobal, getImageUrl, API_URL } from '../../context/GlobalContext'
import PageHeader from '../../components/PageHeader'
import { getAdminSettings } from './Settings'

const { Search } = Input
const { Text } = Typography

const NAVY  = '#1e1b4b'
const BRAND = '#E5550F'

const ORDER_STATUS_CFG = {
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
const ocfg = (s) => ORDER_STATUS_CFG[s] || { color: '#94a3b8', bg: '#f8fafc', label: s }

const KYC_COLOR = {
  Approved: '#10b981', Pending: '#f59e0b', Rejected: '#ef4444', 'Not Uploaded': '#94a3b8',
}

// ── GST-inclusive amount helpers ─────────────────────────────────────
const gstAmount  = (order) => order.gstEnabled ? +((order.totalPrice || 0) * (order.gstRate || 18) / 100).toFixed(2) : 0
const gstTotal   = (order) => +((order.totalPrice || 0) + gstAmount(order)).toFixed(2)
const gstBalance = (order) => Math.max(0, +(gstTotal(order) - (order.totalPaid || 0)).toFixed(2))

const invoiceStatus = (order) => {
  const pending = gstBalance(order)
  if (pending <= 0) return { label: 'PAID', color: '#16a34a', bg: '#f0fdf4', overdue: 0 }
  const today   = new Date()
  const dueDate = new Date(order.endDate)
  const diffMs  = today - dueDate
  const days    = Math.floor(diffMs / 86400000)
  if (days > 0) return { label: `OVERDUE BY ${days} DAY${days > 1 ? 'S' : ''}`, color: '#dc2626', bg: '#fef2f2', overdue: days }
  return { label: 'PENDING', color: '#d97706', bg: '#fffbeb', overdue: 0 }
}

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
const fmtAmt  = (n) => `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
const fmtShort = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const MILESTONES = [
  { label: 'Submitted', statuses: ['Request Submitted', 'KYC Pending'] },
  { label: 'KYC Done',  statuses: ['KYC Approved'] },
  { label: 'Approved',  statuses: ['Approved'] },
  { label: 'Ready',     statuses: ['Ready for Pickup'] },
  { label: 'Active',    statuses: ['Picked Up', 'During Rental', 'Return Pending', 'Active', 'Reopened'] },
  { label: 'Closed',    statuses: ['Returned', 'Closed'] },
]

const InvoicesPage = () => {
  const { allOrders, allUsers, setAllOrders } = useGlobal()
  const pickupLocs = getAdminSettings().pickupLocations || []
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const invoiceCodeParam = searchParams.get('invoiceCode')

  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page,         setPage]         = useState(1)
  const [previewOrder, setPreviewOrder] = useState(null)
  const [previewUser,  setPreviewUser]  = useState(null)
  const [editingCode,  setEditingCode]  = useState(false)
  const [codeValue,    setCodeValue]    = useState('')
  const [codeSaving,   setCodeSaving]   = useState(false)
  const PAGE_SIZE = 25

  const saveBookingCodeEdit = async (order, newCode) => {
    if (!order) return
    const trimmed = (newCode || '').trim()
    if (!trimmed || trimmed === order.bookingCode) { setEditingCode(false); return }
    setCodeSaving(true)
    try {
      const res = await fetch(`${API_URL}/admin/bookings/${order._id}/details`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingCode: trimmed }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Order/Invoice number updated')
        setAllOrders(prev => prev.map(o => o._id === data._id ? data : o))
        setPreviewOrder(data)
        setEditingCode(false)
      } else toast.error(data.message || 'Update failed')
    } catch { toast.error('Error updating number') }
    finally { setCodeSaving(false) }
  }

  // Pre-filter to the invoice navigated from Users page
  useEffect(() => {
    if (!invoiceCodeParam) return
    setSearch(invoiceCodeParam)
  }, [invoiceCodeParam])

  const rows = useMemo(() => {
    const q = search.toLowerCase()
    return allOrders
      .filter(o => {
        const inv  = o.bookingCode || ''
        const name = (o.userName || '').toLowerCase()
        const matchQ = !q || name.includes(q) || inv.toLowerCase().includes(q) || (o.userMobile || '').includes(q)
        const st = invoiceStatus(o)
        const matchStatus =
          statusFilter === 'all'     ? true :
          statusFilter === 'paid'    ? st.label === 'PAID' :
          statusFilter === 'overdue' ? st.overdue > 0 :
          statusFilter === 'pending' ? st.label === 'PENDING' : true
        return matchQ && matchStatus
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [allOrders, search, statusFilter])

  const printInvoice = (order) => {
    const items   = order.items?.length ? order.items : [order.productId].filter(Boolean)
    const days    = order.totalDays || 1
    const discount= order.discountAmount || 0
    const subTotal= items.reduce((s, it) => s + (it?.pricePerDay || 0) * days * (it?.quantity || 1), 0)
    const baseTotal = order.totalPrice || (subTotal - discount)
    const gstEnabled  = order.gstEnabled || false
    const gstRate     = order.gstRate || 18
    const halfGstRate = gstRate / 2
    const cgstAmt     = gstEnabled ? +(baseTotal * halfGstRate / 100).toFixed(2) : 0
    const sgstAmt     = gstEnabled ? +(baseTotal * halfGstRate / 100).toFixed(2) : 0
    const total   = gstTotal(order)
    const balDue  = gstBalance(order)
    const invNo   = order.bookingCode || ('#' + order._id?.slice(-8).toUpperCase())
    const invDate = fmtDate(order.createdAt)
    const logoUrl = `${window.location.origin}/logo.jpg`
    const qrUrl   = `${window.location.origin}/upi-qr.png`

    const amountInWords = (n) => {
      const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
      const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
      const inW = (num) => {
        if (num === 0) return ''
        if (num < 20) return a[num] + ' '
        if (num < 100) return b[Math.floor(num/10)] + (num%10 ? ' ' + a[num%10] : '') + ' '
        if (num < 1000) return a[Math.floor(num/100)] + ' Hundred ' + inW(num%100)
        if (num < 100000) return inW(Math.floor(num/1000)) + 'Thousand ' + inW(num%1000)
        if (num < 10000000) return inW(Math.floor(num/100000)) + 'Lakh ' + inW(num%100000)
        return inW(Math.floor(num/10000000)) + 'Crore ' + inW(num%10000000)
      }
      const rupees = Math.floor(n)
      const paise  = Math.round((n - rupees) * 100)
      let words = 'Indian Rupee ' + inW(rupees).trim()
      if (paise) words += ' and ' + inW(paise).trim() + ' Paise'
      return words + ' Only'
    }

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${invNo}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #111; background: #fff; }
  .page { max-width: 780px; margin: 0 auto; padding: 24px 28px; border: 1px solid #ccc; }
  .inv-header { display: flex; align-items: center; gap: 14px; border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 0; }
  .inv-header img { width: 52px; height: 52px; object-fit: contain; flex-shrink: 0; }
  .company-block { flex: 1; }
  .company-name { font-size: 14px; font-weight: 800; letter-spacing: 0.04em; margin-bottom: 2px; }
  .company-addr { font-size: 10px; line-height: 1.4; color: #444; }
  .invoice-ref { text-align: right; }
  .invoice-ref .inv-num { font-size: 16px; font-weight: 800; }
  .invoice-ref .inv-meta { font-size: 10px; color: #555; margin-top: 3px; line-height: 1.6; }
  .info-row { display: flex; border: 1px solid #ccc; border-top: none; }
  .bill-to { flex: 1; padding: 8px 12px; border-right: 1px solid #ccc; }
  .bill-to-label { font-size: 9px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
  .bill-to-name { font-size: 13px; font-weight: 700; margin-bottom: 2px; }
  .bill-to-detail { font-size: 10px; color: #555; line-height: 1.5; }
  .inv-meta-box { width: 260px; padding: 8px 12px; }
  .inv-meta-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px; }
  .inv-meta-row .lbl { color: #666; }
  .inv-meta-row .val { font-weight: 600; }
  .items-table { width: 100%; border-collapse: collapse; }
  .items-table th { background: #e8e8e8; font-size: 11px; font-weight: 700; padding: 6px 8px; border: 1px solid #ccc; text-align: left; }
  .items-table th.r, .items-table td.r { text-align: right; }
  .items-table th.c, .items-table td.c { text-align: center; width: 28px; }
  .items-table td { padding: 5px 8px; border: 1px solid #ccc; font-size: 11px; vertical-align: top; }
  .items-table td .sub { font-size: 10px; color: #777; }
  .footer-split { display: flex; border: 1px solid #ccc; border-top: none; }
  .footer-left { flex: 1; padding: 10px; border-right: 1px solid #ccc; font-size: 11px; }
  .footer-right { width: 260px; font-size: 11px; }
  .totals-row { display: flex; justify-content: space-between; padding: 4px 10px; border-bottom: 1px solid #ccc; }
  .totals-row.bold { font-weight: 700; font-size: 12px; }
  .sig-box { padding: 10px; text-align: center; min-height: 60px; display: flex; flex-direction: column; justify-content: space-between; border-top: 1px solid #ccc; }
  @media print { body { margin: 0; } .page { border: none; padding: 16px; max-width: 100%; } }
</style></head><body><div class="page">
  <div class="inv-header">
    <img src="${logoUrl}" alt="Lensmen Logo" />
    <div class="company-block">
      <div class="company-name">LENSMEN RENTALS</div>
      <div class="company-addr">Flat S3, 2nd floor, Sri Niketan Apt, Sasi Nagar Main Rd, Sasinagar (Old No.7, New No.16), near Anbu Hospital, Velachery, Chennai – 600042 &nbsp;|&nbsp; +91 90800 86600 &nbsp;|&nbsp; lensmen@live.com</div>
    </div>
    <div class="invoice-ref">
      <div class="inv-num">INVOICE</div>
      <div class="inv-meta">${invNo}<br>${invDate}</div>
    </div>
  </div>
  <div class="info-row">
    <div class="bill-to">
      <div class="bill-to-label">Bill To</div>
      <div class="bill-to-name">${order.userGstBusinessName || order.userName || '—'}</div>
      ${order.userGstBusinessName && order.userGstBusinessName !== order.userName ? `<div style="font-size:11px;color:#555;margin-bottom:2px;">${order.userName}</div>` : ''}
      <div class="bill-to-detail">
        ${order.userMobile  ? order.userMobile  + '<br>' : ''}
        ${order.userEmail   ? order.userEmail   + '<br>' : ''}
        ${order.userAddress ? order.userAddress + '<br>' : ''}
        ${order.userGstNumber ? `<span style="font-weight:700;color:#111;">GSTIN: ${order.userGstNumber}</span>` : ''}
      </div>
    </div>
    <div class="inv-meta-box">
      <div class="inv-meta-row"><span class="lbl">Invoice #</span><span class="val">${invNo}</span></div>
      <div class="inv-meta-row"><span class="lbl">Invoice Date</span><span class="val">${invDate}</span></div>
      <div class="inv-meta-row"><span class="lbl">Due Date</span><span class="val">${invDate}</span></div>
      <div class="inv-meta-row"><span class="lbl">Terms</span><span class="val">Due on Receipt</span></div>
    </div>
  </div>
  <table class="items-table">
    <thead><tr><th class="c">#</th><th>Item &amp; Description</th><th class="r" style="width:50px">Qty</th><th class="r" style="width:50px">Days</th><th class="r" style="width:80px">Rate</th><th class="r" style="width:85px">Amount</th></tr></thead>
    <tbody>
      ${items.map((item, i) => {
        const qty  = item?.quantity || 1
        const rate = (item?.pricePerDay || 0) * days
        const amt  = qty * rate
        return `<tr><td class="c">${i+1}</td><td>${item?.name || 'Unknown'}</td><td class="r">${qty}</td><td class="r">${days}</td><td class="r">${rate.toLocaleString('en-IN',{minimumFractionDigits:2})}</td><td class="r">${amt.toLocaleString('en-IN',{minimumFractionDigits:2})}</td></tr>`
      }).join('')}
    </tbody>
  </table>
  <div class="footer-split">
    <div class="footer-left">
      <div style="margin-bottom:6px;"><div style="font-size:10px;color:#555;margin-bottom:2px;">Total In Words</div><div style="font-weight:700;font-style:italic;">${amountInWords(total)}</div></div>
      <div style="margin-bottom:14px;"><div style="font-size:10px;color:#555;margin-bottom:2px;">Notes</div><div>${order.notes || 'Thanks for your business.'}</div></div>
      <div style="padding-top:8px;border-top:1px solid #ccc;">
        <div style="font-size:10px;font-weight:700;color:#555;margin-bottom:6px;">Bank Details</div>
        <div style="display:flex;gap:10px;align-items:flex-start;">
          <img src="${qrUrl}" alt="UPI QR" style="width:64px;height:auto;border:1px solid #ddd;border-radius:4px;flex-shrink:0;" />
          <div style="font-size:9.5px;line-height:1.65;color:#333;">
            <div>Account Name: <b>Lens Men</b></div>
            <div>Account Type: <b>Current Account</b></div>
            <div>Account No.: <b>234605500007</b></div>
            <div>IFSC Code: <b>ICIC0002346</b></div>
            <div>Branch: <b>Vadapalani</b></div>
            <div>UPI ID: <b>lensmen@icici</b></div>
          </div>
        </div>
      </div>
      <div style="font-size:10px;color:#555;margin-top:10px;">Customer Signature.</div>
    </div>
    <div class="footer-right">
      <div class="totals-row"><span>Sub Total</span><span>${subTotal.toLocaleString('en-IN',{minimumFractionDigits:2})}</span></div>
      ${discount > 0 ? `<div class="totals-row"><span>Discount</span><span>(-) ${discount.toLocaleString('en-IN',{minimumFractionDigits:2})}</span></div>` : ''}
      ${gstEnabled ? `
      <div class="totals-row"><span>CGST (${halfGstRate}%)</span><span>${cgstAmt.toLocaleString('en-IN',{minimumFractionDigits:2})}</span></div>
      <div class="totals-row"><span>SGST (${halfGstRate}%)</span><span>${sgstAmt.toLocaleString('en-IN',{minimumFractionDigits:2})}</span></div>` : ''}
      <div class="totals-row bold"><span>Total${gstEnabled ? ' (Incl. GST)' : ''}</span><span>₹${total.toLocaleString('en-IN',{minimumFractionDigits:2})}</span></div>
      <div class="totals-row bold" style="border-bottom:none;"><span>Balance Due</span><span>₹${balDue.toLocaleString('en-IN',{minimumFractionDigits:2})}</span></div>
      <div class="sig-box"><div style="font-size:12px;margin-bottom:8px;">N Indrakumar</div><div style="font-size:11px;color:#555;">Authorized Signature</div></div>
    </div>
  </div>
</div></body></html>`

    const win = window.open('', '_blank', 'width=820,height=960')
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print() }, 600)
  }

  const handleUserClick = (e, order) => {
    e.stopPropagation()
    const user = allUsers.find(u =>
      u.email === order.userEmail || u.mobile === order.userMobile
    )
    if (user) setPreviewUser(user)
  }

  const columns = [
    {
      title: 'DATE',
      dataIndex: 'createdAt',
      key: 'date',
      width: 100,
      render: d => <span style={{ fontSize: 12, color: '#6b7280' }}>{fmtDate(d)}</span>,
    },
    {
      title: 'INVOICE #',
      dataIndex: 'bookingCode',
      key: 'invoice',
      width: 120,
      render: (code, r) => (
        <span
          style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: BRAND, cursor: 'pointer' }}
          onClick={() => printInvoice(r)}
        >
          {code || '#' + r._id?.slice(-8).toUpperCase()}
        </span>
      ),
    },
    {
      title: 'ORDER NUMBER',
      key: 'order',
      width: 120,
      render: (_, r) => (
        <span
          onClick={e => { e.stopPropagation(); setEditingCode(false); setPreviewOrder(r) }}
          style={{ fontSize: 12, fontFamily: 'monospace', color: NAVY, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}
        >
          {r.bookingCode || '#' + r._id?.slice(-8).toUpperCase()}
        </span>
      ),
    },
    {
      title: 'CUSTOMER NAME',
      dataIndex: 'userName',
      key: 'customer',
      width: 160,
      sorter: (a, b) => (a.userName || '').localeCompare(b.userName || ''),
      render: (name, r) => (
        <span
          onClick={e => handleUserClick(e, r)}
          style={{ fontSize: 13, fontWeight: 500, color: NAVY, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}
        >
          {name || '—'}
        </span>
      ),
    },
    {
      title: 'INVOICE STATUS',
      key: 'status',
      width: 180,
      filters: [
        { text: 'Paid', value: 'paid' },
        { text: 'Overdue', value: 'overdue' },
        { text: 'Pending', value: 'pending' },
      ],
      onFilter: (value, record) => {
        const st = invoiceStatus(record)
        if (value === 'paid')    return st.label === 'PAID'
        if (value === 'overdue') return st.overdue > 0
        if (value === 'pending') return st.label === 'PENDING'
        return true
      },
      render: (_, r) => {
        const st = invoiceStatus(r)
        return <span style={{ fontSize: 12, fontWeight: 700, color: st.color }}>{st.label}</span>
      },
    },
    {
      title: 'DUE DATE',
      dataIndex: 'endDate',
      key: 'dueDate',
      width: 100,
      render: d => <span style={{ fontSize: 12, color: '#6b7280' }}>{fmtDate(d)}</span>,
    },
    {
      title: 'INVOICE AMOUNT',
      key: 'amount',
      width: 140,
      align: 'right',
      sorter: (a, b) => gstTotal(a) - gstTotal(b),
      render: (_, r) => <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{fmtAmt(gstTotal(r))}</span>,
    },
    {
      title: 'BALANCE',
      key: 'balance',
      width: 110,
      align: 'right',
      sorter: (a, b) => gstBalance(a) - gstBalance(b),
      render: (_, r) => {
        const bal = gstBalance(r)
        return (
          <span style={{ fontSize: 13, fontWeight: 600, color: bal > 0 ? '#dc2626' : '#16a34a' }}>
            {fmtAmt(bal)}
          </span>
        )
      },
    },
    {
      title: 'NO OF DAYS',
      dataIndex: 'totalDays',
      key: 'days',
      width: 100,
      align: 'center',
      sorter: (a, b) => (a.totalDays || 1) - (b.totalDays || 1),
      render: d => <span style={{ fontSize: 13, color: '#374151' }}>{d || 1}</span>,
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_, r) => (
        <Button
          type="text" size="small"
          icon={<PrinterOutlined />}
          onClick={() => printInvoice(r)}
          style={{ color: '#9ca3af' }}
          title="Print Invoice"
        />
      ),
    },
  ]

  const paidCount    = allOrders.filter(o => invoiceStatus(o).label === 'PAID').length
  const overdueCount = allOrders.filter(o => invoiceStatus(o).overdue > 0).length
  const pendingCount = allOrders.filter(o => invoiceStatus(o).label === 'PENDING').length

  // ── Order preview modal ──────────────────────────────────────────────
  const renderOrderPreview = () => {
    if (!previewOrder) return null
    const o          = previewOrder
    const items      = o.items?.length ? o.items : [o.productId].filter(Boolean)
    const isRejected = o.status === 'Rejected'
    const activeIdx  = isRejected ? -1 : MILESTONES.findIndex(m => m.statuses.includes(o.status))
    const trackPct   = activeIdx >= 0 ? (activeIdx / (MILESTONES.length - 1)) * 100 : 0
    const statusInfo = ocfg(o.status)
    const invStatus  = invoiceStatus(o)
    const subtotal   = items.reduce((s, it) => s + (it.pricePerDay || 0) * (it.quantity || 1) * (o.totalDays || 1), 0)

    return (
      <Modal
        open
        onCancel={() => { setPreviewOrder(null); setEditingCode(false) }}
        footer={null}
        width={820}
        destroyOnHidden
        styles={{ body: { padding: 0 } }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', paddingRight: 32 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: NAVY }}>Order Details</span>
            {editingCode ? (
              <Input
                size="small"
                autoFocus
                value={codeValue}
                onChange={e => setCodeValue(e.target.value.toUpperCase())}
                onPressEnter={() => saveBookingCodeEdit(o, codeValue)}
                onBlur={() => saveBookingCodeEdit(o, codeValue)}
                onClick={e => e.stopPropagation()}
                disabled={codeSaving}
                style={{ width: 150, fontFamily: 'monospace', fontSize: 13, fontWeight: 700 }}
              />
            ) : (
              <span
                onClick={e => { e.stopPropagation(); setCodeValue(o.bookingCode || ''); setEditingCode(true) }}
                style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: BRAND, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                title="Click to edit Invoice / Order number"
              >
                {o.bookingCode || '#' + o._id?.slice(-8).toUpperCase()}
                <EditOutlined style={{ fontSize: 11, color: '#d1d5db' }} />
              </span>
            )}
            <span style={{
              fontSize: 11, fontWeight: 700, color: statusInfo.color,
              background: statusInfo.bg, border: `1px solid ${statusInfo.color}30`,
              borderRadius: 20, padding: '2px 12px',
            }}>
              {statusInfo.label}
            </span>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>Placed {fmtShort(o.createdAt)}</span>
            <Button
              size="small" icon={<LinkOutlined />}
              style={{ marginLeft: 'auto', fontSize: 11 }}
              onClick={() => { setPreviewOrder(null); navigate(`/admin/orders?orderId=${o._id}`) }}
            >
              Open in Orders
            </Button>
          </div>
        }
      >
        <div style={{ padding: '0 24px 0' }}>

          {/* ── Status stepper ── */}
          <div style={{ padding: '16px 0 20px' }}>
            {isRejected ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fef2f2', borderRadius: 10, padding: '12px 16px' }}>
                <span style={{ fontSize: 18, color: '#ef4444' }}>✕</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#991b1b', fontSize: 13 }}>Rental Request Rejected</div>
                  {o.rejectionReason && <div style={{ fontSize: 12, color: '#b91c1c' }}>"{o.rejectionReason}"</div>}
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '7%', right: '7%', top: 18, height: 3, background: '#e5e7eb', borderRadius: 2, zIndex: 0 }} />
                <div style={{
                  position: 'absolute', left: '7%', top: 18, height: 3,
                  background: 'linear-gradient(90deg, #10b981, #1e1b4b)',
                  borderRadius: 2, zIndex: 1,
                  width: `${Math.max(0, trackPct * 0.86)}%`, transition: 'width 0.5s',
                }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                  {MILESTONES.map((m, i) => {
                    const done = i < activeIdx, active = i === activeIdx
                    return (
                      <div key={m.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: done ? '#10b981' : active ? NAVY : '#fff',
                          border: done || active ? 'none' : '2px solid #d1d5db',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700,
                          color: done || active ? '#fff' : '#9ca3af',
                          boxShadow: active ? `0 0 0 6px rgba(30,27,75,0.1)` : done ? '0 0 0 4px rgba(16,185,129,0.12)' : 'none',
                        }}>
                          {done ? '✓' : i + 1}
                        </div>
                        <span style={{
                          fontSize: 9, fontWeight: active ? 800 : done ? 600 : 400,
                          color: done ? '#10b981' : active ? NAVY : '#9ca3af',
                          textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap',
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

          {/* ── Two info cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {/* Customer */}
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '14px 16px', border: '1px solid #e8edf2' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>CUSTOMER</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: NAVY }}>{o.userName}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: BRAND, marginTop: 3 }}>{o.userMobile}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{o.userEmail}</div>
              {o.userGstNumber && (
                <div style={{ marginTop: 6, fontSize: 11, color: '#374151' }}>
                  <span style={{ color: '#9ca3af', marginRight: 4 }}>GSTIN</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{o.userGstNumber}</span>
                </div>
              )}
            </div>
            {/* Rental Period */}
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '14px 16px', border: '1px solid #e8edf2' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>RENTAL PERIOD</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: NAVY }}>
                {fmtShort(o.startDate)} → {fmtShort(o.endDate)}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: BRAND, marginTop: 4 }}>
                {o.totalDays || 1} day{(o.totalDays || 1) !== 1 ? 's' : ''}
              </div>
              {o.pickupLocation && (
                <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }}>
                  📍 {o.pickupLocation}
                </div>
              )}
            </div>
          </div>

          {/* ── Equipment table ── */}
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e8edf2', marginBottom: 20 }}>
            {/* Header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 100px 60px 60px 110px',
              background: NAVY, padding: '10px 16px', gap: 8,
            }}>
              {['EQUIPMENT', 'RATE/DAY', 'QTY', 'DAYS', 'AMOUNT'].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: h === 'EQUIPMENT' ? 'left' : 'right' }}>{h}</div>
              ))}
            </div>
            {/* Rows */}
            {items.map((item, i) => {
              const lineAmt = (item.pricePerDay || 0) * (item.quantity || 1) * (o.totalDays || 1)
              return (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '1fr 100px 60px 60px 110px',
                  padding: '12px 16px', gap: 8, alignItems: 'center',
                  borderBottom: i < items.length - 1 ? '1px solid #f3f4f6' : 'none',
                  background: i % 2 === 0 ? '#fff' : '#fafafa',
                }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <img
                      src={getImageUrl(item?.productId?.imageUrl || item?.imageUrl)}
                      alt=""
                      style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'contain', background: '#f3f4f6', border: '1px solid #e5e7eb', padding: 2, flexShrink: 0 }}
                      onError={e => { e.target.style.display = 'none' }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{item.name}</span>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 12, color: '#374151' }}>₹{(item.pricePerDay || 0).toLocaleString()}</div>
                  <div style={{ textAlign: 'right', fontSize: 12, color: '#374151' }}>{item.quantity || 1}</div>
                  <div style={{ textAlign: 'right', fontSize: 12, color: '#374151' }}>{o.totalDays || 1}</div>
                  <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: NAVY }}>₹{lineAmt.toLocaleString()}</div>
                </div>
              )
            })}
            {/* Totals */}
            <div style={{ borderTop: '1px solid #e5e7eb', background: '#fafafa' }}>
              {(o.discountAmount > 0) && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 40, padding: '8px 16px' }}>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>Subtotal</span>
                  <span style={{ fontSize: 12, color: '#374151', minWidth: 80, textAlign: 'right' }}>₹{subtotal.toLocaleString()}</span>
                </div>
              )}
              {(o.discountAmount > 0) && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 40, padding: '4px 16px' }}>
                  <span style={{ fontSize: 12, color: '#10b981' }}>Discount {o.offerCode ? `(${o.offerCode})` : ''}</span>
                  <span style={{ fontSize: 12, color: '#10b981', minWidth: 80, textAlign: 'right' }}>−₹{(o.discountAmount || 0).toLocaleString()}</span>
                </div>
              )}
              {o.gstEnabled && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 40, padding: '4px 16px' }}>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>CGST ({(o.gstRate || 18) / 2}%)</span>
                    <span style={{ fontSize: 12, color: '#374151', minWidth: 80, textAlign: 'right' }}>₹{(gstAmount(o) / 2).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 40, padding: '4px 16px' }}>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>SGST ({(o.gstRate || 18) / 2}%)</span>
                    <span style={{ fontSize: 12, color: '#374151', minWidth: 80, textAlign: 'right' }}>₹{(gstAmount(o) / 2).toLocaleString()}</span>
                  </div>
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 40, background: NAVY, borderRadius: 8, padding: '10px 20px' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#c7d2fe', letterSpacing: '0.06em' }}>TOTAL{o.gstEnabled ? ' (INCL. GST)' : ''}</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>₹{gstTotal(o).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Payment status strip ── */}
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 16px', border: '1px solid #e8edf2', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', gap: 24 }}>
                <div>
                  <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>COLLECTED</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#10b981' }}>₹{(o.totalPaid || 0).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>PENDING</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: gstBalance(o) > 0 ? '#ef4444' : '#10b981' }}>
                    ₹{gstBalance(o).toLocaleString()}
                  </div>
                </div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 800, padding: '5px 14px', borderRadius: 20,
                background: invStatus.bg, color: invStatus.color,
                border: `1px solid ${invStatus.color}30`,
              }}>
                {invStatus.label}
              </span>
            </div>
            {(o.payments || []).length > 0 && (
              <div style={{ marginTop: 10, borderTop: '1px solid #e8edf2', paddingTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(o.payments || []).map((p, i) => (
                  <div key={i} style={{ fontSize: 11, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '3px 10px', color: '#374151' }}>
                    <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{p.type}</span>
                    <span style={{ color: '#9ca3af', margin: '0 4px' }}>·</span>
                    <span>{p.mode}</span>
                    <span style={{ color: '#9ca3af', margin: '0 4px' }}>·</span>
                    <span style={{ fontWeight: 700 }}>₹{p.amount?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ── Action bar ── */}
        <div style={{
          borderTop: '1px solid #f0f0f0', padding: '14px 24px',
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          background: '#fafafa', borderRadius: '0 0 12px 12px',
        }}>
          <Button icon={<PrinterOutlined />} onClick={() => printInvoice(o)}>
            Print Invoice
          </Button>
          <Button
            icon={<span style={{ fontSize: 13 }}>✉</span>}
            onClick={() => { setPreviewOrder(null); navigate(`/admin/orders?orderId=${o._id}`) }}
          >
            Open in Orders
          </Button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: statusInfo.color,
              background: statusInfo.bg, border: `1px solid ${statusInfo.color}30`,
              borderRadius: 20, padding: '4px 14px', display: 'inline-flex', alignItems: 'center',
            }}>
              {statusInfo.label}
            </span>
          </div>
        </div>
      </Modal>
    )
  }

  // ── User preview drawer helpers ──────────────────────────────────────
  const renderUserPreview = () => {
    if (!previewUser) return null
    const u = previewUser
    const userOrders  = allOrders.filter(o => o.userEmail === u.email || o.userMobile === u.mobile)
    const totalSpent  = userOrders.reduce((s, o) => s + (o.totalPaid || 0), 0)
    const outstanding = userOrders.reduce((s, o) => s + gstBalance(o), 0)
    const kycStatus   = u.kycStatus || 'Not Uploaded'
    const kycColor    = KYC_COLOR[kycStatus] || '#94a3b8'

    return (
      <Drawer
        open
        onClose={() => setPreviewUser(null)}
        placement="right"
        width={480}
        destroyOnHidden
        styles={{ body: { padding: 0 }, header: { display: 'none' } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar
                size={44}
                style={{ background: 'linear-gradient(135deg,#1e1b4b,#3730a3)', fontWeight: 800, fontSize: 18, flexShrink: 0 }}
                icon={<UserOutlined />}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>{u.fullName}</span>
                  <Tag color={u.role === 'admin' ? 'geekblue' : 'default'} style={{ fontSize: 10 }}>{u.role}</Tag>
                  <span style={{ fontSize: 11, fontWeight: 700, color: kycColor, background: `${kycColor}18`, border: `1px solid ${kycColor}40`, borderRadius: 4, padding: '1px 7px' }}>
                    {kycStatus}
                  </span>
                </div>
                {u.userId && (
                  <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: BRAND, background: '#fff7ed', border: '1px solid #fed7aa', padding: '1px 7px', borderRadius: 4, marginTop: 3, display: 'inline-block' }}>
                    {u.userId}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setPreviewUser(null)}
              style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: 16, flexShrink: 0 }}
            >×</button>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', background: '#fafafa', flexShrink: 0 }}>
            {[
              { label: 'Total Orders', value: userOrders.length },
              { label: 'Total Spent',  value: `₹${totalSpent.toLocaleString()}` },
              { label: 'Outstanding',  value: `₹${outstanding.toLocaleString()}`, red: outstanding > 0 },
            ].map((s, i) => (
              <div key={s.label} style={{ flex: 1, padding: '10px 14px', borderRight: i < 2 ? '1px solid #f1f5f9' : 'none', textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: s.red ? '#ef4444' : NAVY }}>{s.value}</div>
                <div style={{ fontSize: 9, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            <Divider orientation="left" style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 0 }}>
              Contact
            </Divider>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', marginBottom: 20 }}>
              {[
                { label: 'Email', value: u.email },
                { label: 'Mobile', value: u.mobile || '—' },
                { label: 'Account Type', value: u.accountType || 'Private' },
                { label: 'Class', value: u.customerClass || 'New' },
                { label: 'Joined', value: fmtShort(u.createdAt) },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>{f.label}</div>
                  <div style={{ fontSize: 12, color: '#1e293b', fontWeight: 500 }}>{f.value}</div>
                </div>
              ))}
              {u.address && (
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Address</div>
                  <div style={{ fontSize: 12, color: '#1e293b', fontWeight: 500, lineHeight: 1.5 }}>{u.address}</div>
                </div>
              )}
            </div>

            {userOrders.length > 0 && (
              <>
                <Divider orientation="left" style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Recent Orders
                </Divider>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {userOrders.slice(0, 5).map(o => (
                    <div
                      key={o._id}
                      onClick={() => { setPreviewUser(null); setEditingCode(false); setPreviewOrder(o) }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f9fafb', borderRadius: 10, border: '1px solid #f0f0f0', cursor: 'pointer' }}
                    >
                      <div>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: BRAND }}>{o.bookingCode}</span>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{fmtDate(o.createdAt)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: ocfg(o.status).color }}>{ocfg(o.status).label}</span>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginTop: 2 }}>₹{gstTotal(o).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div style={{ marginTop: 20 }}>
              <button
                onClick={() => { setPreviewUser(null); navigate(`/admin/users?uid=${u._id}`) }}
                style={{ width: '100%', padding: '10px 0', borderRadius: 10, border: `1.5px solid ${NAVY}`, background: 'transparent', color: NAVY, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s' }}
              >
                <LinkOutlined /> Open Full Profile
              </button>
            </div>
          </div>
        </div>
      </Drawer>
    )
  }

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="All rental invoices and payment status"
        icon={<FileTextOutlined />}
      />

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        {[
          { key: 'all',     label: 'All Invoices', count: allOrders.length, color: NAVY,      bg: '#f0f1f7' },
          { key: 'paid',    label: 'Paid',          count: paidCount,        color: '#16a34a', bg: '#f0fdf4' },
          { key: 'overdue', label: 'Overdue',        count: overdueCount,     color: '#dc2626', bg: '#fef2f2' },
          { key: 'pending', label: 'Pending',        count: pendingCount,     color: '#d97706', bg: '#fffbeb' },
        ].map(chip => (
          <button
            key={chip.key}
            onClick={() => { setStatusFilter(chip.key); setPage(1) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '6px 14px', borderRadius: 20,
              border: statusFilter === chip.key ? `1.5px solid ${chip.color}` : '1.5px solid #e5e7eb',
              background: statusFilter === chip.key ? chip.bg : 'transparent',
              color: statusFilter === chip.key ? chip.color : '#6b7280',
              fontSize: 13, fontWeight: statusFilter === chip.key ? 700 : 500,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {chip.label}
            <span style={{
              fontSize: 11, fontWeight: 700,
              background: statusFilter === chip.key ? chip.color : '#e5e7eb',
              color: statusFilter === chip.key ? '#fff' : '#6b7280',
              borderRadius: 10, padding: '1px 7px', minWidth: 20, textAlign: 'center',
            }}>
              {chip.count}
            </span>
          </button>
        ))}

        <div style={{ marginLeft: 'auto' }}>
          <Search
            placeholder="Search customer, invoice..."
            allowClear
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            style={{ width: 240 }}
          />
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
        <Table
          dataSource={rows}
          columns={columns}
          rowKey="_id"
          size="small"
          scroll={{ x: 900 }}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total: rows.length,
            onChange: (p) => setPage(p),
            showTotal: (total) => `Total Count: ${total}`,
            showSizeChanger: false,
          }}
          rowClassName={() => 'inv-row'}
          onRow={(record) => ({
            style: record.bookingCode === invoiceCodeParam
              ? { background: '#fffbeb', boxShadow: 'inset 3px 0 0 #f59e0b' }
              : {},
          })}
          style={{ fontSize: 13 }}
        />
      </div>

      {/* Order preview modal */}
      {renderOrderPreview()}

      {/* User preview drawer */}
      {renderUserPreview()}
    </div>
  )
}

export default InvoicesPage
