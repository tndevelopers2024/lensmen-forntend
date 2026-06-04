import { useState } from 'react'
import { Modal, Form, InputNumber, Select, Input, Radio, Typography, Space, Tag, Divider } from 'antd'
import { DollarOutlined, CheckCircleOutlined } from '@ant-design/icons'
import toast from 'react-hot-toast'
import { useGlobal } from '../context/GlobalContext'

const { Text } = Typography
const { TextArea } = Input

const MODES = ['UPI', 'Cash', 'Bank Transfer', 'Card', 'Others']

const PaymentModal = ({ open, onClose, booking, onSuccess }) => {
  const { API_URL } = useGlobal()
  const [form]    = Form.useForm()
  const [loading, setLoading] = useState(false)

  if (!booking) return null

  const alreadyPaid = booking.totalPaid    || 0
  const totalPrice  = booking.totalPrice   || 0
  const remaining   = Math.max(0, totalPrice - alreadyPaid)
  const hasAdvance  = (booking.payments || []).some(p => p.type === 'advance')
  const defaultType = hasAdvance ? 'final' : 'advance'
  const paidPct     = totalPrice > 0 ? Math.round((alreadyPaid / totalPrice) * 100) : 0

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/payments/${booking._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Payment recorded successfully')
        form.resetFields()
        onSuccess(data.booking)
        onClose()
      } else {
        toast.error(data.message || 'Failed to record payment')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onCancel={() => { form.resetFields(); onClose() }}
      onOk={() => form.submit()}
      okText="Record Payment"
      cancelText="Cancel"
      confirmLoading={loading}
      title={
        <Space>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fff7ed', border: '1px solid #fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarOutlined style={{ color: '#E5550F', fontSize: 15 }} />
          </div>
          <div>
            <div style={{ color: '#1e1b4b', fontWeight: 700, fontSize: 15 }}>Record Payment</div>
            <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400 }}>{booking.userName} — Order #{booking._id?.slice(-6).toUpperCase()}</div>
          </div>
        </Space>
      }
      width={480}
      destroyOnHidden
    >
      {/* ── Summary bar ─────────────────────────────────────────── */}
      <div style={{
        background: '#f9fafb', borderRadius: 14, padding: '14px 16px',
        marginBottom: 20, border: '1px solid #f0f0f0',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ textAlign: 'center' }}>
            <Text style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', display: 'block' }}>Total</Text>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#1e1b4b' }}>₹{totalPrice.toLocaleString()}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Text style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', display: 'block' }}>Collected</Text>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#10b981' }}>₹{alreadyPaid.toLocaleString()}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Text style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', display: 'block' }}>Pending</Text>
            <div style={{ fontSize: 20, fontWeight: 900, color: remaining > 0 ? '#ef4444' : '#10b981' }}>₹{remaining.toLocaleString()}</div>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ background: '#e5e7eb', borderRadius: 6, height: 6, overflow: 'hidden' }}>
          <div style={{ width: `${paidPct}%`, height: '100%', background: paidPct === 100 ? '#10b981' : '#E5550F', borderRadius: 6, transition: 'width 0.4s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <Text style={{ fontSize: 10, color: '#9ca3af' }}>{paidPct}% collected</Text>
          {paidPct === 100 && <Text style={{ fontSize: 10, color: '#10b981', fontWeight: 700 }}><CheckCircleOutlined /> Fully Paid</Text>}
        </div>
      </div>

      {/* ── Payment history ──────────────────────────────────────── */}
      {(booking.payments || []).length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>
            Payment History
          </Text>
          {booking.payments.map((p, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '7px 10px', borderRadius: 8,
              background: i % 2 === 0 ? '#f9fafb' : '#fff',
              marginBottom: 4,
            }}>
              <Space>
                <Tag color={p.type === 'advance' ? 'gold' : 'green'} style={{ fontSize: 10, margin: 0 }}>{p.type}</Tag>
                <Text style={{ fontSize: 12, color: '#374151' }}>{p.mode}</Text>
                {p.transactionId && <Text type="secondary" style={{ fontSize: 11 }}>#{p.transactionId}</Text>}
              </Space>
              <Text strong style={{ color: '#1e1b4b', fontSize: 13 }}>₹{p.amount.toLocaleString()}</Text>
            </div>
          ))}
          <Divider style={{ margin: '12px 0' }} />
        </div>
      )}

      {/* ── Form ─────────────────────────────────────────────────── */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ type: defaultType, mode: 'Cash', amount: remaining || undefined }}
      >
        <Form.Item label="Payment Type" name="type" rules={[{ required: true }]}>
          <Radio.Group buttonStyle="solid" style={{ width: '100%', display: 'flex' }}>
            <Radio.Button value="advance" style={{ flex: 1, textAlign: 'center' }}>Advance</Radio.Button>
            <Radio.Button value="final"   style={{ flex: 1, textAlign: 'center' }}>Final Payment</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Form.Item label="Amount (₹)" name="amount" rules={[{ required: true, message: 'Enter amount' }, { type: 'number', min: 1, message: 'Must be > 0' }]}>
            <InputNumber min={1} style={{ width: '100%' }} prefix="₹" size="large" />
          </Form.Item>
          <Form.Item label="Payment Mode" name="mode" rules={[{ required: true }]}>
            <Select size="large" options={MODES.map(m => ({ value: m, label: m }))} />
          </Form.Item>
        </div>

        <Form.Item label="Transaction ID / Reference" name="transactionId">
          <Input placeholder="UPI ref, cheque no., UTR..." />
        </Form.Item>

        <Form.Item label="Notes" name="notes" style={{ marginBottom: 0 }}>
          <TextArea rows={2} placeholder="Any additional remarks..." />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default PaymentModal
