import { useState, useMemo } from 'react'
import {
  Table, Button, Tag, Drawer, Form, Input, InputNumber, Select,
  Upload, Space, Popconfirm, Image, Tooltip, Divider, Modal, Spin,
} from 'antd'
import {
  EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined,
  BarcodeOutlined, CheckCircleOutlined, InboxOutlined, SyncOutlined,
  FilterOutlined, ApartmentOutlined, ToolOutlined, ExclamationCircleOutlined,
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
const ProductForm = ({ form, imagePreview, onImageChange, isAdd,
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

  </Form>
)

// ── Unit status config ────────────────────────────────────────────────
const UNIT_STATUS = {
  available:   { color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', label: 'Available', icon: '●' },
  rented:      { color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', label: 'Rented Out', icon: '◐' },
  maintenance: { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', label: 'Maintenance', icon: '⚙' },
  damaged:     { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', label: 'Damaged', icon: '✕' },
}

// ── Main page ─────────────────────────────────────────────────────────
const AdminInventory = () => {
  const { adminProductList, fetchAdminData, fetchProducts, API_URL } = useGlobal()

  // Units drawer state
  const [unitsProduct,  setUnitsProduct]  = useState(null)   // product whose units are shown
  const [units,         setUnits]         = useState([])
  const [unitsLoading,  setUnitsLoading]  = useState(false)
  const [addUnitOpen,   setAddUnitOpen]   = useState(false)
  const [bulkCount,     setBulkCount]     = useState(1)
  const [addingUnits,   setAddingUnits]   = useState(false)
  const [editUnit,      setEditUnit]      = useState(null)   // unit being edited inline
  const [unitFilter,    setUnitFilter]    = useState('all')

  const fetchUnits = async (product) => {
    setUnitsLoading(true)
    try {
      const res = await fetch(`${API_URL}/products/${product._id}/units`)
      setUnits(await res.json())
    } catch { toast.error('Failed to load units') }
    finally { setUnitsLoading(false) }
  }

  const openUnits = (product) => {
    setUnitsProduct(product)
    setUnitFilter('all')
    fetchUnits(product)
  }

  const handleAddUnits = async () => {
    if (!unitsProduct) return
    setAddingUnits(true)
    try {
      const res = await fetch(`${API_URL}/products/${unitsProduct._id}/units/bulk`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: bulkCount }),
      })
      if (res.ok) {
        toast.success(`${bulkCount} unit${bulkCount > 1 ? 's' : ''} added`)
        setAddUnitOpen(false); setBulkCount(1)
        await fetchUnits(unitsProduct)
        fetchAdminData('/admin/all-products')
      }
    } catch { toast.error('Failed') }
    finally { setAddingUnits(false) }
  }

  const handleUpdateUnit = async (unit, changes) => {
    try {
      const res = await fetch(`${API_URL}/products/${unitsProduct._id}/units/${unit._id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      })
      if (res.ok) {
        await fetchUnits(unitsProduct)
        fetchAdminData('/admin/all-products')
        setEditUnit(null)
      }
    } catch { toast.error('Failed to update unit') }
  }

  const handleDeleteUnit = async (unit) => {
    try {
      const res = await fetch(`${API_URL}/products/${unitsProduct._id}/units/${unit._id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Unit removed')
        await fetchUnits(unitsProduct)
        fetchAdminData('/admin/all-products')
      }
    } catch { toast.error('Failed') }
  }

  const filteredUnits = units.filter(u => unitFilter === 'all' || u.status === unitFilter)

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
  const [editGallery,    setEditGallery]    = useState([])
  const [editGalleryFiles, setEditGalleryFiles] = useState([])
  const [editImagePreview, setEditImagePreview] = useState('')

  // Add state
  const [addOpen,    setAddOpen]    = useState(false)
  const [addForm]    = Form.useForm()
  const [adding,     setAdding]     = useState(false)
  const [addFile,    setAddFile]    = useState(null)
  const [addPreview, setAddPreview] = useState('')
  const [galleryFiles, setGalleryFiles] = useState([])

  // ── Open edit ──────────────────────────────────────────────────────
  const openEdit = (product) => {
    setEditGallery(product.galleryImages || [])
    setEditGalleryFiles([])
    setEditImagePreview(getImageUrl(product.imageUrl))
    setEditingProduct({ ...product, newImage: null })
    editForm.setFieldsValue({
      name:        product.name,
      pricePerDay: product.pricePerDay,
      description: product.description,
      category:    product.category,
      sku:         product.sku || '',
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
    setAddFile(null); setAddPreview(''); setGalleryFiles([])
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
        const color = avail === total ? '#10b981' : avail > 0 ? '#f59e0b' : '#ef4444'
        return (
          <Tooltip title={`${avail} available · ${total - avail} rented/out`}>
            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer' }}
              onClick={() => openUnits(item)}>
              <span style={{ fontWeight: 700, color, fontSize: 13 }}>
                {avail}<span style={{ color: '#d1d5db', fontWeight: 400 }}> / {total}</span>
              </span>
              {total > 1 && (
                <div style={{ display: 'flex', gap: 2 }}>
                  {Array.from({ length: total }).map((_, i) => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i < avail ? '#10b981' : '#e5e7eb' }} />
                  ))}
                </div>
              )}
            </div>
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
          <Tooltip title="Manage unit IDs & status">
            <Button
              icon={<ApartmentOutlined />}
              size="small"
              onClick={() => openUnits(item)}
              style={{ color: NAVY, borderColor: '#c7d2fe' }}
            />
          </Tooltip>
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

      {/* ── Units Drawer ───────────────────────────────────────────── */}
      <Drawer
        open={!!unitsProduct}
        onClose={() => { setUnitsProduct(null); setEditUnit(null) }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ApartmentOutlined style={{ color: NAVY }} />
            <span style={{ fontWeight: 700, color: NAVY }}>
              Unit IDs — {unitsProduct?.name}
            </span>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#9ca3af', background: '#f1f5f9', padding: '2px 8px', borderRadius: 4 }}>
              {unitsProduct?.sku}
            </span>
          </div>
        }
        width={520}
        extra={
          <Button type="primary" icon={<PlusOutlined />}
            onClick={() => setAddUnitOpen(true)}
            style={{ background: NAVY, borderColor: NAVY }}>
            Add Units
          </Button>
        }
        destroyOnHidden
      >
        {/* Stock summary bar */}
        {unitsProduct && !unitsLoading && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {Object.entries(UNIT_STATUS).map(([key, cfg]) => {
              const count = units.filter(u => u.status === key).length
              return (
                <button key={key}
                  onClick={() => setUnitFilter(unitFilter === key ? 'all' : key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
                    borderRadius: 20, border: `1px solid ${unitFilter === key ? cfg.color : cfg.border}`,
                    background: unitFilter === key ? cfg.color : cfg.bg,
                    color: unitFilter === key ? '#fff' : cfg.color,
                    cursor: 'pointer', fontWeight: 700, fontSize: 12, transition: 'all 0.15s',
                  }}>
                  <span>{cfg.icon}</span>
                  <span>{cfg.label}</span>
                  <span style={{ background: unitFilter === key ? 'rgba(255,255,255,0.3)' : cfg.color + '22', borderRadius: 10, padding: '0 6px', fontSize: 11 }}>{count}</span>
                </button>
              )
            })}
          </div>
        )}

        {unitsLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spin /></div>
        ) : filteredUnits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
            {units.length === 0
              ? <><div style={{ fontSize: 32, marginBottom: 12 }}>📦</div><div style={{ fontWeight: 600 }}>No units yet</div><div style={{ fontSize: 12, marginTop: 4 }}>Click "Add Units" to create unit IDs</div></>
              : 'No units match this filter'
            }
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredUnits.map(unit => {
              const cfg = UNIT_STATUS[unit.status] || UNIT_STATUS.available
              const isEditing = editUnit?._id === unit._id
              return (
                <div key={unit._id} style={{
                  border: `1px solid ${isEditing ? cfg.color : '#e5e7eb'}`,
                  borderRadius: 10, background: isEditing ? cfg.bg : '#fff',
                  overflow: 'hidden', transition: 'all 0.15s',
                }}>
                  {/* Unit header row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                      background: cfg.bg, border: `1px solid ${cfg.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, color: cfg.color, fontWeight: 700,
                    }}>{cfg.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, color: NAVY, fontSize: 13, fontFamily: 'monospace' }}>{unit.unitCode}</div>
                      {unit.serialNumber && (
                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>SN: {unit.serialNumber}</div>
                      )}
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                    }}>{cfg.label}</span>
                    <Button size="small" icon={<EditOutlined />}
                      onClick={() => setEditUnit(isEditing ? null : { ...unit })}
                      style={{ color: isEditing ? cfg.color : undefined }} />
                    <Popconfirm title="Remove this unit?" okType="danger" okText="Remove" onConfirm={() => handleDeleteUnit(unit)}>
                      <Button size="small" icon={<DeleteOutlined />} danger />
                    </Popconfirm>
                  </div>

                  {/* Inline edit panel */}
                  {isEditing && (
                    <div style={{ borderTop: `1px solid ${cfg.border}`, padding: '12px 14px', background: '#fafafa' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Status</div>
                          <Select size="small" style={{ width: '100%' }} value={editUnit.status}
                            onChange={v => setEditUnit(p => ({ ...p, status: v }))}
                            options={Object.entries(UNIT_STATUS).map(([k, c]) => ({ value: k, label: c.label }))} />
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Condition</div>
                          <Select size="small" style={{ width: '100%' }} value={editUnit.condition || 'Good'}
                            onChange={v => setEditUnit(p => ({ ...p, condition: v }))}
                            options={['Excellent', 'Good', 'Fair', 'Needs Service'].map(c => ({ value: c, label: c }))} />
                        </div>
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Serial / Asset Number</div>
                        <Input size="small" placeholder="Physical serial or asset tag"
                          value={editUnit.serialNumber}
                          onChange={e => setEditUnit(p => ({ ...p, serialNumber: e.target.value }))} />
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Notes</div>
                        <Input.TextArea rows={2} size="small" placeholder="Any remarks…"
                          value={editUnit.notes}
                          onChange={e => setEditUnit(p => ({ ...p, notes: e.target.value }))} />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button size="small" type="primary"
                          style={{ background: cfg.color, borderColor: cfg.color }}
                          onClick={() => handleUpdateUnit(unit, { status: editUnit.status, serialNumber: editUnit.serialNumber, condition: editUnit.condition, notes: editUnit.notes })}>
                          Save
                        </Button>
                        <Button size="small" onClick={() => setEditUnit(null)}>Cancel</Button>
                      </div>
                    </div>
                  )}

                  {/* Notes preview when not editing */}
                  {!isEditing && unit.notes && (
                    <div style={{ borderTop: '1px solid #f3f4f6', padding: '6px 14px', fontSize: 11, color: '#6b7280', background: '#fafafa' }}>
                      {unit.notes}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Drawer>

      {/* ── Add Units Modal ────────────────────────────────────────────── */}
      <Modal
        open={addUnitOpen}
        onCancel={() => { setAddUnitOpen(false); setBulkCount(1) }}
        onOk={handleAddUnits}
        okText={`Add ${bulkCount} Unit${bulkCount > 1 ? 's' : ''}`}
        okButtonProps={{ style: { background: NAVY, borderColor: NAVY }, loading: addingUnits }}
        title={<span style={{ color: NAVY, fontWeight: 700 }}>Add Units to {unitsProduct?.name}</span>}
        width={380}
        centered
      >
        <div style={{ padding: '12px 0' }}>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>
            Each unit gets a unique ID (e.g. <code style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: 4 }}>{unitsProduct?.sku}-U{String((units.length || 0) + 1).padStart(2, '0')}</code>)
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>How many units to add?</div>
          <InputNumber
            min={1} max={50} value={bulkCount} onChange={v => setBulkCount(v || 1)}
            size="large" style={{ width: '100%' }}
            addonBefore="Units"
          />
        </div>
      </Modal>
    </div>
  )
}

export default AdminInventory
