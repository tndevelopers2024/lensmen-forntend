import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Button, Input, Drawer, Form, Tag, Popconfirm,
  Tooltip, Empty, Spin, Table, Divider, Tabs, Modal, InputNumber,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  ShopOutlined, CheckCircleOutlined, CloseCircleOutlined,
  SendOutlined, DeleteFilled, DollarOutlined,
} from '@ant-design/icons'
import toast from 'react-hot-toast'
import { useGlobal } from '../../context/GlobalContext'

const NAVY = '#1e1b4b'

const fmtMonth = (ym) => {
  const [y, m] = ym.split('-')
  return new Date(+y, +m - 1).toLocaleString('en-IN', { month: 'short', year: '2-digit' })
}

export default function VendorsPage() {
  const { API_URL, socketRef } = useGlobal()

  const [vendors,        setVendors]        = useState([])
  const [loading,        setLoading]        = useState(true)
  const [selected,       setSelected]       = useState(null)
  const [search,         setSearch]         = useState('')
  const [activeTab,      setActiveTab]      = useState('overview')
  const [drawerOpen,     setDrawerOpen]     = useState(false)
  const [editTarget,     setEditTarget]     = useState(null)
  const [saving,         setSaving]         = useState(false)
  const [payables,       setPayables]       = useState({})
  const [vendorOrders,   setVendorOrders]   = useState([])
  const [ordersLoading,  setOrdersLoading]  = useState(false)
  const [monthlyExp,     setMonthlyExp]     = useState([])
  const [commentText,    setCommentText]    = useState('')
  const [addingComment,  setAddingComment]  = useState(false)
  const [payModal,       setPayModal]       = useState(null)   // { order } or null
  const [payAmount,      setPayAmount]      = useState('')
  const [payingId,       setPayingId]       = useState(null)
  const [form] = Form.useForm()
  const commentRef = useRef(null)

  useEffect(() => { fetchVendors() }, [])

  // Re-sync vendor list when any vendor/booking changes from other sessions
  useEffect(() => {
    const socket = socketRef?.current
    if (!socket) return
    const handler = () => fetchVendors()
    socket.on('vendor:updated', handler)
    socket.on('booking:updated', handler)
    return () => {
      socket.off('vendor:updated', handler)
      socket.off('booking:updated', handler)
    }
  }, [socketRef])

  const fetchVendors = async () => {
    setLoading(true)
    try {
      const [vRes] = await Promise.all([fetch(`${API_URL}/vendors`)])
      const vs = await vRes.json()
      setVendors(vs)
      // fetch payables for all
      const p = {}
      await Promise.all(vs.map(async v => {
        const r = await fetch(`${API_URL}/vendors/${v._id}/payables`)
        const d = await r.json()
        p[v._id] = d.payable || 0
      }))
      setPayables(p)
    } catch { toast.error('Failed to load vendors') }
    finally { setLoading(false) }
  }

  const selectVendor = async (v) => {
    setSelected(v)
    setActiveTab('overview')
    setOrdersLoading(true)
    try {
      const [ordRes, expRes] = await Promise.all([
        fetch(`${API_URL}/vendors/${v._id}/orders`),
        fetch(`${API_URL}/vendors/${v._id}/monthly-expenses`),
      ])
      setVendorOrders(await ordRes.json())
      setMonthlyExp(await expRes.json())
    } catch { }
    finally { setOrdersLoading(false) }
  }

  const openNew = () => {
    setEditTarget(null); form.resetFields(); setDrawerOpen(true)
  }
  const openEdit = (v) => {
    setEditTarget(v)
    form.setFieldsValue({
      name: v.name, companyName: v.companyName || '',
      email: v.email || '', phone: v.phone || '',
      billingAddress: v.billingAddress || '', shippingAddress: v.shippingAddress || '',
      gstNumber: v.gstNumber || '', notes: v.notes || '',
    })
    setDrawerOpen(true)
  }

  const handleSave = async () => {
    try {
      const vals = await form.validateFields()
      setSaving(true)
      const method = editTarget ? 'PUT' : 'POST'
      const endpoint = editTarget ? `${API_URL}/vendors/${editTarget._id}` : `${API_URL}/vendors`
      const res = await fetch(endpoint, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(vals),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.message || 'Save failed'); return }
      toast.success(editTarget ? 'Vendor updated' : 'Vendor created')
      setDrawerOpen(false)
      await fetchVendors()
      if (editTarget) { setSelected(data); selectVendor(data) }
    } catch { } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    await fetch(`${API_URL}/vendors/${id}`, { method: 'DELETE' })
    toast.success('Vendor deleted')
    if (selected?._id === id) setSelected(null)
    fetchVendors()
  }

  const handleToggleActive = async (v) => {
    const res = await fetch(`${API_URL}/vendors/${v._id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...v, isActive: !v.isActive }),
    })
    const data = await res.json()
    if (res.ok) {
      fetchVendors()
      setSelected(data)
    }
  }

  const handleAddComment = async () => {
    if (!commentText.trim() || !selected) return
    setAddingComment(true)
    try {
      const res = await fetch(`${API_URL}/vendors/${selected._id}/comments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentText }),
      })
      const data = await res.json()
      if (res.ok) {
        setSelected(data)
        setVendors(prev => prev.map(v => v._id === data._id ? data : v))
        setCommentText('')
      }
    } catch { toast.error('Failed') }
    finally { setAddingComment(false) }
  }

  const handleDeleteComment = async (commentId) => {
    const res = await fetch(`${API_URL}/vendors/${selected._id}/comments/${commentId}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok) {
      setSelected(data)
      setVendors(prev => prev.map(v => v._id === data._id ? data : v))
    }
  }

  const handleMarkPayment = async (order, newStatus) => {
    if (!selected) return
    setPayingId(order._id)
    try {
      const res = await fetch(`${API_URL}/admin/bookings/${order._id}/vendor-payment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: selected._id,
          status:     newStatus,
          paidAmount: newStatus === 'Paid' ? (Number(payAmount) || order.vendorCostTotal) : 0,
        }),
      })
      if (res.ok) {
        toast.success(newStatus === 'Paid' ? 'Payment marked as cleared' : 'Payment reset to pending')
        setPayModal(null)
        setPayAmount('')
        // refresh vendor orders
        const [ordRes, pRes] = await Promise.all([
          fetch(`${API_URL}/vendors/${selected._id}/orders`),
          fetch(`${API_URL}/vendors/${selected._id}/payables`),
        ])
        setVendorOrders(await ordRes.json())
        const pd = await pRes.json()
        setPayables(prev => ({ ...prev, [selected._id]: pd.payable || 0 }))
      } else {
        const d = await res.json(); toast.error(d.message || 'Failed')
      }
    } catch { toast.error('Network error') }
    finally { setPayingId(null) }
  }

  const filtered = useMemo(() =>
    vendors.filter(v =>
      !search ||
      v.name?.toLowerCase().includes(search.toLowerCase()) ||
      v.vendorNumber?.toLowerCase().includes(search.toLowerCase()) ||
      v.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      v.phone?.includes(search)
    ), [vendors, search])

  const maxExp = Math.max(...(monthlyExp.map(m => m.amount)), 1)

  // ── Transactions tab columns ──────────────────────────────────────────
  const txCols = [
    {
      title: 'Date', dataIndex: 'startDate', width: 100,
      render: d => <span style={{ fontSize: 12 }}>{new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>,
    },
    {
      title: 'Order #', dataIndex: 'bookingCode', width: 110,
      render: (c, r) => <span style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>#{(c || r._id)?.slice(-6).toUpperCase()}</span>,
    },
    {
      title: 'Customer', dataIndex: 'userName', width: 140,
      render: n => <span style={{ fontSize: 12 }}>{n}</span>,
    },
    {
      title: 'Items', dataIndex: 'vendorItems',
      render: items => (
        <div>{(items || []).map((it, i) => (
          <div key={i} style={{ fontSize: 11, color: '#374151' }}>{it.name} × {it.quantity}</div>
        ))}</div>
      ),
    },
    {
      title: 'Amount', dataIndex: 'vendorCostTotal', width: 100,
      render: v => <span style={{ fontWeight: 700, fontSize: 13, color: '#ef4444' }}>₹{(v || 0).toLocaleString()}</span>,
    },
    {
      title: 'Order Status', dataIndex: 'status', width: 110,
      render: s => {
        const color = s === 'Closed' || s === 'Returned' ? 'green' : s === 'Cancelled' ? 'red' : 'blue'
        return <Tag color={color} style={{ fontSize: 10 }}>{s}</Tag>
      },
    },
    {
      title: 'Payment', dataIndex: 'vendorPaymentStatus', width: 130,
      render: (status, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Tag
            color={status === 'Paid' ? 'green' : 'volcano'}
            style={{ fontSize: 10, margin: 0 }}
          >
            {status === 'Paid' ? '✓ Cleared' : 'Pending'}
          </Tag>
          {status === 'Paid' && record.vendorPaidDate && (
            <span style={{ fontSize: 10, color: '#9ca3af' }}>
              {new Date(record.vendorPaidDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
            </span>
          )}
        </div>
      ),
    },
    {
      title: '', width: 120,
      render: (_, record) => (
        record.vendorPaymentStatus === 'Paid' ? (
          <Popconfirm
            title="Reset payment to Pending?"
            okText="Reset" okType="default"
            onConfirm={() => handleMarkPayment(record, 'Pending')}
          >
            <Button size="small" style={{ fontSize: 11, color: '#6b7280' }}
              loading={payingId === record._id}>
              Reset
            </Button>
          </Popconfirm>
        ) : (
          <Button
            size="small" type="primary"
            icon={<DollarOutlined />}
            style={{ background: '#10b981', borderColor: '#10b981', fontSize: 11 }}
            loading={payingId === record._id}
            onClick={() => { setPayModal(record); setPayAmount(record.vendorCostTotal || '') }}
          >
            Mark Paid
          </Button>
        )
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', height: '100%', background: '#f9fafb', overflow: 'hidden' }}>

      {/* ── LEFT: vendor list ─────────────────────────────────────── */}
      <div style={{
        width: 280, flexShrink: 0, borderRight: '1px solid #e5e7eb',
        background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 14px 10px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: NAVY }}>
              Active Vendors
              <span style={{ fontSize: 11, fontWeight: 500, color: '#9ca3af', marginLeft: 6 }}>({filtered.length})</span>
            </span>
            <Button type="primary" icon={<PlusOutlined />} size="small"
              onClick={openNew} style={{ background: NAVY, borderColor: NAVY }} />
          </div>
          <Input size="small"
            prefix={<SearchOutlined style={{ color: '#9ca3af', fontSize: 12 }} />}
            placeholder="Search…"
            value={search} onChange={e => setSearch(e.target.value)} allowClear />
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spin size="small" /></div>
          ) : filtered.length === 0 ? (
            <Empty description="No vendors" style={{ padding: 32 }} />
          ) : filtered.map(v => (
            <div key={v._id}
              onClick={() => selectVendor(v)}
              style={{
                padding: '11px 14px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer',
                background: selected?._id === v._id ? '#eef2ff' : '#fff',
                borderLeft: selected?._id === v._id ? `3px solid ${NAVY}` : '3px solid transparent',
              }}
            >
              <div style={{ fontWeight: 700, color: NAVY, fontSize: 13 }}>{v.name}</div>
              <div style={{ fontSize: 12, color: payables[v._id] > 0 ? '#ef4444' : '#6b7280', marginTop: 1 }}>
                ₹{(payables[v._id] || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT: vendor detail ───────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' }}>
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
            <ShopOutlined style={{ fontSize: 44, opacity: 0.2, marginBottom: 14 }} />
            <div style={{ fontWeight: 600, fontSize: 15 }}>Select a vendor</div>
            <Button type="primary" icon={<PlusOutlined />} onClick={openNew}
              style={{ marginTop: 16, background: NAVY, borderColor: NAVY }}>New Vendor</Button>
          </div>
        ) : (
          <>
            {/* Header bar */}
            <div style={{
              padding: '16px 24px', borderBottom: '1px solid #e5e7eb',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
            }}>
              <div>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#111' }}>{selected.name}</span>
                {!selected.isActive && <Tag color="default" style={{ marginLeft: 10, fontSize: 11 }}>Inactive</Tag>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button icon={<EditOutlined />} onClick={() => openEdit(selected)}>Edit</Button>
                <Tooltip title={selected.isActive ? 'Deactivate' : 'Activate'}>
                  <Button
                    icon={selected.isActive ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
                    onClick={() => handleToggleActive(selected)}
                    style={{ color: selected.isActive ? '#ef4444' : '#10b981' }}
                  />
                </Tooltip>
                <Popconfirm title="Delete this vendor?" okText="Delete" okType="danger" onConfirm={() => handleDelete(selected._id)}>
                  <Button danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </div>
            </div>

            {/* Tabs */}
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              tabBarStyle={{ padding: '0 24px', marginBottom: 0, flexShrink: 0 }}
              items={[
                {
                  key: 'overview',
                  label: 'Overview',
                  children: (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 0, height: '100%', overflow: 'auto' }}>

                      {/* Left column */}
                      <div style={{ padding: '20px 24px', borderRight: '1px solid #f0f0f0', overflowY: 'auto' }}>

                        {/* Address */}
                        <div style={{ marginBottom: 20 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                            ADDRESS
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Billing Address</div>
                              {selected.billingAddress
                                ? <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>{selected.billingAddress}</div>
                                : <span style={{ fontSize: 12, color: '#9ca3af' }}>No Billing Address</span>
                              }
                            </div>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Shipping Address</div>
                              {selected.shippingAddress
                                ? <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>{selected.shippingAddress}</div>
                                : <span style={{ fontSize: 12, color: '#9ca3af' }}>No Shipping Address</span>
                              }
                            </div>
                          </div>
                        </div>

                        <Divider style={{ margin: '0 0 20px' }} />

                        {/* Other Details */}
                        <div style={{ marginBottom: 20 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>OTHER DETAILS</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[
                              ['Vendor Number', selected.vendorNumber],
                              ['Company Name', selected.companyName || '—'],
                              ['Phone', selected.phone || '—'],
                              ['Email', selected.email || '—'],
                              ['GSTIN', selected.gstNumber || '—'],
                              ['Status', selected.isActive ? 'Active' : 'Inactive'],
                            ].map(([lbl, val]) => (
                              <div key={lbl} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                <div style={{ width: 140, fontSize: 12, color: '#9ca3af', flexShrink: 0 }}>{lbl}</div>
                                <div style={{ fontSize: 12, color: '#1e293b', fontWeight: lbl === 'Vendor Number' ? 700 : 500 }}>{val}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Divider style={{ margin: '0 0 20px' }} />

                        {/* Notes */}
                        {selected.notes && (
                          <>
                            <div style={{ marginBottom: 20 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>NOTES</div>
                              <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>{selected.notes}</div>
                            </div>
                            <Divider style={{ margin: '0 0 20px' }} />
                          </>
                        )}
                      </div>

                      {/* Right column */}
                      <div style={{ padding: '20px 20px', overflowY: 'auto', background: '#fafafa' }}>

                        {/* Payables */}
                        {(() => {
                          const totalCost = vendorOrders.reduce((s, o) => s + (o.vendorCostTotal || 0), 0)
                          const amountPaid = vendorOrders
                            .filter(o => o.vendorPaymentStatus === 'Paid')
                            .reduce((s, o) => s + (o.vendorCostTotal || 0), 0)
                          const outstanding = totalCost - amountPaid
                          return (
                            <div style={{ marginBottom: 20 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 12 }}>Payables</div>
                              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                  {['OUTSTANDING', 'AMOUNT PAID'].map(h => (
                                    <div key={h} style={{ padding: '8px 12px', fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
                                  ))}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '10px 12px' }}>
                                  <div style={{ fontSize: 14, fontWeight: 800, color: outstanding > 0 ? '#ef4444' : '#10b981' }}>
                                    ₹{outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </div>
                                  <div style={{ fontSize: 14, fontWeight: 800, color: amountPaid > 0 ? '#10b981' : '#374151' }}>
                                    ₹{amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </div>
                                </div>
                                {totalCost > 0 && (
                                  <div style={{ padding: '0 12px 10px' }}>
                                    <div style={{ background: '#e5e7eb', borderRadius: 4, height: 5, overflow: 'hidden' }}>
                                      <div style={{ width: `${Math.round((amountPaid / totalCost) * 100)}%`, height: '100%', background: '#10b981', borderRadius: 4, transition: 'width 0.4s' }} />
                                    </div>
                                    <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>
                                      {Math.round((amountPaid / totalCost) * 100)}% cleared of ₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })} total
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })()}

                        {/* Monthly Expenses Bar Chart */}
                        <div style={{ marginBottom: 20 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>Expenses</div>
                            <span style={{ fontSize: 11, color: '#9ca3af' }}>Last 6 Months</span>
                          </div>
                          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '14px 12px' }}>
                            {monthlyExp.every(m => m.amount === 0) ? (
                              <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 12, padding: '16px 0' }}>No expenses yet</div>
                            ) : (
                              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 80 }}>
                                {monthlyExp.map(m => (
                                  <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                    <Tooltip title={`₹${m.amount.toLocaleString()}`}>
                                      <div style={{
                                        width: '100%', background: m.amount > 0 ? '#E5550F' : '#e5e7eb',
                                        borderRadius: '3px 3px 0 0',
                                        height: m.amount > 0 ? `${Math.max(4, Math.round((m.amount / maxExp) * 64))}px` : '4px',
                                        transition: 'height 0.3s',
                                      }} />
                                    </Tooltip>
                                    <div style={{ fontSize: 9, color: '#9ca3af', textAlign: 'center' }}>{fmtMonth(m.month)}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Order Activity */}
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 12 }}>Recent Activity</div>
                          {ordersLoading ? <Spin size="small" /> : vendorOrders.length === 0 ? (
                            <div style={{ fontSize: 12, color: '#9ca3af' }}>No orders yet</div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                              {vendorOrders.slice(0, 6).map((o, i) => (
                                <div key={o._id} style={{ display: 'flex', gap: 12, paddingBottom: 14, position: 'relative' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E5550F', flexShrink: 0, marginTop: 3 }} />
                                    {i < vendorOrders.slice(0, 6).length - 1 && (
                                      <div style={{ width: 1, flex: 1, background: '#e5e7eb', marginTop: 3 }} />
                                    )}
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 11, color: '#6b7280' }}>
                                      {new Date(o.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>
                                      Order #{(o.bookingCode || o._id)?.slice(-6).toUpperCase()} — {o.userName}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#ef4444' }}>₹{(o.vendorCostTotal || 0).toLocaleString()} vendor cost</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'comments',
                  label: 'Comments',
                  children: (
                    <div style={{ padding: '20px 24px', height: '100%', overflowY: 'auto' }}>
                      {/* Add comment */}
                      <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
                        <Input.TextArea
                          ref={commentRef}
                          rows={3}
                          placeholder="Add a comment…"
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          bordered={false}
                          style={{ resize: 'none', fontSize: 13 }}
                        />
                        <div style={{ padding: '8px 12px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end' }}>
                          <Button
                            type="primary" size="small" icon={<SendOutlined />}
                            loading={addingComment}
                            disabled={!commentText.trim()}
                            onClick={handleAddComment}
                            style={{ background: NAVY, borderColor: NAVY }}
                          >
                            Add Comment
                          </Button>
                        </div>
                      </div>

                      {/* Comments list */}
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                        ALL COMMENTS
                      </div>
                      {(selected.comments || []).length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '24px 0' }}>No comments yet.</div>
                      ) : (
                        [...(selected.comments || [])].reverse().map(c => (
                          <div key={c._id} style={{ padding: '12px 0', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 12 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                              A
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Admin</span>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                  <span style={{ fontSize: 11, color: '#9ca3af' }}>
                                    {new Date(c.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <Popconfirm title="Delete comment?" onConfirm={() => handleDeleteComment(c._id)} okType="danger" okText="Delete">
                                    <DeleteFilled style={{ fontSize: 11, color: '#d1d5db', cursor: 'pointer' }} />
                                  </Popconfirm>
                                </div>
                              </div>
                              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{c.text}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ),
                },
                {
                  key: 'transactions',
                  label: 'Transactions',
                  children: (
                    <div style={{ padding: '20px 24px', height: '100%', overflowY: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>
                          Bills
                          <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, marginLeft: 8 }}>{vendorOrders.length} order{vendorOrders.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>
                          Total: ₹{vendorOrders.reduce((s, o) => s + (o.vendorCostTotal || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      {ordersLoading ? (
                        <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
                      ) : vendorOrders.length === 0 ? (
                        <Empty description="No transactions yet" />
                      ) : (
                        <Table
                          dataSource={vendorOrders}
                          columns={txCols}
                          rowKey="_id"
                          size="small"
                          pagination={{ pageSize: 10, showSizeChanger: false, showTotal: t => `${t} bills` }}
                        />
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </>
        )}
      </div>

      {/* ── Mark Paid Modal ───────────────────────────────────────── */}
      <Modal
        open={!!payModal}
        onCancel={() => { setPayModal(null); setPayAmount('') }}
        onOk={() => handleMarkPayment(payModal, 'Paid')}
        okText="Confirm Payment"
        okButtonProps={{ style: { background: '#10b981', borderColor: '#10b981' }, loading: !!payingId }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarOutlined style={{ color: '#10b981' }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: NAVY }}>Mark Payment as Cleared</div>
              <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400 }}>
                {selected?.name} — Order #{payModal?.bookingCode?.slice(-6).toUpperCase() || payModal?._id?.slice(-6).toUpperCase()}
              </div>
            </div>
          </div>
        }
        centered destroyOnHidden width={420}
      >
        <div style={{ paddingBlock: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: '#6b7280' }}>Vendor Cost (calculated)</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>₹{(payModal?.vendorCostTotal || 0).toLocaleString()}</span>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Amount Paid (₹)</div>
            <InputNumber
              min={0} prefix="₹" size="large" style={{ width: '100%' }}
              placeholder="Enter actual amount paid to vendor"
              value={payAmount}
              onChange={v => setPayAmount(v)}
            />
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
              Leave as-is to use the calculated amount
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Drawer: create / edit ──────────────────────────────────── */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={<span style={{ color: NAVY, fontWeight: 700 }}>{editTarget ? `Edit — ${editTarget.name}` : 'New Vendor'}</span>}
        size="default"
        extra={
          <Button type="primary" loading={saving} onClick={handleSave} style={{ background: NAVY, borderColor: NAVY }}>
            {editTarget ? 'Save Changes' : 'Create Vendor'}
          </Button>
        }
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Vendor Name" name="name" rules={[{ required: true, message: 'Name required' }]}>
            <Input placeholder="e.g. Raj Video Camera Man" size="large" />
          </Form.Item>
          <Form.Item label="Company Name" name="companyName">
            <Input placeholder="Registered company name (optional)" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item label="Phone" name="phone">
              <Input placeholder="+91 00000 00000" />
            </Form.Item>
            <Form.Item label="Email" name="email">
              <Input placeholder="vendor@example.com" />
            </Form.Item>
          </div>
          <Form.Item label="Billing Address" name="billingAddress">
            <Input.TextArea rows={2} placeholder="Street, city, state…" />
          </Form.Item>
          <Form.Item label="Shipping Address" name="shippingAddress">
            <Input.TextArea rows={2} placeholder="If different from billing…" />
          </Form.Item>
          <Form.Item label="GSTIN (optional)" name="gstNumber">
            <Input placeholder="22AAAAA0000A1Z5" maxLength={15}
              onChange={e => form.setFieldValue('gstNumber', e.target.value.toUpperCase())}
              style={{ letterSpacing: '0.06em' }} />
          </Form.Item>
          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={2} placeholder="Any remarks…" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}
