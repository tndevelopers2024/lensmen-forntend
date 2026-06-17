import { useState, useMemo } from 'react'
import { Table, Input, Button, Tag, Select, Space } from 'antd'
import { SearchOutlined, PrinterOutlined, FileTextOutlined } from '@ant-design/icons'
import { useGlobal, API_URL } from '../../context/GlobalContext'
import PageHeader from '../../components/PageHeader'
import { getAdminSettings } from './Settings'

const { Search } = Input

const NAVY  = '#1e1b4b'
const BRAND = '#E5550F'

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

const InvoicesPage = () => {
  const { allOrders } = useGlobal()
  const pickupLocs = getAdminSettings().pickupLocations || []

  const [search,     setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page,       setPage]       = useState(1)
  const PAGE_SIZE = 25

  const rows = useMemo(() => {
    const q = search.toLowerCase()
    return allOrders
      .filter(o => {
        const inv  = o.bookingCode || ''
        const name = (o.userName || '').toLowerCase()
        const matchQ = !q || name.includes(q) || inv.toLowerCase().includes(q) || (o.userMobile || '').includes(q)
        const st = invoiceStatus(o)
        const matchStatus =
          statusFilter === 'all' ? true :
          statusFilter === 'paid' ? st.label === 'PAID' :
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
        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: BRAND, cursor: 'pointer' }}
          onClick={() => printInvoice(r)}>
          {code || '#' + r._id?.slice(-8).toUpperCase()}
        </span>
      ),
    },
    {
      title: 'ORDER NUMBER',
      key: 'order',
      width: 120,
      render: (_, r) => (
        <span style={{ fontSize: 12, color: '#6b7280', fontFamily: 'monospace' }}>
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
      render: name => <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{name || '—'}</span>,
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
        return (
          <span style={{ fontSize: 12, fontWeight: 700, color: st.color }}>
            {st.label}
          </span>
        )
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
              padding: '6px 14px',
              borderRadius: 20,
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
              borderRadius: 10, padding: '1px 7px',
              minWidth: 20, textAlign: 'center',
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
          style={{ fontSize: 13 }}
        />
      </div>
    </div>
  )
}

export default InvoicesPage
