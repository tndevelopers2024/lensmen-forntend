import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Table, Button, Tag, Modal, Space, Typography, Popconfirm, Tooltip,
  Drawer, Avatar, Divider as AntDivider,
} from 'antd'
import {
  PlusOutlined, FilePdfOutlined, WhatsAppOutlined, MailOutlined,
  CheckOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CopyOutlined,
  UserOutlined, LinkOutlined,
} from '@ant-design/icons'
import toast from 'react-hot-toast'
import { useGlobal } from '../../context/GlobalContext'
import PageHeader from '../../components/PageHeader'
import { downloadQuotePDF } from '../../utils/quotePDF'

const { Text } = Typography

const BRAND = '#E5550F'
const NAVY  = '#1e1b4b'

const STATUS_COLOR = { Draft: 'default', Sent: 'blue', Converted: 'success', Expired: 'error' }

// ── WhatsApp message builder ──────────────────────────────────────────
const buildWAText = (q) => encodeURIComponent([
  `*LENSMEN RENTALS — QUOTATION*`,
  `Quote #: ${q.quoteCode}`,
  `Date: ${new Date(q.createdAt).toLocaleDateString('en-GB')}`,
  q.raisedBy ? `Raised by: ${q.raisedBy}` : '',
  ``,
  `*Customer:* ${q.customerName}`,
  `*Rental:* ${new Date(q.startDate).toLocaleDateString('en-GB')} → ${new Date(q.endDate).toLocaleDateString('en-GB')} (${q.totalDays} day${q.totalDays !== 1 ? 's' : ''})`,
  ``,
  `*Equipment:*`,
  ...(q.items || []).map(i => `• ${i.name} × ${i.quantity || 1}  —  ₹${((i.pricePerDay || 0) * (i.quantity || 1) * q.totalDays).toLocaleString()}`),
  ``,
  (q.discountAmount || 0) > 0 ? `Subtotal: ₹${(q.subtotal || 0).toLocaleString()}` : '',
  (q.discountAmount || 0) > 0 ? `Discount: -₹${q.discountAmount.toLocaleString()}` : '',
  q.gstEnabled ? `GST (${q.gstPercent || 18}%): ₹${(q.gstAmount || 0).toLocaleString()}` : '',
  `*TOTAL: ₹${(q.totalPrice || 0).toLocaleString()}*`,
  q.notes ? `\n_Note: ${q.notes}_` : '',
].filter(Boolean).join('\n'))

