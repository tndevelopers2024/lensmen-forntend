import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, Switch, DatePicker, InputNumber, Tag, Space, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, GiftOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useGlobal } from '../../context/GlobalContext'
import toast from 'react-hot-toast'

const { Option } = Select

export default function OffersPage() {
  const { API_URL, fetchOffers } = useGlobal()
  const [offers, setOffers]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [saving, setSaving]     = useState(false)
  const [form]                  = Form.useForm()

  const load = async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${API_URL}/offers`)
      const data = await res.json()
      setOffers(Array.isArray(data) ? data : [])
    } catch { toast.error('Failed to load offers') }
    finally   { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ discountType: 'percentage', isActive: true })
    setModalOpen(true)
  }

  const openEdit = (offer) => {
    setEditing(offer)
    form.setFieldsValue({
      ...offer,
      expiryDate: offer.expiryDate ? dayjs(offer.expiryDate) : null,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    let values
    try { values = await form.validateFields() } catch { return }

    setSaving(true)
    try {
      const payload = {
        ...values,
        code: values.code?.toUpperCase().trim(),
        expiryDate: values.expiryDate ? values.expiryDate.toISOString() : null,
      }

      const url    = editing ? `${API_URL}/offers/${editing._id}` : `${API_URL}/offers`
      const method = editing ? 'PUT' : 'POST'

      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.message || 'Save failed'); return }

      toast.success(editing ? 'Offer updated' : 'Offer created')
      setModalOpen(false)
      load()
      fetchOffers() // refresh public offers too
    } catch { toast.error('Save failed') }
    finally   { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_URL}/offers/${id}`, { method: 'DELETE' })
      toast.success('Offer deleted')
      load()
      fetchOffers()
    } catch { toast.error('Delete failed') }
  }

  const handleToggle = async (offer) => {
    try {
      const res = await fetch(`${API_URL}/offers/${offer._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !offer.isActive }),
      })
      if (res.ok) {
        load()
        fetchOffers()
      }
    } catch { toast.error('Update failed') }
  }

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (v) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, background: '#fff7ed', color: '#E5550F', padding: '2px 8px', borderRadius: 6, border: '1px solid #fed7aa' }}>
          {v}
        </span>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Discount',
      key: 'discount',
      render: (_, r) => (
        <Tag color={r.discountType === 'percentage' ? 'orange' : 'blue'}>
          {r.discountType === 'percentage' ? `${r.discountValue}%` : `₹${r.discountValue}`}
          {r.discountType === 'percentage' && r.maxDiscount > 0 && ` (max ₹${r.maxDiscount})`}
        </Tag>
      ),
    },
    {
      title: 'Min Order',
      dataIndex: 'minOrderAmount',
      key: 'minOrderAmount',
      render: (v) => v > 0 ? `₹${v.toLocaleString('en-IN')}` : '—',
    },
    {
      title: 'Usage',
      key: 'usage',
      render: (_, r) => (
        <span style={{ fontSize: 12, color: '#6b7280' }}>
          {r.usedCount}{r.usageLimit > 0 ? ` / ${r.usageLimit}` : ' / ∞'}
        </span>
      ),
    },
    {
      title: 'Expiry',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (v) => v ? dayjs(v).format('D MMM YYYY') : <span style={{ color: '#9ca3af' }}>Never</span>,
    },
    {
      title: 'Active',
      key: 'isActive',
      render: (_, r) => (
        <Switch
          checked={r.isActive}
          onChange={() => handleToggle(r)}
          size="small"
          style={{ background: r.isActive ? '#E5550F' : undefined }}
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm title="Delete this offer?" onConfirm={() => handleDelete(r._id)} okText="Delete" okButtonProps={{ danger: true }}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <GiftOutlined style={{ color: '#E5550F', fontSize: 20 }} />
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>Offers & Promo Codes</h1>
          </div>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
            Create discount codes that customers can apply at checkout
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreate}
          style={{ background: '#E5550F', borderColor: '#E5550F' }}
        >
          New Offer
        </Button>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0' }}>
        <Table
          dataSource={offers}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="middle"
        />
      </div>

      <Modal
        title={editing ? 'Edit Offer' : 'Create New Offer'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText={saving ? 'Saving…' : (editing ? 'Save Changes' : 'Create Offer')}
        okButtonProps={{ loading: saving, style: { background: '#E5550F', borderColor: '#E5550F' } }}
        width={520}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="code"
            label="Offer Code"
            rules={[{ required: true, message: 'Enter a code' }]}
            extra="Will be auto-uppercased (e.g. SUMMER20)"
          >
            <Input
              style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 600 }}
              placeholder="LENS10"
              disabled={!!editing}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Enter a description' }]}
            extra="Shown to customers on the homepage offers section"
          >
            <Input.TextArea rows={2} placeholder="Use code LENS10 & get 10% off on orders above ₹1500" />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="discountType" label="Discount Type" rules={[{ required: true }]}>
              <Select>
                <Option value="percentage">Percentage (%)</Option>
                <Option value="flat">Flat Amount (₹)</Option>
              </Select>
            </Form.Item>

            <Form.Item name="discountValue" label="Discount Value" rules={[{ required: true, message: 'Required' }]}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="10" />
            </Form.Item>

            <Form.Item name="minOrderAmount" label="Min Order Amount (₹)">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="1500" />
            </Form.Item>

            <Form.Item name="maxDiscount" label="Max Discount Cap (₹)" extra="0 = no cap">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="300" />
            </Form.Item>

            <Form.Item name="usageLimit" label="Usage Limit" extra="0 = unlimited">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
            </Form.Item>

            <Form.Item name="expiryDate" label="Expiry Date">
              <DatePicker style={{ width: '100%' }} placeholder="No expiry" disabledDate={d => d && d < dayjs().startOf('day')} />
            </Form.Item>
          </div>

          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch style={{ background: '#E5550F' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
