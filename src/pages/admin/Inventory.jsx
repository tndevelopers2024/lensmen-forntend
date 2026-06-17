import { useState, useMemo } from 'react'
import {
  Table, Button, Tag, Drawer, Form, Input, InputNumber, Select,
  Upload, Space, Popconfirm, Image, Tooltip, Divider,
} from 'antd'
import {
  EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined,
  BarcodeOutlined, CheckCircleOutlined, InboxOutlined, SyncOutlined,
  FilterOutlined,
} from '@ant-design/icons'
import toast from 'react-hot-toast'
import { useGlobal, getImageUrl } from '../../context/GlobalContext'
import PageHeader from '../../components/PageHeader'
import CategorySelect from '../../components/CategorySelect'

const { TextArea } = Input
const { Dragger }  = Upload

const NAVY  = '#1e1b4b'
const BRAND = '#E5550F'

const dividerStyle = { fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }

// ── Shared gallery grid (add + edit) ─────────────────────────────────
const GalleryGrid = ({ existingUrls = [], newFiles = [], onRemoveExisting, onRemoveNew, onAdd }) => {
  const totalCount = existingUrls.length + newFiles.length
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 20 }}>
      {/* Existing saved images */}
      {existingUrls.map((url, i) => (
        <div key={`e-${i}`} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb', aspectRatio: '1' }}>
          <img src={getImageUrl(url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <button type="button" onClick={() => onRemoveExisting(i)}
            style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, lineHeight: 1 }}>
            ×
          </button>
          <div style={{ position: 'absolute', bottom: 3, left: 3, background: 'rgba(30,27,75,0.7)', color: '#fff', fontSize: 8, fontWeight: 700, padding: '1px 4px', borderRadius: 3 }}>SAVED</div>
        </div>
      ))}
      {/* New (not yet uploaded) files */}
      {newFiles.map((file, i) => (
        <div key={`n-${i}`} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '2px solid #E5550F', aspectRatio: '1' }}>
          <img src={URL.createObjectURL(file)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <button type="button" onClick={() => onRemoveNew(i)}
            style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, lineHeight: 1 }}>
            ×
          </button>
          <div style={{ position: 'absolute', bottom: 3, left: 3, background: 'rgba(229,85,15,0.85)', color: '#fff', fontSize: 8, fontWeight: 700, padding: '1px 4px', borderRadius: 3 }}>NEW</div>
        </div>
      ))}
      {/* Add slot */}
      {totalCount < 5 && (
        <label style={{ cursor: 'pointer', borderRadius: 8, border: '2px dashed #e5e7eb', background: '#f9fafb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, aspectRatio: '1' }}>
          <PlusOutlined style={{ color: '#9ca3af', fontSize: 18 }} />
          <span style={{ fontSize: 10, color: '#9ca3af' }}>Add</span>
          <input type="file" accept="image/*" multiple style={{ display: 'none' }}
            onChange={e => { Array.from(e.target.files).slice(0, 5 - totalCount).forEach(f => onAdd(f)); e.target.value = '' }} />
        </label>
      )}
    </div>
  )
}