// ── Quote Preview Modal ───────────────────────────────────────────────
const QuotePreview = ({ quote, onClose, onConvert, onEdit, onRefresh }) => {
  const { API_URL } = useGlobal();
  if (!quote) return null
  const items = quote.items || []
  return (
    <Modal
      open={!!quote} onCancel={onClose} footer={null} width={640}
      title={
        <Space>
          <span style={{ color: NAVY, fontWeight: 700, fontSize: 16 }}>Quote #{quote.quoteCode}</span>
          <Tag color={STATUS_COLOR[quote.status]}>{quote.status}</Tag>
        </Space>
      }
      destroyOnHidden
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
        <div style={{ background: '#f9fafb', borderRadius: 12, padding: '14px 16px', border: '1px solid #f0f0f0' }}>
          <Text style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Customer</Text>
          <div style={{ fontWeight: 700, color: NAVY, fontSize: 14 }}>{quote.customerName}</div>
          {quote.customerMobile && <div style={{ color: BRAND, fontSize: 13, marginTop: 3 }}>{quote.customerMobile}</div>}
          {quote.customerEmail  && <div style={{ color: '#6b7280', fontSize: 12 }}>{quote.customerEmail}</div>}
        </div>
        <div style={{ background: '#f9fafb', borderRadius: 12, padding: '14px 16px', border: '1px solid #f0f0f0' }}>
          <Text style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Rental Period</Text>
          <div style={{ fontWeight: 700, color: NAVY, fontSize: 13 }}>
            {new Date(quote.startDate).toLocaleDateString('en-GB')} → {new Date(quote.endDate).toLocaleDateString('en-GB')}
          </div>
          <div style={{ color: BRAND, fontWeight: 700, fontSize: 13, marginTop: 2 }}>
            {quote.totalDays} day{quote.totalDays !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
      {(quote.raisedBy || quote.gstEnabled) && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          {quote.raisedBy && (
            <div style={{ background: '#f0f0ff', border: '1px solid #e0e0ff', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: NAVY }}>
              <span style={{ color: '#9ca3af', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', marginRight: 6 }}>Raised By</span>
              <span style={{ fontWeight: 600 }}>{quote.raisedBy}</span>
            </div>
          )}
          {quote.gstEnabled && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#166534' }}>
              <span style={{ fontWeight: 700 }}>GST {quote.gstPercent || 18}% included</span>
            </div>
          )}
        </div>
      )}

      {/* Items */}
      <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 50px 80px 90px', padding: '8px 14px', background: NAVY }}>
          {['Equipment', 'Rate/Day', 'Qty', 'Days', 'Amount'].map(h => (
            <Text key={h} style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase' }}>{h}</Text>
          ))}
        </div>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 50px 80px 90px', padding: '10px 14px', background: i % 2 === 0 ? '#fff' : '#fafafa', borderTop: '1px solid #f3f4f6' }}>
            <Text style={{ fontWeight: 600, color: NAVY, fontSize: 13 }}>{item.name}</Text>
            <Text style={{ fontSize: 12, color: '#6b7280' }}>₹{(item.pricePerDay || 0).toLocaleString()}</Text>
            <Text style={{ fontSize: 12, color: '#6b7280' }}>{item.quantity || 1}</Text>
            <Text style={{ fontSize: 12, color: '#6b7280' }}>{quote.totalDays}</Text>
            <Text style={{ fontWeight: 700, color: NAVY, fontSize: 13 }}>₹{((item.pricePerDay || 0) * (item.quantity || 1) * quote.totalDays).toLocaleString()}</Text>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 48 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>Subtotal</Text>
          <Text style={{ fontSize: 13, minWidth: 90, textAlign: 'right' }}>₹{(quote.subtotal || 0).toLocaleString()}</Text>
        </div>
        {(quote.discountAmount || 0) > 0 && (
          <div style={{ display: 'flex', gap: 48 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>Discount</Text>
            <Text style={{ fontSize: 13, color: '#10b981', minWidth: 90, textAlign: 'right' }}>-₹{quote.discountAmount.toLocaleString()}</Text>
          </div>
        )}
        {quote.gstEnabled && (
          <div style={{ display: 'flex', gap: 48 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>GST ({quote.gstPercent || 18}%)</Text>
            <Text style={{ fontSize: 13, color: '#6b7280', minWidth: 90, textAlign: 'right' }}>+₹{(quote.gstAmount || 0).toLocaleString()}</Text>
          </div>
        )}
        <div style={{ display: 'flex', gap: 48, background: NAVY, padding: '10px 16px', borderRadius: 10, marginTop: 4 }}>
          <Text style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>TOTAL</Text>
          <Text style={{ fontSize: 14, fontWeight: 900, color: '#fff', minWidth: 90, textAlign: 'right' }}>₹{(quote.totalPrice || 0).toLocaleString()}</Text>
        </div>
      </div>

      {quote.notes && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
          <Text style={{ fontSize: 10, fontWeight: 700, color: '#92400e', display: 'block', marginBottom: 4 }}>NOTE</Text>
          <Text style={{ fontSize: 13, color: '#78350f' }}>{quote.notes}</Text>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 4 }}>
        <Button icon={<FilePdfOutlined />} onClick={() => downloadQuotePDF(quote)}>Download PDF</Button>
        {quote.customerMobile && (
          <Button
            icon={<WhatsAppOutlined />}
            style={{ borderColor: '#25d366', color: '#25d366' }}
            onClick={() => {
              Modal.confirm({
                title: 'Send WhatsApp Message?',
                content: (
                  <div style={{ marginTop: 8 }}>
                    <p style={{ fontSize: 13, color: '#6b7280' }}>This will automatically send the quotation details directly to the customer's WhatsApp.</p>
                  </div>
                ),
                okText: 'Send Now',
                cancelText: 'Cancel',
                centered: true,
                okButtonProps: { style: { background: '#25d366', borderColor: '#25d366' } },
                onOk: async () => {
                  try {
                    const text = decodeURIComponent(buildWAText(quote));
                    const res = await fetch(`${API_URL}/quotes/${quote._id}/whatsapp`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ text })
                    });
                    if (res.ok) {
                      toast.success('WhatsApp message sent!');
                      if (onRefresh) onRefresh();
                    } else {
                      const data = await res.json();
                      toast.error(data.message || 'Failed to send message');
                    }
                  } catch (e) {
                    toast.error('Network error');
                  }
                }
              })
            }}
          >WhatsApp</Button>
        )}
        {quote.customerEmail && (
          <Button
            icon={<MailOutlined />}
            onClick={() => {
              const sub  = encodeURIComponent(`Quotation ${quote.quoteCode} — Lensmen Rentals`)
              const body = encodeURIComponent(`Dear ${quote.customerName},\n\nPlease find your quotation details below.\n\nQuote #: ${quote.quoteCode}\nTotal: ₹${(quote.totalPrice || 0).toLocaleString()}\nPeriod: ${new Date(quote.startDate).toLocaleDateString('en-GB')} to ${new Date(quote.endDate).toLocaleDateString('en-GB')}\n\nThank you for choosing Lensmen Rentals.`)
              window.open(`mailto:${quote.customerEmail}?subject=${sub}&body=${body}`)
            }}
          >Email</Button>
        )}
        <div style={{ flex: 1 }} />
        {quote.status !== 'Converted' && <Button icon={<EditOutlined />} onClick={onEdit}>Edit</Button>}
        {quote.status !== 'Converted' && (
          <Button type="primary" icon={<CheckOutlined />} onClick={onConvert} style={{ background: '#10b981', borderColor: '#10b981' }}>
            Convert to Order
          </Button>
        )}
      </div>
    </Modal>
  )
}

// ── Quote Form Drawer ─────────────────────────────────────────────────
const QuoteDrawer = ({ open, onClose, initial, onSaved, products, knownRaisers }) => {
  const { API_URL } = useGlobal()
  const [form]        = Form.useForm()
  const [items,       setItems]       = useState([])
  const [dates,       setDates]       = useState(null)
  const [days,        setDays]        = useState(1)
  const [loading,     setLoading]     = useState(false)
  const [discount,    setDiscount]    = useState(0)
  const [gstEnabled,  setGstEnabled]  = useState(false)
  const [raisedBy,    setRaisedBy]    = useState('')
  const [regUsers,    setRegUsers]    = useState([])
  const [nameInput,   setNameInput]   = useState('')

  useEffect(() => {
    fetch(`${API_URL}/admin/users`)
      .then(r => r.json())
      .then(d => setRegUsers(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [API_URL])

  useEffect(() => {
    if (!open) return
    setItems(initial?.items || [])
    setDates(initial ? [dayjs(initial.startDate), dayjs(initial.endDate)] : null)
    setDays(initial?.totalDays || 1)
    setDiscount(initial?.discountAmount || 0)
    setGstEnabled(initial?.gstEnabled || false)
    const savedRaisedBy = localStorage.getItem('lmr_quote_raisedBy') || ''
    setRaisedBy(initial?.raisedBy || savedRaisedBy)
    const name = initial?.customerName || ''
    setNameInput(name)
    form.setFieldsValue({
      customerName:   name,
      customerMobile: initial?.customerMobile || '',
      customerEmail:  initial?.customerEmail  || '',
      notes:          initial?.notes          || '',
      discountAmount: initial?.discountAmount || 0,
    })
  }, [open, initial])

  const userOptions = nameInput.trim().length > 0
    ? regUsers
        .filter(u =>
          u.fullName?.toLowerCase().includes(nameInput.toLowerCase()) ||
          u.email?.toLowerCase().includes(nameInput.toLowerCase()) ||
          (u.mobile || '').includes(nameInput) ||
          (u.userId || '').toLowerCase().includes(nameInput.toLowerCase())
        )
        .slice(0, 6)
        .map(u => ({
          value: u.fullName,
          label: (
            <div style={{ padding: '2px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 600, color: NAVY, fontSize: 13 }}>{u.fullName}</span>
                {u.userId && <span style={{ fontFamily: 'monospace', fontSize: 10, color: BRAND, background: '#fff7ed', padding: '1px 6px', borderRadius: 4, border: '1px solid #fed7aa' }}>{u.userId}</span>}
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>{[u.mobile, u.email].filter(Boolean).join(' · ')}</div>
            </div>
          ),
          _user: u,
        }))
    : []

  const handleSelectUser = (value, option) => {
    const u = option._user
    setNameInput(u.fullName)
    form.setFieldsValue({
      customerName:   u.fullName,
      customerMobile: u.mobile || '',
      customerEmail:  u.email  || '',
    })
  }

  const subtotal      = items.reduce((s, it) => s + (it.pricePerDay || 0) * (it.quantity || 1) * days, 0)
  const afterDiscount = Math.max(0, subtotal - discount)
  const gstAmount     = gstEnabled ? Math.round(afterDiscount * 18 / 100) : 0
  const totalPrice    = afterDiscount + gstAmount

  const addProduct = (productId) => {
    const p = products.find(x => x._id === productId)
    if (!p) return
    if (items.find(i => i.productId === p._id)) { toast.error('Already added'); return }
    setItems(prev => [...prev, { productId: p._id, name: p.name, pricePerDay: p.pricePerDay, imageUrl: p.imageUrl, quantity: 1 }])
  }

  const updateQty   = (idx, qty)   => setItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: Math.max(1, qty || 1) } : it))
  const updatePrice = (idx, price) => setItems(prev => prev.map((it, i) => i === idx ? { ...it, pricePerDay: Math.max(0, price || 0) } : it))
  const removeItem  = (idx)        => setItems(prev => prev.filter((_, i) => i !== idx))

  const handleSave = async () => {
    const values = await form.validateFields()
    if (!dates?.[0] || !dates?.[1]) { toast.error('Select rental dates'); return }
    if (items.length === 0) { toast.error('Add at least one item'); return }
    setLoading(true)
    try {
      if (raisedBy.trim()) localStorage.setItem('lmr_quote_raisedBy', raisedBy.trim())
      const payload = { ...values, items, startDate: dates[0].toDate(), endDate: dates[1].toDate(), gstEnabled, gstPercent: 18, raisedBy: raisedBy.trim() }
      const url    = initial ? `${API_URL}/quotes/${initial._id}` : `${API_URL}/quotes`
      const method = initial ? 'PUT' : 'POST'
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data   = await res.json()
      if (res.ok) { toast.success(initial ? 'Quote updated' : 'Quote created'); onSaved(data); onClose() }
      else toast.error(data.message || 'Failed')
    } catch { toast.error('Network error') }
    finally { setLoading(false) }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={<span style={{ color: NAVY, fontWeight: 700 }}>{initial ? `Edit #${initial.quoteCode}` : 'New Quotation'}</span>}
      width={560}
      extra={<Button type="primary" loading={loading} onClick={handleSave}>{initial ? 'Save Changes' : 'Create Quote'}</Button>}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Divider orientation="left" style={{ fontSize: 11, color: '#9ca3af' }}>Quote Details</Divider>

        <Form.Item label="Raised By">
          <AutoComplete
            options={[...new Set(knownRaisers.filter(Boolean))].map(n => ({ value: n, label: n }))}
            value={raisedBy}
            onChange={setRaisedBy}
            placeholder="Who is creating this quote?"
            allowClear
            filterOption={(input, opt) => opt.value.toLowerCase().includes(input.toLowerCase())}
          />
        </Form.Item>

        <Divider orientation="left" style={{ fontSize: 11, 
          color: '#9ca3af' }}>CUSTOMER DETAILS</Divider>

        <Form.Item label="Customer Name" name="customerName" rules={[{ required: true, message: 'Name is required' }]}>
          <AutoComplete
            options={userOptions}
            value={nameInput}
            onChange={(val) => { setNameInput(val); form.setFieldValue('customerName', val) }}
            onSelect={handleSelectUser}
            placeholder="Name, mobile, or email..."
            size="large"
            style={{ width: '100%' }}
            notFoundContent={nameInput.trim().length > 0 ? <span style={{ fontSize: 12, color: '#9ca3af', padding: '4px 8px', display: 'block' }}>No registered user found — fill manually</span> : null}
          />
        </Form.Item>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Form.Item label="Mobile" name="customerMobile">
            <Input placeholder="+91 9876543210" />
          </Form.Item>
          <Form.Item label="Email" name="customerEmail">
            <Input placeholder="email@example.com" />
          </Form.Item>
        </div>

        <Divider orientation="left" style={{ fontSize: 11, color: '#9ca3af' }}>RENTAL PERIOD</Divider>

        <Form.Item label="Start & End Date/Time" required>
          <RangePicker
            value={dates}
            onChange={(d) => {
              setDates(d)
              if (d?.[0] && d?.[1]) {
                setDays(Math.max(1, Math.round(Math.abs(new Date(d[1].toDate().toDateString()) - new Date(d[0].toDate().toDateString())) / 86400000) + 1))
              }
            }}
            showTime
            format="DD/MM/YYYY HH:mm"
            style={{ width: '100%' }}
            size="large"
          />
          {days > 0 && <Text type="secondary" style={{ fontSize: 12 }}>Duration: <strong>{days} day{days !== 1 ? 's' : ''}</strong></Text>}
        </Form.Item>

        <Divider orientation="left" style={{ fontSize: 11, color: '#9ca3af' }}>EQUIPMENT</Divider>

        <Select
          showSearch
          placeholder="Search and add a product..."
          filterOption={(input, opt) => opt.label.toLowerCase().includes(input.toLowerCase())}
          options={products.map(p => ({
            value: p._id,
            label: `${p.name} — ₹${p.pricePerDay}/day`,
            disabled: !!items.find(i => i.productId === p._id),
          }))}
          onChange={addProduct}
          value={null}
          style={{ width: '100%', marginBottom: 12 }}
          size="large"
        />

        {items.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: '#d1d5db', fontSize: 12, border: '2px dashed #f0f0f0', borderRadius: 10 }}>
            No items added yet — search products above
          </div>
        ) : (
          <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
            {items.map((item, idx) => (
              <div key={idx} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                borderBottom: idx < items.length - 1 ? '1px solid #f3f4f6' : 'none',
                background: idx % 2 === 0 ? '#fff' : '#fafafa',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: NAVY, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>₹</span>
                    <InputNumber
                      min={0}
                      value={item.pricePerDay}
                      onChange={(v) => updatePrice(idx, v)}
                      size="small"
                      style={{ width: 80 }}
                      controls={false}
                    />
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>/day × {days} days</span>
                  </div>
                </div>
                <InputNumber min={1} max={20} value={item.quantity} onChange={(v) => updateQty(idx, v)} size="small" style={{ width: 60 }} />
                <div style={{ minWidth: 72, textAlign: 'right', fontWeight: 700, fontSize: 13, color: NAVY }}>
                  ₹{((item.pricePerDay || 0) * (item.quantity || 1) * days).toLocaleString()}
                </div>
                <Button type="text" size="small" danger onClick={() => removeItem(idx)} style={{ padding: '0 4px', lineHeight: 1 }}>✕</Button>
              </div>
            ))}
          </div>
        )}

        <Divider orientation="left" style={{ fontSize: 11, color: '#9ca3af', marginTop: 20 }}>PRICING</Divider>

        <Form.Item label="Discount (₹)" name="discountAmount">
          <InputNumber min={0} max={subtotal} style={{ width: '100%' }} prefix="₹" onChange={(v) => setDiscount(v || 0)} />
        </Form.Item>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f9fafb', border: '1px solid #f0f0f0', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 600, color: NAVY, fontSize: 13 }}>GST (18%)</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>{gstEnabled ? `+₹${gstAmount.toLocaleString()} will be added` : 'Not included in total'}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: gstEnabled ? '#10b981' : '#9ca3af', fontWeight: 600 }}>{gstEnabled ? 'With GST' : 'Without GST'}</span>
            <Switch checked={gstEnabled} onChange={setGstEnabled} style={{ background: gstEnabled ? '#10b981' : undefined }} />
          </div>
        </div>

        {/* Live total */}
        <div style={{ background: NAVY, borderRadius: 12, padding: '14px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 700, textTransform: 'uppercase' }}>Subtotal</div>
            <div style={{ fontSize: 15, color: '#fff', fontWeight: 700 }}>₹{subtotal.toLocaleString()}</div>
          </div>
          {discount > 0 && (
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 700, textTransform: 'uppercase' }}>Discount</div>
              <div style={{ fontSize: 15, color: '#86efac', fontWeight: 700 }}>-₹{discount.toLocaleString()}</div>
            </div>
          )}
          {gstEnabled && (
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 700, textTransform: 'uppercase' }}>GST 18%</div>
              <div style={{ fontSize: 15, color: '#6ee7b7', fontWeight: 700 }}>+₹{gstAmount.toLocaleString()}</div>
            </div>
          )}
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 700, textTransform: 'uppercase' }}>Total</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>₹{totalPrice.toLocaleString()}</div>
          </div>
        </div>

        <Form.Item label="Notes / Remarks" name="notes">
          <TextArea rows={3} placeholder="Special terms, instructions, or remarks..." />
        </Form.Item>
      </Form>
    </Drawer>
  )
}

