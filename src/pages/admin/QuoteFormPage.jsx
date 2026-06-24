import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Form, Input, InputNumber, Select, AutoComplete, Switch, DatePicker, Button,
  Divider, Typography,
} from 'antd'
import { ArrowLeftOutlined, HolderOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { useGlobal } from '../../context/GlobalContext'

const { Text } = Typography
const { TextArea } = Input
const { RangePicker } = DatePicker

const BRAND = '#E5550F'
const NAVY  = '#1e1b4b'

const QuoteFormPage = () => {
  const { id } = useParams()
  const isEdit  = !!id
  const navigate = useNavigate()
  const { API_URL, products, fetchProducts } = useGlobal()

  const [form]       = Form.useForm()
  const [items,      setItems]      = useState([])
  const [dates,      setDates]      = useState(null)
  const [days,       setDays]       = useState(1)
  const [loading,    setLoading]    = useState(false)
  const [fetching,   setFetching]   = useState(isEdit)
  const [discount,   setDiscount]   = useState(0)
  const [gstEnabled, setGstEnabled] = useState(false)
  const [raisedBy,   setRaisedBy]   = useState('')
  const [regUsers,   setRegUsers]   = useState([])
  const [nameInput,  setNameInput]  = useState('')
  const [knownRaisers, setKnownRaisers] = useState([])
  const [quoteCode,  setQuoteCode]  = useState(null)

  // Load products + registered users + known raisers
  useEffect(() => {
    if (products.length === 0) fetchProducts()

    fetch(`${API_URL}/admin/users`)
      .then(r => r.json())
      .then(d => setRegUsers(Array.isArray(d) ? d : []))
      .catch(() => {})

    fetch(`${API_URL}/quotes`)
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) {
          setKnownRaisers([...new Set(d.map(q => q.raisedBy).filter(Boolean))])
        }
      })
      .catch(() => {})
  }, [API_URL])

  // Load quote data when editing
  useEffect(() => {
    if (!isEdit) {
      const saved = localStorage.getItem('lmr_quote_raisedBy') || ''
      setRaisedBy(saved)
      return
    }
    setFetching(true)
    fetch(`${API_URL}/quotes/${id}`)
      .then(r => r.json())
      .then(q => {
        setItems(q.items || [])
        setDates([dayjs(q.startDate), dayjs(q.endDate)])
        setDays(q.totalDays || 1)
        setDiscount(q.discountAmount || 0)
        setGstEnabled(q.gstEnabled || false)
        setRaisedBy(q.raisedBy || localStorage.getItem('lmr_quote_raisedBy') || '')
        setQuoteCode(q.quoteCode)
        const name = q.customerName || ''
        setNameInput(name)
        form.setFieldsValue({
          quoteCode:      q.quoteCode      || '',
          customerName:   name,
          customerMobile: q.customerMobile || '',
          customerEmail:  q.customerEmail  || '',
          notes:          q.notes          || '',
          discountAmount: q.discountAmount || 0,
        })
      })
      .catch(() => toast.error('Failed to load quote'))
      .finally(() => setFetching(false))
  }, [id])

  // User autocomplete options
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

  // Calculations
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

  // ── Equipment drag-to-reorder ──────────────────────────────────
  const dragItemIdx = useRef(null)
  const [draggingItemIdx, setDraggingItemIdx] = useState(null)
  const [dragOverItemIdx, setDragOverItemIdx] = useState(null)

  const onItemDragStart = (e, idx) => {
    dragItemIdx.current = idx
    setDraggingItemIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
  }
  const onItemDragOver = (e, idx) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverItemIdx(idx)
  }
  const onItemDrop = (e, idx) => {
    e.preventDefault()
    const from = dragItemIdx.current
    if (from === null || from === idx) { cleanupItemDrag(); return }
    setItems(prev => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(idx, 0, moved)
      return next
    })
    cleanupItemDrag()
  }
  const cleanupItemDrag = () => { dragItemIdx.current = null; setDraggingItemIdx(null); setDragOverItemIdx(null) }

  const handleSave = async () => {
    const values = await form.validateFields()
    if (!dates?.[0] || !dates?.[1]) { toast.error('Select rental dates'); return }
    if (items.length === 0) { toast.error('Add at least one item'); return }
    setLoading(true)
    try {
      if (raisedBy.trim()) localStorage.setItem('lmr_quote_raisedBy', raisedBy.trim())
      const payload = {
        ...values, items,
        startDate: dates[0].toDate(), endDate: dates[1].toDate(),
        gstEnabled, gstPercent: 18,
        raisedBy: raisedBy.trim(),
        quoteCode: values.quoteCode?.trim() || undefined,
      }
      const url    = isEdit ? `${API_URL}/quotes/${id}` : `${API_URL}/quotes`
      const method = isEdit ? 'PUT' : 'POST'
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data   = await res.json()
      if (res.ok) {
        toast.success(isEdit ? 'Quote updated' : 'Quote created')
        navigate('/admin/quotes')
      } else {
        toast.error(data.message || 'Failed')
      }
    } catch { toast.error('Network error') }
    finally { setLoading(false) }
  }

  if (fetching) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#9ca3af' }}>
        Loading quote…
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 28, gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/admin/quotes')}
            style={{ borderRadius: 8 }}
          />
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Offline Inquiries
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: NAVY, lineHeight: 1.2 }}>
              {isEdit ? `Edit Quote #${quoteCode || id}` : 'New Quotation'}
            </h1>
          </div>
        </div>
        <Button
          type="primary"
          size="large"
          loading={loading}
          onClick={handleSave}
          style={{ background: NAVY, borderColor: NAVY, borderRadius: 10, fontWeight: 700, height: 42, paddingInline: 28 }}
        >
          {isEdit ? 'Save Changes' : 'Create Quote'}
        </Button>
      </div>

      <Form form={form} layout="vertical">
        {/* Two-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

          {/* ── LEFT COLUMN ─────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

            {/* Quote Meta */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', padding: '20px 24px', marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Quote Meta</div>
              <Form.Item label="Quote Code" name="quoteCode" style={{ marginBottom: 12 }}
                help={isEdit ? 'Edit to rename this quote code' : 'Leave blank to auto-generate (e.g. LR-260624-008)'}
              >
                <Input
                  placeholder={isEdit ? quoteCode || 'Auto-generated' : 'Leave blank to auto-generate'}
                  style={{ fontFamily: 'monospace', fontWeight: 600 }}
                  allowClear
                />
              </Form.Item>
              <Form.Item label="Raised By" style={{ marginBottom: 0 }}>
                <AutoComplete
                  options={knownRaisers.map(n => ({ value: n, label: n }))}
                  value={raisedBy}
                  onChange={setRaisedBy}
                  placeholder="Who is creating this quote?"
                  allowClear
                  filterOption={(input, opt) => opt.value.toLowerCase().includes(input.toLowerCase())}
                />
              </Form.Item>
            </div>

            {/* Customer Details */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', padding: '20px 24px', marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Customer Details</div>

              <Form.Item label="Customer Name" name="customerName" rules={[{ required: true, message: 'Name is required' }]}>
                <AutoComplete
                  options={userOptions}
                  value={nameInput}
                  onChange={(val) => { setNameInput(val); form.setFieldValue('customerName', val) }}
                  onSelect={handleSelectUser}
                  placeholder="Name, mobile, email or user ID..."
                  size="large"
                  style={{ width: '100%' }}
                  notFoundContent={
                    nameInput.trim().length > 0
                      ? <span style={{ fontSize: 12, color: '#9ca3af', padding: '4px 8px', display: 'block' }}>No registered user — fill manually</span>
                      : null
                  }
                />
              </Form.Item>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Form.Item label="Mobile" name="customerMobile" style={{ marginBottom: 0 }}>
                  <Input placeholder="+91 9876543210" />
                </Form.Item>
                <Form.Item label="Email" name="customerEmail" style={{ marginBottom: 0 }}>
                  <Input placeholder="email@example.com" />
                </Form.Item>
              </div>
            </div>

            {/* Rental Period */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', padding: '20px 24px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Rental Period</div>

              <Form.Item label="Start & End Date/Time" required style={{ marginBottom: 6 }}>
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
              </Form.Item>
              {days > 0 && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Duration: <strong>{days} day{days !== 1 ? 's' : ''}</strong>
                </Text>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN ────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

            {/* Equipment */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', padding: '20px 24px', marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Equipment</div>

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
                style={{ width: '100%', marginBottom: 14 }}
                size="large"
              />

              {items.length === 0 ? (
                <div style={{ padding: '28px 0', textAlign: 'center', color: '#d1d5db', fontSize: 13, border: '2px dashed #f0f0f0', borderRadius: 10 }}>
                  No items added yet — search products above
                </div>
              ) : (
                <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, overflow: 'hidden' }}>
                  {items.map((item, idx) => {
                    const isDragging = draggingItemIdx === idx
                    const isOver     = dragOverItemIdx === idx && draggingItemIdx !== idx
                    return (
                      <div
                        key={item.productId || idx}
                        draggable
                        onDragStart={e => onItemDragStart(e, idx)}
                        onDragOver={e => onItemDragOver(e, idx)}
                        onDrop={e => onItemDrop(e, idx)}
                        onDragEnd={cleanupItemDrag}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
                          borderBottom: idx < items.length - 1 ? '1px solid #f3f4f6' : 'none',
                          background: isDragging ? '#f0f1f7' : isOver ? '#fff7ed' : idx % 2 === 0 ? '#fff' : '#fafafa',
                          borderLeft: isOver ? `3px solid ${BRAND}` : '3px solid transparent',
                          opacity: isDragging ? 0.45 : 1,
                          cursor: 'grab',
                          transition: 'background 0.1s, border-color 0.1s',
                        }}
                      >
                        {/* Drag handle */}
                        <div style={{ color: '#d1d5db', fontSize: 14, flexShrink: 0, cursor: 'grab' }}>
                          <HolderOutlined />
                        </div>

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
                        <div style={{ minWidth: 80, textAlign: 'right', fontWeight: 700, fontSize: 13, color: NAVY }}>
                          ₹{((item.pricePerDay || 0) * (item.quantity || 1) * days).toLocaleString()}
                        </div>
                        <Button type="text" size="small" danger onClick={() => removeItem(idx)} style={{ padding: '0 4px' }}>✕</Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Pricing */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', padding: '20px 24px', marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Pricing</div>

              <Form.Item label="Discount (₹)" name="discountAmount">
                <InputNumber min={0} max={subtotal} style={{ width: '100%' }} prefix="₹" onChange={(v) => setDiscount(v || 0)} />
              </Form.Item>

              {/* GST toggle */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#f9fafb', border: '1px solid #f0f0f0', borderRadius: 10,
                padding: '12px 16px', marginBottom: 20,
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: NAVY, fontSize: 13 }}>GST (18%)</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>
                    {gstEnabled ? `+₹${gstAmount.toLocaleString()} will be added` : 'Not included in total'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: gstEnabled ? '#10b981' : '#9ca3af', fontWeight: 600 }}>
                    {gstEnabled ? 'With GST' : 'Without GST'}
                  </span>
                  <Switch checked={gstEnabled} onChange={setGstEnabled} style={{ background: gstEnabled ? '#10b981' : undefined }} />
                </div>
              </div>

              {/* Live total bar */}
              <div style={{
                background: NAVY, borderRadius: 12, padding: '16px 20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
              }}>
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 700, textTransform: 'uppercase' }}>Subtotal</div>
                  <div style={{ fontSize: 16, color: '#fff', fontWeight: 700 }}>₹{subtotal.toLocaleString()}</div>
                </div>
                {discount > 0 && (
                  <div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 700, textTransform: 'uppercase' }}>Discount</div>
                    <div style={{ fontSize: 16, color: '#86efac', fontWeight: 700 }}>-₹{discount.toLocaleString()}</div>
                  </div>
                )}
                {gstEnabled && (
                  <div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 700, textTransform: 'uppercase' }}>GST 18%</div>
                    <div style={{ fontSize: 16, color: '#6ee7b7', fontWeight: 700 }}>+₹{gstAmount.toLocaleString()}</div>
                  </div>
                )}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 700, textTransform: 'uppercase' }}>Total</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1 }}>₹{totalPrice.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', padding: '20px 24px' }}>
              <Form.Item label="Notes / Remarks" name="notes" style={{ marginBottom: 0 }}>
                <TextArea rows={3} placeholder="Special terms, instructions, or remarks..." />
              </Form.Item>
            </div>
          </div>
        </div>
      </Form>
    </div>
  )
}

export default QuoteFormPage