// ── Product Form body (shared by Add + Edit) ──────────────────────────
const ProductForm = ({ form, totalQty, setTotalQty, imagePreview, onImageChange, isAdd,
  galleryFiles, onAddGallery, onRemoveGallery,
  existingGallery, onRemoveExistingGallery }) => (
  <Form form={form} layout="vertical">

    <Divider orientation="left" style={dividerStyle}>Product Image</Divider>
    <Form.Item style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <Dragger beforeUpload={onImageChange} showUploadList={false} accept="image/*" style={{ borderRadius: 8 }}>
            <InboxOutlined style={{ fontSize: 24, color: '#9ca3af' }} />
            <p style={{ fontSize: 13, color: '#6b7280', margin: '6px 0 2px' }}>
              {imagePreview ? 'Click or drag to replace image' : 'Click or drag to upload'}
            </p>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>JPG, PNG, WEBP</p>
          </Dragger>
        </div>
        {imagePreview && (
          <img src={imagePreview} style={{ width: 80, height: 80, borderRadius: 10, objectFit: 'cover', border: '1px solid #e5e7eb', flexShrink: 0 }} alt="" />
        )}
      </div>
    </Form.Item>

    <Divider orientation="left" style={dividerStyle}>
      Gallery Images
      <span style={{ color: '#9ca3af', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 11, marginLeft: 6 }}>— optional, up to 5</span>
    </Divider>
    <GalleryGrid
      existingUrls={isAdd ? [] : (existingGallery || [])}
      newFiles={galleryFiles || []}
      onRemoveExisting={i => onRemoveExistingGallery && onRemoveExistingGallery(i)}
      onRemoveNew={i => onRemoveGallery && onRemoveGallery(i)}
      onAdd={f => onAddGallery && onAddGallery(f)}
    />

    <Divider orientation="left" style={dividerStyle}>Basic Information</Divider>

    <Form.Item label="Product Name" name="name" rules={[{ required: true, message: 'Required' }]}>
      <Input size="large" placeholder="e.g. Canon EOS R5" />
    </Form.Item>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <Form.Item label="Daily Rate (₹)" name="pricePerDay" rules={[{ required: true, message: 'Required' }]}>
        <InputNumber style={{ width: '100%' }} size="large" min={0} prefix="₹" />
      </Form.Item>
      <Form.Item label="SKU" name="sku">
        <Input size="large" prefix={<BarcodeOutlined style={{ color: '#d1d5db' }} />} placeholder="Auto-generated" />
      </Form.Item>
    </div>

    <Form.Item label="Category" name="category" rules={isAdd ? [{ required: true, message: 'Required' }] : []}>
      <CategorySelect size="large" style={{ width: '100%' }} placeholder="Select or create a category" />
    </Form.Item>

    <Form.Item label="Description" name="description" rules={isAdd ? [{ required: true, message: 'Required' }] : []}>
      <TextArea rows={3} placeholder="Features, accessories included, handling notes…" />
    </Form.Item>

    <Divider orientation="left" style={dividerStyle}>Inventory</Divider>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <Form.Item label="Total Units Owned" name="totalQuantity" style={{ marginBottom: 0 }}>
        <InputNumber
          size="large" min={1} style={{ width: '100%' }}
          onChange={v => {
            setTotalQty(v || 1)
            const cur = form.getFieldValue('availableQuantity') || 0
            if (cur > (v || 1)) form.setFieldValue('availableQuantity', v || 1)
          }}
        />
      </Form.Item>
      <Form.Item label="Available Now" name="availableQuantity" style={{ marginBottom: 0 }}>
        <InputNumber size="large" min={0} max={totalQty} style={{ width: '100%' }} />
      </Form.Item>
    </div>

  </Form>
)