const fmtDateQ = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const KYC_CLR  = { Approved: '#10b981', Pending: '#f59e0b', Rejected: '#ef4444', 'Not Uploaded': '#94a3b8' }

// ── Main Page ─────────────────────────────────────────────────────────
const Quotes = () => {
  const { API_URL, products, fetchProducts, allUsers, allOrders, fetchAdminData } = useGlobal()
  const navigate = useNavigate()
  const [quotes,          setQuotes]          = useState([])
  const [loading,         setLoading]         = useState(true)
  const [previewQuote,    setPreviewQuote]    = useState(null)
  const [previewUser,     setPreviewUser]     = useState(null)
  const [createUserModal, setCreateUserModal] = useState(null)  // quote object pending convert
  const [creatingUser,    setCreatingUser]    = useState(false)

  const loadQuotes = async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${API_URL}/quotes`)
      const data = await res.json()
      setQuotes(Array.isArray(data) ? data : [])
    } catch { toast.error('Failed to load quotes') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    loadQuotes()
    if (products.length === 0) fetchProducts()
    if (allUsers.length === 0) fetchAdminData('/admin/users')
  }, [])

  const handleCustomerClick = (e, q) => {
    e.stopPropagation()
    const user = allUsers.find(u =>
      (q.customerEmail && u.email === q.customerEmail) ||
      (q.customerMobile && u.mobile === q.customerMobile)
    )
    if (user) {
      setPreviewUser({ type: 'registered', user })
    } else {
      setPreviewUser({ type: 'guest', name: q.customerName, mobile: q.customerMobile, email: q.customerEmail })
    }
  }

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/quotes/${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Quote deleted'); setQuotes(q => q.filter(x => x._id !== id)) }
    } catch { toast.error('Delete failed') }
  }

  const doConvert = async (quote) => {
    try {
      const res  = await fetch(`${API_URL}/quotes/${quote._id}/convert`, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      const data = await res.json()
      if (res.ok) { toast.success('Quote converted to order!'); setPreviewQuote(null); loadQuotes() }
      else toast.error(data.message || 'Conversion failed')
    } catch { toast.error('Network error') }
  }

  const handleConvert = async (quote) => {
    if (!quote.customerEmail) { doConvert(quote); return }
    try {
      const res  = await fetch(`${API_URL}/admin/users/check-email?email=${encodeURIComponent(quote.customerEmail)}`)
      const data = await res.json()
      if (data.exists) {
        doConvert(quote)
      } else {
        setCreateUserModal(quote)
      }
    } catch { doConvert(quote) }
  }

  const handleCreateUserAndConvert = async () => {
    if (!createUserModal) return
    setCreatingUser(true)
    try {
      await fetch(`${API_URL}/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: createUserModal.customerName,
          email:    createUserModal.customerEmail,
          mobile:   createUserModal.customerMobile,
        }),
      })
      await doConvert(createUserModal)
      toast.success('Account created and quote converted!')
    } catch { toast.error('Failed') }
    finally { setCreatingUser(false); setCreateUserModal(null) }
  }

  const stats = {
    total:     quotes.length,
    draft:     quotes.filter(q => q.status === 'Draft').length,
    sent:      quotes.filter(q => q.status === 'Sent').length,
    converted: quotes.filter(q => q.status === 'Converted').length,
  }

  const columns = [
    {
      title: 'Quote No',
      dataIndex: 'quoteCode',
      key: 'quoteCode',
      render: code => (
        <Space>
          <Text strong style={{ color: NAVY, fontFamily: 'monospace', fontSize: 13 }}>{code}</Text>
          <Tooltip title="Copy">
            <Button type="text" size="small" icon={<CopyOutlined style={{ fontSize: 11 }} />} style={{ padding: '0 2px', color: '#9ca3af', height: 20 }} onClick={() => { navigator.clipboard.writeText(code); toast.success('Copied!') }} />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_, q) => (
        <div>
          <div
            onClick={e => handleCustomerClick(e, q)}
            style={{ fontWeight: 600, color: NAVY, fontSize: 13, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2, display: 'inline-block' }}
          >
            {q.customerName}
          </div>
          {q.customerMobile && <div style={{ fontSize: 12, color: BRAND }}>{q.customerMobile}</div>}
        </div>
      ),
    },
    {
      title: 'Equipment',
      key: 'items',
      render: (_, q) => (
        <div>
          {(q.items || []).slice(0, 2).map((item, i) => (
            <div key={i} style={{ fontSize: 12, color: '#374151' }}>• {item.name}</div>
          ))}
          {(q.items || []).length > 2 && <div style={{ fontSize: 11, color: '#9ca3af' }}>+{q.items.length - 2} more</div>}
        </div>
      ),
    },
    {
      title: 'Period',
      key: 'period',
      render: (_, q) => (
        <div>
          <div style={{ fontWeight: 600, color: NAVY, fontSize: 13 }}>{new Date(q.startDate).toLocaleDateString('en-GB')}</div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>{q.totalDays} day{q.totalDays !== 1 ? 's' : ''}</div>
        </div>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'totalPrice',
      key: 'total',
      render: v => <Text strong style={{ color: NAVY, fontSize: 14 }}>₹{(v || 0).toLocaleString()}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: s => <Tag color={STATUS_COLOR[s]} style={{ fontWeight: 600 }}>{s}</Tag>,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: d => <Text type="secondary" style={{ fontSize: 12 }}>{new Date(d).toLocaleDateString('en-GB')}</Text>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, q) => (
        <Space>
          <Tooltip title="Preview"><Button size="small" icon={<EyeOutlined />} onClick={() => setPreviewQuote(q)} /></Tooltip>
          <Tooltip title="PDF"><Button size="small" icon={<FilePdfOutlined />} onClick={() => downloadQuotePDF(q)} /></Tooltip>
          {q.customerMobile && (
            <Tooltip title="WhatsApp">
              <Button size="small" icon={<WhatsAppOutlined />} style={{ color: '#25d366', borderColor: '#25d366' }}
                onClick={() => {
                  Modal.confirm({
                    title: 'Send WhatsApp Message?',
                    content: (
                      <div style={{ marginTop: 8 }}>
                        <p style={{ fontSize: 13, color: '#6b7280' }}>This will automatically send the quotation details directly to the customer's WhatsApp.</p>
                      </div>
                    ),
                    okText: 'Send Now',
                    cancelText: 'Cancel',
                    centered: true,
                    okButtonProps: { style: { background: '#25d366', borderColor: '#25d366' } },
                    onOk: async () => {
                      try {
                        const text = decodeURIComponent(buildWAText(q));
                        const res = await fetch(`${API_URL}/quotes/${q._id}/whatsapp`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ text })
                        });
                        if (res.ok) {
                          toast.success('WhatsApp message sent!');
                          loadQuotes();
                        } else {
                          const data = await res.json();
                          toast.error(data.message || 'Failed to send message');
                        }
                      } catch (e) {
                        toast.error('Network error');
                      }
                    }
                  })
                }}
              />
            </Tooltip>
          )}
          {q.status !== 'Converted' && (
            <Tooltip title="Edit"><Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/admin/quotes/${q._id}/edit`)} /></Tooltip>
          )}
          {q.status !== 'Converted' && (
            <Tooltip title="Convert to Order">
              <Button size="small" icon={<CheckOutlined />} style={{ background: '#10b981', borderColor: '#10b981', color: '#fff' }} onClick={() => handleConvert(q)} />
            </Tooltip>
          )}
          {q.status !== 'Converted' && (
            <Popconfirm title="Delete quote?" description="Cannot be undone." onConfirm={() => handleDelete(q._id)} okText="Delete" okButtonProps={{ danger: true }}>
              <Button size="small" icon={<DeleteOutlined />} danger />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Offline Inquiries"
        title="Quotation Management"
        subtitle="Create, share and convert quotes for walk-in customers"
        actions={
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => navigate('/admin/quotes/new')}>
            New Quote
          </Button>
        }
      />

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Quotes',  value: stats.total,     color: NAVY },
          { label: 'Drafts',        value: stats.draft,     color: '#6b7280' },
          { label: 'Sent',          value: stats.sent,      color: '#3b82f6' },
          { label: 'Converted',     value: stats.converted, color: '#10b981' },
        ].map(s => (
          <div key={s.label} style={{
            background: '#fff', borderRadius: 12, padding: '12px 20px',
            border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <Table
          columns={columns}
          dataSource={quotes}
          rowKey="_id"
          loading={loading}
          pagination={{ defaultPageSize: 10, showSizeChanger: true, showTotal: (t, r) => `Showing ${r[0]}-${r[1]} of ${t}` }}
        />
      </div>

      <QuotePreview
        quote={previewQuote}
        onClose={() => setPreviewQuote(null)}
        onConvert={() => handleConvert(previewQuote)}
        onEdit={() => { navigate(`/admin/quotes/${previewQuote._id}/edit`); setPreviewQuote(null) }}
        onRefresh={loadQuotes}
      />

      {/* ── Unregistered user confirm modal ── */}
      <Modal
        open={!!createUserModal}
        onCancel={() => setCreateUserModal(null)}
        footer={null}
        width={440}
        title={null}
        destroyOnHidden
      >
        {createUserModal && (
          <div style={{ padding: '8px 0' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 6 }}>Customer not registered</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, lineHeight: 1.6 }}>
              <strong style={{ color: NAVY }}>{createUserModal.customerName}</strong> ({createUserModal.customerEmail}) does not have an account yet.
              Create a free account for them so they can log in, view their order, and upload KYC documents.
            </div>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 14px', marginBottom: 20, fontSize: 12, color: '#15803d', lineHeight: 1.6 }}>
              ✓ Account will be created without a password<br />
              ✓ Customer can use <strong>"Forgot Password"</strong> on the login page to set their password<br />
              ✓ A notification will be sent to their account
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button onClick={() => { setCreateUserModal(null); doConvert(createUserModal) }}>
                Skip & Convert Only
              </Button>
              <Button
                type="primary"
                loading={creatingUser}
                onClick={handleCreateUserAndConvert}
                style={{ background: '#10b981', borderColor: '#10b981' }}
              >
                Create Account & Convert
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Customer preview drawer ─────────────────────────────── */}
      {previewUser && (() => {
        if (previewUser.type === 'guest') {
          const g = previewUser
          return (
            <Drawer
              open
              onClose={() => setPreviewUser(null)}
              placement="right"
              width={400}
              destroyOnHidden
              styles={{ body: { padding: 0 }, header: { display: 'none' } }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar size={44} style={{ background: '#e5e7eb', color: '#9ca3af' }} icon={<UserOutlined />} />
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>{g.name}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Walk-in / Unregistered Customer</div>
                    </div>
                  </div>
                  <button onClick={() => setPreviewUser(null)} style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: 16 }}>×</button>
                </div>
                <div style={{ flex: 1, padding: '20px 24px' }}>
                  <AntDivider orientation="left" style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 0 }}>Contact</AntDivider>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {g.mobile && (
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Mobile</div>
                        <div style={{ fontSize: 13, color: BRAND, fontWeight: 600 }}>{g.mobile}</div>
                      </div>
                    )}
                    {g.email && (
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Email</div>
                        <div style={{ fontSize: 13, color: '#1e293b', fontWeight: 500 }}>{g.email}</div>
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: 24, padding: '14px 16px', background: '#f9fafb', borderRadius: 10, border: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>This customer is not registered in the system.</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Add them as a registered user to track orders and KYC.</div>
                  </div>
                </div>
              </div>
            </Drawer>
          )
        }

        const u = previewUser.user
        const userOrders  = allOrders.filter(o => o.userEmail === u.email || o.userMobile === u.mobile)
        const totalSpent  = userOrders.reduce((s, o) => s + (o.totalPaid || 0), 0)
        const outstanding = userOrders.reduce((s, o) => s + (o.pendingAmount || 0), 0)
        const kycStatus   = u.kycStatus || 'Not Uploaded'
        const kycColor    = KYC_CLR[kycStatus] || '#94a3b8'

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
                  <Avatar size={44} style={{ background: 'linear-gradient(135deg,#1e1b4b,#3730a3)', fontWeight: 800, fontSize: 18, flexShrink: 0 }} icon={<UserOutlined />} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>{u.fullName}</span>
                      <Tag color={u.role === 'admin' ? 'geekblue' : 'default'} style={{ fontSize: 10 }}>{u.role}</Tag>
                      <span style={{ fontSize: 11, fontWeight: 700, color: kycColor, background: `${kycColor}18`, border: `1px solid ${kycColor}40`, borderRadius: 4, padding: '1px 7px' }}>{kycStatus}</span>
                    </div>
                    {u.userId && (
                      <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: BRAND, background: '#fff7ed', border: '1px solid #fed7aa', padding: '1px 7px', borderRadius: 4, marginTop: 3, display: 'inline-block' }}>{u.userId}</span>
                    )}
                  </div>
                </div>
                <button onClick={() => setPreviewUser(null)} style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: 16, flexShrink: 0 }}>×</button>
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
                <AntDivider orientation="left" style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 0 }}>Contact</AntDivider>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', marginBottom: 20 }}>
                  {[
                    { label: 'Email',        value: u.email },
                    { label: 'Mobile',       value: u.mobile || '—' },
                    { label: 'Account Type', value: u.accountType || 'Private' },
                    { label: 'Class',        value: u.customerClass || 'New' },
                    { label: 'Joined',       value: fmtDateQ(u.createdAt) },
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

                <div style={{ marginTop: 8 }}>
                  <button
                    onClick={() => { setPreviewUser(null); navigate(`/admin/users?uid=${u._id}`) }}
                    style={{ width: '100%', padding: '10px 0', borderRadius: 10, border: `1.5px solid ${NAVY}`, background: 'transparent', color: NAVY, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <LinkOutlined /> Open Full Profile
                  </button>
                </div>
              </div>
            </div>
          </Drawer>
        )
      })()}
    </div>
  )
}

export default Quotes
