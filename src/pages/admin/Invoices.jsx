import { useState, useMemo, useEffect } from 'react'
import {
  Table, Input, Button, Tag, Modal, Drawer, Avatar,
  Descriptions, Row, Col, Space, Typography, Divider,
} from 'antd'
import {
  SearchOutlined, PrinterOutlined, FileTextOutlined,
  UserOutlined, ArrowRightOutlined, LinkOutlined,
} from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useGlobal, getImageUrl } from '../../context/GlobalContext'
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

const invoiceStatus = (order) => {
  const pending = order.pendingAmount ?? (order.totalPrice - (order.totalPaid || 0))
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
  const { allOrders, allUsers } = useGlobal()
  const pickupLocs = getAdminSettings().pickupLocations || []
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const invoiceCodeParam = searchParams.get('invoiceCode')

  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page,         setPage]         = useState(1)
  const [previewOrder, setPreviewOrder] = useState(null)
  const [previewUser,  setPreviewUser]  = useState(null)
  const PAGE_SIZE = 25

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
    const total   = order.totalPrice || (subTotal - discount)
    const balDue  = order.pendingAmount ?? total
    const invNo   = order.bookingCode || ('#' + order._id?.slice(-8).toUpperCase())
    const invDate = fmtDate(order.createdAt)
    const logoUrl = `${window.location.origin}/logo.jpg`

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
  body { font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #111; background: #fff; }
  .page { max-width: 750px; margin: 0 auto; padding: 32px 28px; border: 1px solid #ccc; }
  .inv-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #ccc; padding-bottom: 16px; }
  .inv-header-left { display: flex; align-items: flex-start; gap: 16px; }
  .inv-header-left img { width: 90px; height: auto; object-fit: contain; }
  .company-name { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
  .company-addr { font-size: 11px; line-height: 1.55; color: #333; max-width: 340px; }
  .tax-invoice-label { font-size: 30px; font-weight: 400; letter-spacing: 1px; color: #111; align-self: flex-end; }
  .meta-table { width: 100%; border-collapse: collapse; border: 1px solid #ccc; margin-top: 0; }
  .meta-table td { padding: 5px 10px; font-size: 12px; border: 1px solid #ccc; vertical-align: top; }
  .meta-table .meta-label { color: #555; width: 110px; }
  .meta-table .meta-val { font-weight: 600; }
  .bill-to-header { background: #e8e8e8; padding: 5px 10px; font-size: 12px; font-weight: 600; border: 1px solid #ccc; border-top: none; }
  .bill-to-name { padding: 6px 10px 10px; font-size: 13px; font-weight: 700; border: 1px solid #ccc; border-top: none; }
  .items-table { width: 100%; border-collapse: collapse; }
  .items-table th { background: #e8e8e8; font-size: 12px; font-weight: 700; padding: 7px 10px; border: 1px solid #ccc; text-align: left; }
  .items-table th.r, .items-table td.r { text-align: right; }
  .items-table th.c, .items-table td.c { text-align: center; width: 36px; }
  .items-table td { padding: 8px 10px; border: 1px solid #ccc; font-size: 12px; vertical-align: top; }
  .footer-split { display: flex; border: 1px solid #ccc; border-top: none; }
  .footer-left { flex: 1; padding: 12px 10px; border-right: 1px solid #ccc; font-size: 12px; }
  .footer-right { width: 260px; font-size: 12px; }
  .totals-row { display: flex; justify-content: space-between; padding: 5px 10px; border-bottom: 1px solid #ccc; }
  .totals-row.bold { font-weight: 700; font-size: 13px; }
  .sig-box { padding: 12px 10px; text-align: center; min-height: 80px; display: flex; flex-direction: column; justify-content: space-between; border-top: 1px solid #ccc; }
  @media print { body { margin: 0; } .page { border: none; padding: 20px; max-width: 100%; } }
</style></head><body><div class="page">
  <div class="inv-header">
    <div class="inv-header-left">
      <img src="${logoUrl}" alt="Lens Men Logo" />
      <div>
        <div class="company-name">LENS MEN</div>
        <div class="company-addr">flat no S3, 2nd floor, Sri Niketan Apartment, Sasi Nagar<br>Main road, Sasinagar Old no 7 new no 16, near Anbu Hospital, Velachery.<br>Chennai Tamil Nadu 600042<br>India<br>+919080086600<br>lensmen@live.com</div>
      </div>
    </div>
    <div class="tax-invoice-label">TAX INVOICE</div>
  </div>
  <table class="meta-table">
    <tr><td class="meta-label">#</td><td class="meta-val">${invNo}</td><td rowspan="4" style="width:50%"></td></tr>
    <tr><td class="meta-label">Invoice Date</td><td class="meta-val">${invDate}</td></tr>
    <tr><td class="meta-label">Terms</td><td class="meta-val">Due on Receipt</td></tr>
    <tr><td class="meta-label">Due Date</td><td class="meta-val">${invDate}</td></tr>
  </table>
  <div class="bill-to-header">Bill To</div>
  <div class="bill-to-name">${order.userName || '—'}</div>
  <table class="items-table">
    <thead><tr><th class="c">#</th><th>Item &amp; Description</th><th class="r" style="width:70px">Qty</th><th class="r" style="width:90px">Rate</th><th class="r" style="width:90px">Amount</th></tr></thead>
    <tbody>
      ${items.map((item, i) => {
        const qty = item?.quantity || 1
        const rate = (item?.pricePerDay || 0) * days
        const amt  = qty * rate
        return `<tr><td class="c">${i+1}</td><td>${item?.name || 'Unknown'}<br><span style="font-size:11px;color:#666;">${days} day${days!==1?'s':''} rental</span></td><td class="r">${qty}.0</td><td class="r">${rate.toLocaleString('en-IN',{minimumFractionDigits:2})}</td><td class="r">${amt.toLocaleString('en-IN',{minimumFractionDigits:2})}</td></tr>`
      }).join('')}
    </tbody>
  </table>
  <div class="footer-split">
    <div class="footer-left">
      <div style="margin-bottom:8px;"><div style="font-size:11px;color:#555;margin-bottom:2px;">Total In Words</div><div style="font-weight:700;font-style:italic;">${amountInWords(total)}</div></div>
      <div style="margin-bottom:32px;"><div style="font-size:11px;color:#555;margin-bottom:2px;">Notes</div><div>${order.notes || 'Thanks for your business.'}</div></div>
      <div style="font-size:11px;color:#555;margin-top:8px;">Customer Signature.</div>
    </div>
    <div class="footer-right">
      <div class="totals-row"><span>Sub Total</span><span>${subTotal.toLocaleString('en-IN',{minimumFractionDigits:2})}</span></div>
      ${discount > 0 ? `<div class="totals-row"><span>Discount</span><span>(-) ${discount.toLocaleString('en-IN',{minimumFractionDigits:2})}</span></div>` : ''}
      <div class="totals-row bold"><span>Total</span><span>₹${total.toLocaleString('en-IN',{minimumFractionDigits:2})}</span></div>
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
          onClick={e => { e.stopPropagation(); setPreviewOrder(r) }}
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
      dataIndex: 'totalPrice',
      key: 'amount',
      width: 140,
      align: 'right',
      sorter: (a, b) => (a.totalPrice || 0) - (b.totalPrice || 0),
      render: n => <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{fmtAmt(n)}</span>,
    },
    {
      title: 'BALANCE',
      dataIndex: 'pendingAmount',
      key: 'balance',
      width: 110,
      align: 'right',
      sorter: (a, b) => (a.pendingAmount || 0) - (b.pendingAmount || 0),
      render: (n, r) => {
        const bal = n ?? (r.totalPrice - (r.totalPaid || 0))
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

  // ── Order preview modal helpers ──────────────────────────────────────
  const renderOrderPreview = () => {
    if (!previewOrder) return null
    const o = previewOrder
    const items       = o.items?.length ? o.items : [o.productId].filter(Boolean)
    const isRejected  = o.status === 'Rejected'
    const activeIdx   = isRejected ? -1 : MILESTONES.findIndex(m => m.statuses.includes(o.status))
    const trackPct    = activeIdx >= 0 ? (activeIdx / (MILESTONES.length - 1)) * 100 : 0
    const statusInfo  = ocfg(o.status)

    return (
      <Modal
        open
        onCancel={() => setPreviewOrder(null)}
        footer={null}
        width={860}
        destroyOnHidden
        styles={{ body: { padding: '0 24px 24px' } }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', paddingRight: 32 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: NAVY }}>Order Details</span>
            <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: BRAND }}>
              {o.bookingCode || '#' + o._id?.slice(-8).toUpperCase()}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 700, color: statusInfo.color,
              background: statusInfo.bg, border: `1px solid ${statusInfo.color}30`,
              borderRadius: 6, padding: '2px 10px',
            }}>
              {statusInfo.label}
            </span>
            <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
              Placed {fmtShort(o.createdAt)}
            </Text>
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
        {/* Status stepper */}
        <div style={{ background: '#f8fafc', border: '1px solid #eef0f3', borderRadius: 14, padding: '18px 24px', marginBottom: 20, marginTop: 8 }}>
          {isRejected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: '#ef4444', fontSize: 18 }}>✕</span>
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#991b1b', fontSize: 13 }}>Rental Request Rejected</div>
                {o.rejectionReason && <div style={{ fontSize: 12, color: '#b91c1c', marginTop: 2 }}>Reason: <em>"{o.rejectionReason}"</em></div>}
              </div>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '6%', right: '6%', top: 14, height: 3, background: '#e5e7eb', borderRadius: 2, zIndex: 0 }} />
              <div style={{
                position: 'absolute', left: '6%', top: 14, height: 3,
                background: 'linear-gradient(90deg,#10b981,#1e1b4b)',
                borderRadius: 2, zIndex: 1, width: `${trackPct * 0.88}%`, transition: 'width 0.5s',
              }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                {MILESTONES.map((m, i) => {
                  const done = i < activeIdx, active = i === activeIdx
                  return (
                    <div key={m.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: done ? '#10b981' : active ? NAVY : '#fff',
                        border: done || active ? 'none' : '2px solid #e5e7eb',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: done || active ? '#fff' : '#d1d5db',
                        boxShadow: active ? `0 0 0 5px rgba(30,27,75,0.12)` : done ? '0 0 0 3px rgba(16,185,129,0.15)' : 'none',
                      }}>
                        {done ? '✓' : i + 1}
                      </div>
                      <span style={{ fontSize: 9, fontWeight: active ? 700 : done ? 600 : 500, color: done ? '#10b981' : active ? NAVY : '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                        {m.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <Row gutter={20}>
          {/* Equipment */}
          <Col span={9}>
            <Text strong style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Equipment</Text>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: 10, background: '#fafafa', borderRadius: 10, border: '1px solid #f0f0f0' }}>
                  <img
                    src={getImageUrl(item?.productId?.imageUrl || item?.imageUrl)}
                    alt=""
                    style={{ width: 44, height: 44, borderRadius: 7, objectFit: 'contain', background: '#fff', border: '1px solid #f0f0f0', padding: 2, flexShrink: 0 }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>
                      {item?.name}
                      {item?.quantity > 1 && (
                        <span style={{ marginLeft: 5, fontSize: 10, fontWeight: 700, color: BRAND, background: '#fff7ed', padding: '1px 5px', borderRadius: 4 }}>×{item.quantity}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>₹{item?.pricePerDay}/day</div>
                  </div>
                </div>
              ))}
            </div>
          </Col>

          {/* Logistics */}
          <Col span={8}>
            <Text strong style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Logistics</Text>
            <div style={{ marginTop: 10, background: '#fafafa', borderRadius: 12, padding: 14, border: '1px solid #f0f0f0', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>Pickup</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{fmtDate(o.startDate)}</div>
                </div>
                <ArrowRightOutlined style={{ color: '#d1d5db' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>Return</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{fmtDate(o.endDate)}</div>
                </div>
              </div>
              <div style={{ borderTop: '1px dashed #e5e7eb', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary" style={{ fontSize: 11 }}>Duration</Text>
                <Text strong style={{ fontSize: 12 }}>{o.totalDays || 1} Day(s)</Text>
              </div>
            </div>
            <Descriptions column={1} size="small" bordered style={{ borderRadius: 10 }}>
              <Descriptions.Item label="Client">{o.userName}</Descriptions.Item>
              <Descriptions.Item label="Mobile">{o.userMobile}</Descriptions.Item>
              <Descriptions.Item label="Email">{o.userEmail}</Descriptions.Item>
            </Descriptions>
          </Col>

          {/* Payment summary */}
          <Col span={7}>
            <Text strong style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Payment</Text>
            <div style={{ marginTop: 10, background: NAVY, borderRadius: 12, padding: '18px 14px', marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: '#93c5fd', fontWeight: 700, marginBottom: 4 }}>TOTAL</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>₹{(o.totalPrice || 0).toLocaleString()}</div>
            </div>
            <div style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 12px', border: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <Text style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>Collected</Text>
                <Text strong style={{ color: '#10b981', fontSize: 12 }}>₹{(o.totalPaid || 0).toLocaleString()}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>Pending</Text>
                <Text strong style={{ color: (o.pendingAmount || 0) > 0 ? '#ef4444' : '#10b981', fontSize: 12 }}>
                  ₹{(o.pendingAmount || 0).toLocaleString()}
                </Text>
              </div>
              {(o.payments || []).map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0', borderTop: '1px solid #f0f0f0' }}>
                  <Space size={4}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>{p.type}</span>
                    <span style={{ color: '#6b7280' }}>{p.mode}</span>
                  </Space>
                  <Text strong style={{ fontSize: 11 }}>₹{p.amount?.toLocaleString()}</Text>
                </div>
              ))}
            </div>
          </Col>
        </Row>
      </Modal>
    )
  }

  // ── User preview drawer helpers ──────────────────────────────────────
  const renderUserPreview = () => {
    if (!previewUser) return null
    const u = previewUser
    const userOrders  = allOrders.filter(o => o.userEmail === u.email || o.userMobile === u.mobile)
    const totalSpent  = userOrders.reduce((s, o) => s + (o.totalPaid || 0), 0)
    const outstanding = userOrders.reduce((s, o) => s + (o.pendingAmount || 0), 0)
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
                      onClick={() => { setPreviewUser(null); setPreviewOrder(o) }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f9fafb', borderRadius: 10, border: '1px solid #f0f0f0', cursor: 'pointer' }}
                    >
                      <div>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: BRAND }}>{o.bookingCode}</span>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{fmtDate(o.createdAt)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: ocfg(o.status).color }}>{ocfg(o.status).label}</span>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginTop: 2 }}>₹{(o.totalPrice || 0).toLocaleString()}</div>
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