// ── Main page ─────────────────────────────────────────────────────────
const AdminInventory = () => {
  const { adminProductList, fetchAdminData, fetchProducts, API_URL } = useGlobal()

  // Search / filter state
  const [search,         setSearch]         = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus,   setFilterStatus]   = useState('all')

  const allCategories = useMemo(() =>
    [...new Set(adminProductList.map(p => p.category).filter(Boolean))].sort()
  , [adminProductList])

  const displayList = useMemo(() => {
    return adminProductList.filter(p => {
      const q = search.toLowerCase()
      const matchSearch = !q ||
        (p.name || '').toLowerCase().includes(q) ||
        (p.sku  || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      const matchCat    = filterCategory === 'all' || p.category === filterCategory
      const matchStatus = filterStatus   === 'all' ||
        (filterStatus === 'in-stock'    &&  p.isAvailable) ||
        (filterStatus === 'rented-out'  && !p.isAvailable)
      return matchSearch && matchCat && matchStatus
    })
  }, [adminProductList, search, filterCategory, filterStatus])

  // Edit state
  const [editingProduct, setEditingProduct] = useState(null)
  const [editForm]  = Form.useForm()
  const [saving,    setSaving]    = useState(false)
  const [editQty,   setEditQty]   = useState(1)
  const [editGallery,    setEditGallery]    = useState([])
  const [editGalleryFiles, setEditGalleryFiles] = useState([])
  const [editImagePreview, setEditImagePreview] = useState('')

  // Add state
  const [addOpen,    setAddOpen]    = useState(false)
  const [addForm]    = Form.useForm()
  const [adding,     setAdding]     = useState(false)
  const [addQty,     setAddQty]     = useState(1)
  const [addFile,    setAddFile]    = useState(null)
  const [addPreview, setAddPreview] = useState('')
  const [galleryFiles, setGalleryFiles] = useState([])

  // ── Open edit ──────────────────────────────────────────────────────
  const openEdit = (product) => {
    const total = product.totalQuantity || 1
    setEditQty(total)
    setEditGallery(product.galleryImages || [])
    setEditGalleryFiles([])
    setEditImagePreview(getImageUrl(product.imageUrl))
    setEditingProduct({ ...product, newImage: null })
    editForm.setFieldsValue({
      name:              product.name,
      pricePerDay:       product.pricePerDay,
      description:       product.description,
      category:          product.category,
      sku:               product.sku || '',
      totalQuantity:     total,
      availableQuantity: product.availableQuantity ?? total,
    })
  }

  // ── Save edit ──────────────────────────────────────────────────────
  const handleUpdate = async () => {
    const values = await editForm.validateFields()
    setSaving(true)
    const fd = new FormData()
    Object.entries(values).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, v) })
    if (editingProduct.newImage) fd.append('image', editingProduct.newImage)
    fd.append('existingGallery', JSON.stringify(editGallery))
    editGalleryFiles.forEach(f => fd.append('gallery', f))
    try {
      const res = await fetch(`${API_URL}/products/${editingProduct._id}`, { method: 'PUT', body: fd })
      if (res.ok) {
        toast.success('Product updated')
        setEditingProduct(null)
        setEditGalleryFiles([])
        fetchAdminData('/admin/all-products')
      } else { const d = await res.json(); toast.error(d.message || 'Update failed') }
    } catch { toast.error('Update failed') }
    finally { setSaving(false) }
  }

  // ── Add product ────────────────────────────────────────────────────
  const openAdd = () => {
    addForm.resetFields()
    addForm.setFieldsValue({ totalQuantity: 1, availableQuantity: 1 })
    setAddQty(1); setAddFile(null); setAddPreview(''); setGalleryFiles([])
    setAddOpen(true)
  }

  const handleAdd = async () => {
    const values = await addForm.validateFields()
    setAdding(true)
    const fd = new FormData()
    Object.entries(values).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') fd.append(k, v) })
    if (addFile) fd.append('image', addFile)
    galleryFiles.forEach(f => fd.append('gallery', f))
    try {
      const res = await fetch(`${API_URL}/products`, { method: 'POST', body: fd })
      if (res.ok) {
        toast.success('Product added')
        setAddOpen(false); setGalleryFiles([])
        fetchProducts()
        fetchAdminData('/admin/all-products')
      } else { const d = await res.json(); toast.error(d.message || 'Failed') }
    } catch { toast.error('Error adding product') }
    finally { setAdding(false) }
  }

  // ── Sync stock ────────────────────────────────────────────────────
  const [syncing, setSyncing] = useState(false)
  const syncStock = async () => {
    setSyncing(true)
    try {
      const res = await fetch(`${API_URL}/admin/sync-stock`, { method: 'POST' })
      const d = await res.json()
      if (res.ok) {
        toast.success(d.message)
        fetchAdminData('/admin/all-products')
        fetchProducts()
      } else {
        toast.error(d.message || 'Sync failed')
      }
    } catch { toast.error('Sync failed') }
    finally { setSyncing(false) }
  }

  // ── Delete ─────────────────────────────────────────────────────────
  const deleteProduct = async (id) => {
    try {
      const res = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Product deleted'); fetchAdminData('/admin/all-products') }
    } catch { toast.error('Failed to delete') }
  }

  // ── Table columns ──────────────────────────────────────────────────
  const columns = [
    {
      title: 'Product',
      key: 'product',
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
      render: (_, item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image
            src={getImageUrl(item.imageUrl)} alt={item.name} width={44} height={44}
            style={{ objectFit: 'cover', borderRadius: 8, border: '1px solid #f0f0f0', flexShrink: 0 }}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
          />
          <div>
            <div style={{ fontWeight: 600, color: NAVY, fontSize: 14 }}>{item.name}</div>
            {item.sku && (
              <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace', marginTop: 1 }}>
                <BarcodeOutlined style={{ fontSize: 10, marginRight: 3 }} />{item.sku}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      sorter: (a, b) => (a.category || '').localeCompare(b.category || ''),
      render: cat => <Tag style={{ borderRadius: 6 }}>{cat || 'Uncategorised'}</Tag>,
    },
    {
      title: 'Daily Rate',
      dataIndex: 'pricePerDay',
      key: 'pricePerDay',
      sorter: (a, b) => (a.pricePerDay || 0) - (b.pricePerDay || 0),
      render: price => (
        <span style={{ fontWeight: 700, color: NAVY }}>
          <span style={{ color: '#9ca3af' }}>₹</span>{price}
          <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 400 }}> / day</span>
        </span>
      ),
    },
    {
      title: 'Stock',
      key: 'stock',
      sorter: (a, b) => (a.availableQuantity ?? 0) - (b.availableQuantity ?? 0),
      render: (_, item) => {
        const avail = item.availableQuantity ?? (item.isAvailable ? 1 : 0)
        const total = item.totalQuantity || 1
        return (
          <Tooltip title={`${avail} of ${total} available`}>
            <span style={{ fontWeight: 600, color: avail > 0 ? '#10b981' : '#ef4444', fontSize: 13 }}>
              {avail}<span style={{ color: '#d1d5db', fontWeight: 400 }}> / {total}</span>
            </span>
          </Tooltip>
        )
      },
    },
    {
      title: 'Status',
      dataIndex: 'isAvailable',
      key: 'isAvailable',
      render: available =>
        available
          ? <Tag color="success" icon={<CheckCircleOutlined />}>In Stock</Tag>
          : <Tag color="default">Rented Out</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_, item) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(item)} />
          <Popconfirm
            title="Delete this product?"
            description="This action cannot be undone."
            onConfirm={() => deleteProduct(item._id)}
            okText="Delete" okButtonProps={{ danger: true }}
          >
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Inventory"
        title="Products"
        subtitle="Manage all rental equipment and availability"
        actions={
          <Space>
            <Tooltip title="Recalculate available stock from active bookings">
              <Button icon={<SyncOutlined spin={syncing} />} size="large" onClick={syncStock} loading={syncing}>
                Sync Stock
              </Button>
            </Tooltip>
            <Button type="primary" icon={<PlusOutlined />} size="large" onClick={openAdd}>
              Add Product
            </Button>
          </Space>
        }
      />

      {/* ── Search / Filter toolbar ───────────────────────────── */}
      <div style={{
        display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16,
        background: '#fff', borderRadius: 14, padding: '14px 16px',
        border: '1px solid #f0f0f0', alignItems: 'center',
      }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
          placeholder="Search by name, SKU or category…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          allowClear
          style={{ flex: 1, minWidth: 200, maxWidth: 340 }}
        />
        <Select
          value={filterCategory}
          onChange={setFilterCategory}
          style={{ width: 160 }}
          options={[
            { value: 'all', label: 'All Categories' },
            ...allCategories.map(c => ({ value: c, label: c })),
          ]}
          suffixIcon={<FilterOutlined style={{ color: '#9ca3af' }} />}
        />
        <Select
          value={filterStatus}
          onChange={setFilterStatus}
          style={{ width: 140 }}
          options={[
            { value: 'all',        label: 'All Status'   },
            { value: 'in-stock',   label: '✓ In Stock'   },
            { value: 'rented-out', label: '○ Rented Out' },
          ]}
        />
        <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 4 }}>
          {displayList.length} of {adminProductList.length} products
        </span>
      </div>

      <Table
        columns={columns}
        dataSource={displayList}
        rowKey="_id"
        pagination={{
          defaultPageSize: 10, showSizeChanger: true,
          pageSizeOptions: ['5', '10', '20', '50'],
          showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total}`,
        }}
        style={{ background: '#fff', borderRadius: 16 }}
        bordered={false}
      />

      {/* ── Add Product Drawer ─────────────────────────────────────── */}
      <Drawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={<span style={{ color: NAVY, fontWeight: 700 }}>Add Product</span>}
        width={560}
        extra={
          <Button type="primary" loading={adding} onClick={handleAdd}>
            Add to Inventory
          </Button>
        }
        destroyOnHidden
      >
        <ProductForm
          form={addForm}
          totalQty={addQty}
          setTotalQty={setAddQty}
          imagePreview={addPreview}
          onImageChange={file => { setAddFile(file); setAddPreview(URL.createObjectURL(file)); return false }}
          isAdd
          galleryFiles={galleryFiles}
          onAddGallery={f => setGalleryFiles(prev => prev.length < 5 ? [...prev, f] : prev)}
          onRemoveGallery={i => setGalleryFiles(prev => prev.filter((_, idx) => idx !== i))}
        />
      </Drawer>

      {/* ── Edit Product Drawer ────────────────────────────────────── */}
      <Drawer
        open={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        title={<span style={{ color: NAVY, fontWeight: 700 }}>Edit Product</span>}
        width={560}
        extra={
          <Button type="primary" loading={saving} onClick={handleUpdate}>
            Save Changes
          </Button>
        }
        destroyOnHidden
      >
        {editingProduct && (
          <ProductForm
            form={editForm}
            totalQty={editQty}
            setTotalQty={setEditQty}
            isAdd={false}
            imagePreview={editImagePreview}
            onImageChange={file => {
              setEditingProduct(p => ({ ...p, newImage: file }))
              setEditImagePreview(URL.createObjectURL(file))
              return false
            }}
            existingGallery={editGallery}
            onRemoveExistingGallery={i => setEditGallery(prev => prev.filter((_, idx) => idx !== i))}
            galleryFiles={editGalleryFiles}
            onAddGallery={f => setEditGalleryFiles(prev => (prev.length + editGallery.length) < 5 ? [...prev, f] : prev)}
            onRemoveGallery={i => setEditGalleryFiles(prev => prev.filter((_, idx) => idx !== i))}
          />
        )}
      </Drawer>
    </div>
  )
}

export default AdminInventory
