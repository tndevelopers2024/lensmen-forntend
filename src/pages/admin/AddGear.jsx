import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, InputNumber, Button, Upload, Card, Divider, Typography } from 'antd'
import { InboxOutlined, BarcodeOutlined } from '@ant-design/icons'
import toast from 'react-hot-toast'
import { useGlobal } from '../../context/GlobalContext'
import PageHeader from '../../components/PageHeader'
import CategorySelect from '../../components/CategorySelect'

const { TextArea } = Input
const { Text }     = Typography
const { Dragger }  = Upload

const NAVY  = '#1e1b4b'
const BRAND = '#E5550F'

const AddGear = () => {
  const { fetchProducts, API_URL } = useGlobal()
  const navigate     = useNavigate()
  const [form]        = Form.useForm()
  const [productFile, setProductFile] = useState(null)
  const [previewUrl,  setPreviewUrl]  = useState('')
  const [loading,     setLoading]     = useState(false)

  const handleImageUpload = (file) => {
    setProductFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    return false
  }

  const handleAddProduct = async (values) => {
    setLoading(true)
    const formData = new FormData()
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && !(typeof v === 'number' && isNaN(v))) formData.append(k, v)
    })
    if (productFile) formData.append('image', productFile)

    try {
      const res = await fetch(`${API_URL}/products`, { method: 'POST', body: formData })
      if (res.ok) {
        toast.success('Product added to inventory')
        fetchProducts()
        navigate('/admin/all-products')
      } else {
        const d = await res.json()
        toast.error(d.message || 'Failed to add product')
      }
    } catch {
      toast.error('Error adding product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Inventory Expansion"
        title="Add New Product"
        subtitle="Fill in the details to add a new rental item to your inventory"
      />

      <Card style={{ borderRadius: 16, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <Form form={form} layout="vertical" onFinish={handleAddProduct}>

          {/* ── Basic Info ─────────────────────────────────────────── */}
          <Divider orientation="left" style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 0 }}>
            Basic Information
          </Divider>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
            <Form.Item label="Product Name" name="name" rules={[{ required: true, message: 'Enter product name' }]}>
              <Input placeholder="e.g. ARRI Alexa Mini" size="large" />
            </Form.Item>

            <Form.Item label="Daily Rate (₹)" name="pricePerDay" rules={[{ required: true, message: 'Enter daily rate' }]}>
              <InputNumber placeholder="0" size="large" min={0} style={{ width: '100%' }} prefix="₹" />
            </Form.Item>

            <Form.Item label="Category" name="category" rules={[{ required: true, message: 'Select a category' }]}>
              <CategorySelect size="large" placeholder="Select or create a category" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label={<span>SKU <Text type="secondary" style={{ fontSize: 11, fontWeight: 400 }}>(auto-generated if blank)</Text></span>} name="sku">
              <Input
                size="large"
                prefix={<BarcodeOutlined style={{ color: '#9ca3af' }} />}
                placeholder="e.g. CAM-0042"
              />
            </Form.Item>

            <Form.Item label="Description" name="description" style={{ gridColumn: 'span 2' }} rules={[{ required: true, message: 'Enter a description' }]}>
              <TextArea rows={3} placeholder="Describe features, accessories included, special handling notes..." />
            </Form.Item>
          </div>

          {/* ── Units ──────────────────────────────────────────────── */}
          <Divider orientation="left" style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Units
          </Divider>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
            <span style={{ fontSize: 20 }}>📦</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#15803d' }}>1 unit will be created automatically</div>
              <div style={{ fontSize: 12, color: '#166534', marginTop: 2 }}>You can add more units from the Inventory page after creating the product.</div>
            </div>
          </div>

          {/* ── Product Image ──────────────────────────────────────── */}
          <Divider orientation="left" style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Product Image
          </Divider>

          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <Dragger
                beforeUpload={handleImageUpload}
                showUploadList={false}
                accept="image/*"
                style={{ borderRadius: 12 }}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined style={{ color: BRAND }} />
                </p>
                <p className="ant-upload-text">Click or drag image here</p>
                <p className="ant-upload-hint">JPG, PNG, WEBP — recommended 800×800</p>
              </Dragger>
            </div>
            {previewUrl && (
              <div style={{ width: 120, height: 120, borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', flexShrink: 0 }}>
                <img src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
              </div>
            )}
          </div>

          <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              block
              style={{ height: 52, fontSize: 15, fontWeight: 800, background: BRAND, borderColor: BRAND, letterSpacing: '0.04em' }}
            >
              Add to Inventory
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default AddGear
