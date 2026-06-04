import { useState, useEffect } from 'react'
import {
  Table, Button, Tag, Drawer, Form, Input, Space,
  Typography, Popconfirm, Tooltip, Divider,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import toast from 'react-hot-toast'
import { useGlobal } from '../../context/GlobalContext'
import PageHeader from '../../components/PageHeader'

const { Text } = Typography
const { TextArea } = Input

const NAVY  = '#1e1b4b'
const BRAND = '#E5550F'

const Categories = () => {
  const { API_URL } = useGlobal()
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [modalOpen,  setModalOpen]  = useState(false)
  const [editing,    setEditing]    = useState(null)
  const [saving,     setSaving]     = useState(false)
  const [form]                      = Form.useForm()

  const load = async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${API_URL}/categories`)
      const data = await res.json()
      setCategories(Array.isArray(data) ? data : [])
    } catch { toast.error('Failed to load categories') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (cat) => {
    setEditing(cat)
    form.setFieldsValue({ name: cat.name, description: cat.description })
    setModalOpen(true)
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    setSaving(true)
    try {
      const url    = editing ? `${API_URL}/categories/${editing._id}` : `${API_URL}/categories`
      const method = editing ? 'PUT' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(editing ? 'Category updated' : 'Category created')
        setModalOpen(false)
        load()
      } else {
        toast.error(data.message || 'Failed')
      }
    } catch { toast.error('Network error') }
    finally { setSaving(false) }
  }

  const handleDelete = async (cat) => {
    try {
      const res  = await fetch(`${API_URL}/categories/${cat._id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        toast.success('Category deleted')
        setCategories(prev => prev.filter(c => c._id !== cat._id))
      } else {
        toast.error(data.message || 'Delete failed')
      }
    } catch { toast.error('Network error') }
  }

  const columns = [
    {
      title: 'Category Name',
      dataIndex: 'name',
      key: 'name',
      render: name => (
        <Text strong style={{ color: NAVY, fontSize: 14 }}>{name}</Text>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: desc => desc
        ? <Text type="secondary">{desc}</Text>
        : <Text type="secondary" style={{ fontStyle: 'italic' }}>—</Text>,
    },
    {
      title: 'Products',
      dataIndex: 'productCount',
      key: 'productCount',
      width: 110,
      render: count => (
        <Tag color={count > 0 ? 'blue' : 'default'} style={{ fontWeight: 600 }}>
          {count} product{count !== 1 ? 's' : ''}
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: d => <Text type="secondary" style={{ fontSize: 12 }}>{new Date(d).toLocaleDateString('en-GB')}</Text>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, cat) => (
        <Space>
          <Tooltip title="Edit">
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(cat)} />
          </Tooltip>
          <Popconfirm
            title="Delete this category?"
            description={cat.productCount > 0
              ? `${cat.productCount} product(s) use this category — reassign them first.`
              : 'This action cannot be undone.'}
            onConfirm={() => handleDelete(cat)}
            okText="Delete"
            okButtonProps={{ danger: true }}
            disabled={cat.productCount > 0}
          >
            <Tooltip title={cat.productCount > 0 ? 'Cannot delete — products still assigned' : 'Delete'}>
              <Button size="small" icon={<DeleteOutlined />} danger disabled={cat.productCount > 0} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Inventory"
        title="Categories"
        subtitle="Organise your rental equipment into categories"
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={openCreate}
          >
            New Category
          </Button>
        }
      />

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total',        value: categories.length },
          { label: 'With products', value: categories.filter(c => c.productCount > 0).length },
          { label: 'Empty',        value: categories.filter(c => c.productCount === 0).length },
        ].map(s => (
          <div key={s.label} style={{
            background: '#fff', borderRadius: 10, padding: '12px 20px',
            border: '1px solid #e5e7eb',
            display: 'flex', alignItems: 'baseline', gap: 8,
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <Table
          columns={columns}
          dataSource={categories}
          rowKey="_id"
          loading={loading}
          pagination={{ defaultPageSize: 20, showSizeChanger: false, showTotal: (t) => `${t} categories` }}
        />
      </div>

      <Drawer
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          <span style={{ color: NAVY, fontWeight: 700 }}>
            {editing ? `Edit — ${editing.name}` : 'New Category'}
          </span>
        }
        width={480}
        extra={
          <Button type="primary" loading={saving} onClick={handleSave}>
            {editing ? 'Save Changes' : 'Create Category'}
          </Button>
        }
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Divider orientation="left" style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Category Details
          </Divider>
          <Form.Item
            label="Category Name"
            name="name"
            rules={[{ required: true, message: 'Name is required' }]}
          >
            <Input size="large" placeholder="e.g. Camera Bodies, Lenses, Lighting…" />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <TextArea rows={4} placeholder="Optional — brief description of what belongs in this category" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}

export default Categories
