import { useState, useEffect } from 'react'
import {
  Button, Input, Select, Drawer, Form,
  Popconfirm, Tag, Tooltip, Empty, Spin, Modal,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  LinkOutlined, AppstoreOutlined, ShoppingOutlined,
  HolderOutlined, MenuOutlined, PlusCircleOutlined,
} from '@ant-design/icons'
import toast from 'react-hot-toast'
import { useGlobal } from '../../context/GlobalContext'

const API_URL = import.meta.env.VITE_API_URL

const NAVY  = '#1e1b4b'
const BRAND = '#E5550F'

const TYPE_META = {
  all:      { label: 'All Products', color: 'purple', icon: <AppstoreOutlined /> },
  category: { label: 'Category',     color: 'blue',   icon: <MenuOutlined /> },
  product:  { label: 'Product',      color: 'green',  icon: <ShoppingOutlined /> },
  url:      { label: 'Custom URL',   color: 'default',icon: <LinkOutlined /> },
}

const POSITION_META = {
  'top-nav': { label: 'Top Nav',  color: '#f59e0b', bg: '#fffbeb' },
  'sidebar':  { label: 'Sidebar', color: '#8b5cf6', bg: '#f5f3ff' },
  '':         { label: 'None',    color: '#9ca3af', bg: '#f9fafb' },
}

const itemRoute = (item) => {
  if (item.type === 'all')      return '/ (all products)'
  if (item.type === 'category') return `?category=${item.categoryName || '…'}`
  if (item.type === 'product')  return `?product=${item.productName || '…'}`
  if (item.type === 'url')      return item.url || '…'
  return ''
}

const slugify = (str) =>
  str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const newItem = () => ({
  _id: String(Date.now() + Math.random()),
  label: '', type: 'category', categoryName: '',
  productId: null, productName: '', url: '', imageUrl: '', children: [],
})

// ── Item row (top-level) ──────────────────────────────────────────────────
const ItemRow = ({ item, index, dragIdx, overIdx, onDragStart, onDragOver, onDrop, onDragEnd, onEdit, onDelete, onAddChild }) => {
  const meta = TYPE_META[item.type] || TYPE_META.url
  const isDragging = dragIdx === index
  const isOver     = overIdx  === index

  return (
    <div
      onDragOver={e => { e.preventDefault(); onDragOver(index) }}
      onDrop={e => { e.preventDefault(); onDrop(index) }}
    >
      {/* Parent row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', borderRadius: 10,
        border: `1.5px solid ${isOver ? BRAND : '#e5e7eb'}`,
        background: isDragging ? '#fff7ed' : '#fff',
        opacity: isDragging ? 0.5 : 1,
        marginBottom: item.children?.length ? 0 : 8,
        borderBottom: item.children?.length ? 'none' : undefined,
        borderBottomLeftRadius: item.children?.length ? 0 : 10,
        borderBottomRightRadius: item.children?.length ? 0 : 10,
      }}>
        <div
          draggable
          onDragStart={e => onDragStart(e, index)}
          onDragEnd={onDragEnd}
          style={{ cursor: 'grab', color: '#d1d5db', fontSize: 14, flexShrink: 0 }}
        >
          <HolderOutlined />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, color: NAVY, fontSize: 13 }}>
              {item.label || <em style={{ color: '#d1d5db', fontWeight: 400 }}>No label</em>}
            </span>
            <Tag color={meta.color} icon={meta.icon} style={{ fontSize: 11, margin: 0, borderRadius: 20 }}>
              {meta.label}
            </Tag>
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
            → {itemRoute(item)}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <Tooltip title="Add sub-item">
            <Button
              type="text" size="small"
              icon={<PlusCircleOutlined style={{ color: '#9ca3af' }} />}
              onClick={() => onAddChild(index)}
              style={{ border: '1px solid #e5e7eb', borderRadius: 8, width: 28, height: 28 }}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text" size="small" icon={<EditOutlined style={{ color: '#9ca3af' }} />}
              onClick={() => onEdit(index, null)}
              style={{ border: '1px solid #e5e7eb', borderRadius: 8, width: 28, height: 28 }}
            />
          </Tooltip>
          <Popconfirm title="Remove this item?" onConfirm={() => onDelete(index)} okText="Remove" okButtonProps={{ danger: true }}>
            <Button
              type="text" size="small" danger icon={<DeleteOutlined />}
              style={{ border: '1px solid #fee2e2', borderRadius: 8, width: 28, height: 28 }}
            />
          </Popconfirm>
        </div>
      </div>

      {/* Children */}
      {item.children?.map((child, ci) => (
        <div key={child._id || ci} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 14px 8px 40px',
          background: '#fafafa',
          border: '1.5px solid #e5e7eb',
          borderTop: 'none',
          marginBottom: ci === item.children.length - 1 ? 8 : 0,
          borderBottomLeftRadius:  ci === item.children.length - 1 ? 10 : 0,
          borderBottomRightRadius: ci === item.children.length - 1 ? 10 : 0,
        }}>
          <div style={{ color: '#e5e7eb', fontSize: 13, flexShrink: 0 }}>
            <HolderOutlined />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, color: '#374151', fontSize: 13 }}>{child.label}</span>
              <Tag color={(TYPE_META[child.type] || TYPE_META.url).color} style={{ fontSize: 10, margin: 0, borderRadius: 20 }}>
                {(TYPE_META[child.type] || TYPE_META.url).label}
              </Tag>
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>→ {itemRoute(child)}</div>
          </div>
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            <Tooltip title="Edit">
              <Button type="text" size="small" icon={<EditOutlined style={{ color: '#9ca3af' }} />}
                onClick={() => onEdit(index, ci)}
                style={{ border: '1px solid #e5e7eb', borderRadius: 8, width: 28, height: 28 }} />
            </Tooltip>
            <Popconfirm title="Remove sub-item?" onConfirm={() => onDelete(index, ci)} okText="Remove" okButtonProps={{ danger: true }}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />}
                style={{ border: '1px solid #fee2e2', borderRadius: 8, width: 28, height: 28 }} />
            </Popconfirm>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function Menus() {
  const { categoriesData, adminProductList } = useGlobal()

  const [menus,       setMenus]       = useState([])
  const [loading,     setLoading]     = useState(false)
  const [selected,    setSelected]    = useState(null)   // full menu object being edited
  const [items,       setItems]       = useState([])
  const [saving,      setSaving]      = useState(false)
  const [menuTitle,   setMenuTitle]   = useState('')
  const [menuPos,     setMenuPos]     = useState('')

  // create-menu modal
  const [newModal,    setNewModal]    = useState(false)
  const [newTitle,    setNewTitle]    = useState('')
  const [newHandle,   setNewHandle]   = useState('')
  const [newPos,      setNewPos]      = useState('')
  const [creating,    setCreating]    = useState(false)

  // item drawer
  const [drawerOpen,     setDrawerOpen]     = useState(false)
  const [editParent,     setEditParent]     = useState(null)
  const [editChild,      setEditChild]      = useState(null)
  const [form]           = Form.useForm()
  const [imgUploading,   setImgUploading]   = useState(false)
  const [itemImageUrl,   setItemImageUrl]   = useState('')

  // drag
  const [dragIdx, setDragIdx] = useState(null)
  const [overIdx, setOverIdx] = useState(null)

  // ── fetch list ────────────────────────────────────────────────────────
  useEffect(() => { fetchMenus() }, [])

  const fetchMenus = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/menus`)
      if (res.ok) {
        const data = await res.json()
        setMenus(data)
        if (data.length > 0 && !selected) selectMenu(data[0])
      }
    } catch {}
    setLoading(false)
  }

  const selectMenu = (menu) => {
    setSelected(menu)
    setItems(menu.items || [])
    setMenuTitle(menu.title || '')
    setMenuPos(menu.position || '')
  }

  // ── save ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch(`${API_URL}/menus/${selected.handle}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: menuTitle, position: menuPos, items }),
      })
      if (res.ok) {
        const updated = await res.json()
        setMenus(prev => prev.map(m => m.handle === selected.handle ? updated : m))
        setSelected(updated)
        toast.success('Menu saved')
      } else toast.error('Failed to save')
    } catch { toast.error('Network error') }
    setSaving(false)
  }

  // ── create menu ───────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const res = await fetch(`${API_URL}/menus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, handle: newHandle || slugify(newTitle), position: newPos }),
      })
      if (res.ok) {
        const menu = await res.json()
        setMenus(prev => [...prev, menu])
        selectMenu(menu)
        setNewModal(false)
        setNewTitle(''); setNewHandle(''); setNewPos('')
        toast.success('Menu created')
      } else {
        const d = await res.json()
        toast.error(d.message || 'Failed to create')
      }
    } catch { toast.error('Network error') }
    setCreating(false)
  }

  // ── delete menu ───────────────────────────────────────────────────────
  const handleDeleteMenu = async (menu) => {
    try {
      await fetch(`${API_URL}/menus/${menu._id}`, { method: 'DELETE' })
      const next = menus.filter(m => m._id !== menu._id)
      setMenus(next)
      if (selected?._id === menu._id) next.length ? selectMenu(next[0]) : setSelected(null)
      toast.success('Menu deleted')
    } catch { toast.error('Network error') }
  }

  // ── item drawer ───────────────────────────────────────────────────────
  const openAddItem = () => {
    setEditParent(null); setEditChild(null)
    form.resetFields(); form.setFieldsValue({ type: 'category' })
    setItemImageUrl('')
    setDrawerOpen(true)
  }

  const openEdit = (pIdx, cIdx) => {
    const item = cIdx === null ? items[pIdx] : items[pIdx].children[cIdx]
    setEditParent(pIdx); setEditChild(cIdx)
    form.setFieldsValue(item)
    setItemImageUrl(item.imageUrl || '')
    setDrawerOpen(true)
  }

  const openAddChild = (pIdx) => {
    setEditParent(pIdx); setEditChild('new')
    form.resetFields(); form.setFieldsValue({ type: 'category' })
    setItemImageUrl('')
    setDrawerOpen(true)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImgUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await fetch(`${API_URL}/admin/upload-image`, { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok) {
        setItemImageUrl(data.url)
        form.setFieldValue('imageUrl', data.url)
      } else {
        toast.error(data.message || 'Upload failed')
      }
    } catch {
      toast.error('Upload failed')
    } finally {
      setImgUploading(false)
    }
  }

  const handleDrawerSave = () => {
    form.validateFields().then(vals => {
      const item = { ...newItem(), ...vals, children: [] }
      setItems(prev => {
        const next = prev.map(it => ({ ...it, children: [...(it.children || [])] }))
        if (editParent === null) {
          // new top-level
          next.push(item)
        } else if (editChild === null) {
          // edit top-level
          next[editParent] = { ...next[editParent], ...vals }
        } else if (editChild === 'new') {
          // new child
          next[editParent].children.push(item)
        } else {
          // edit child
          next[editParent].children[editChild] = { ...next[editParent].children[editChild], ...vals }
        }
        return next
      })
      setDrawerOpen(false)
    })
  }

  const handleDeleteItem = (pIdx, cIdx = null) => {
    setItems(prev => {
      const next = prev.map(it => ({ ...it, children: [...(it.children || [])] }))
      if (cIdx === null) { next.splice(pIdx, 1) }
      else { next[pIdx].children.splice(cIdx, 1) }
      return next
    })
  }

  // ── drag ──────────────────────────────────────────────────────────────
  const handleDragStart = (e, idx) => { setDragIdx(idx); e.dataTransfer.effectAllowed = 'move' }
  const handleDragOver  = (idx)    => setOverIdx(idx)
  const handleDragEnd   = ()       => { setDragIdx(null); setOverIdx(null) }
  const handleDrop      = (toIdx)  => {
    if (dragIdx === null || dragIdx === toIdx) return
    setItems(prev => {
      const next = [...prev]
      const [moved] = next.splice(dragIdx, 1)
      next.splice(toIdx, 0, moved)
      return next
    })
    setDragIdx(null); setOverIdx(null)
  }

  const watchType = Form.useWatch('type', form)

  const totalItems = (menu) =>
    (menu.items || []).reduce((n, it) => n + 1 + (it.children?.length || 0), 0)

  // ── render ────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
            STOREFRONT
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: NAVY, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Navigation Menus
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            Build your storefront navigation — drag items to reorder, add submenus per item
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
      ) : (
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

          {/* ── Left panel: menu list ─────────────────────────────── */}
          <div style={{
            width: 260, flexShrink: 0,
            background: '#fff', borderRadius: 14, border: '1.5px solid #e5e7eb',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '14px 18px', borderBottom: '1px solid #f3f4f6',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontWeight: 700, color: NAVY, fontSize: 14 }}>All Menus</span>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>{menus.length} menu{menus.length !== 1 ? 's' : ''}</span>
            </div>

            {menus.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#d1d5db', fontSize: 13 }}>
                No menus yet
              </div>
            ) : menus.map(menu => {
              const pm   = POSITION_META[menu.position || ''] || POSITION_META['']
              const isActive = selected?._id === menu._id
              return (
                <div
                  key={menu._id}
                  onClick={() => selectMenu(menu)}
                  style={{
                    padding: '13px 18px',
                    borderLeft: isActive ? `3px solid ${BRAND}` : '3px solid transparent',
                    background: isActive ? '#fff7f5' : '#fff',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f3f4f6',
                    transition: 'background 0.12s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, color: isActive ? BRAND : NAVY, fontSize: 13 }}>
                      {menu.title}
                    </span>
                    {menu.position && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '1px 7px',
                        borderRadius: 20, background: pm.bg, color: pm.color,
                      }}>
                        {pm.label}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>
                    {menu.handle} · {totalItems(menu)} item{totalItems(menu) !== 1 ? 's' : ''}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Right panel: editor ───────────────────────────────── */}
          {selected ? (
            <div style={{ flex: 1 }}>
              {/* Save bar */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <Button
                  type="primary" loading={saving} onClick={handleSave}
                  style={{ background: NAVY, borderColor: NAVY, borderRadius: 10, fontWeight: 700, height: 40 }}
                >
                  Save Menu
                </Button>
              </div>
              {/* Items */}
              <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #e5e7eb', padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 700, color: NAVY, fontSize: 14 }}>
                      Menu Items ({items.length})
                    </span>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>⠿ Drag to reorder</span>
                  </div>
                  <Button icon={<PlusOutlined />} onClick={openAddItem}
                    style={{ borderRadius: 8, fontWeight: 600 }}>
                    Add Item
                  </Button>
                </div>

                {items.length === 0 ? (
                  <Empty description="No items yet — click Add Item" style={{ padding: 32 }} />
                ) : (
                  items.map((item, idx) => (
                    <ItemRow
                      key={item._id || idx}
                      item={item} index={idx}
                      dragIdx={dragIdx} overIdx={overIdx}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onDragEnd={handleDragEnd}
                      onEdit={openEdit}
                      onDelete={handleDeleteItem}
                      onAddChild={openAddChild}
                    />
                  ))
                )}
              </div>
            </div>
          ) : (
            <div style={{
              flex: 1, background: '#fff', borderRadius: 14, border: '1.5px dashed #e5e7eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300,
            }}>
              <Empty description="Select a menu from the left or create one" />
            </div>
          )}
        </div>
      )}

      {/* ── New Menu modal ────────────────────────────────────────────── */}
      <Modal
        open={newModal}
        onCancel={() => { setNewModal(false); setNewTitle(''); setNewHandle(''); setNewPos('') }}
        title={<span style={{ color: NAVY, fontWeight: 700 }}>Create Menu</span>}
        footer={null}
        width={420}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Menu Name</div>
            <Input
              value={newTitle}
              onChange={e => {
                setNewTitle(e.target.value)
                setNewHandle(slugify(e.target.value))
              }}
              placeholder="e.g. Main Navigation, Sidebar Menu"
              size="large"
            />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Handle</div>
            <Input
              value={newHandle}
              onChange={e => setNewHandle(e.target.value)}
              placeholder="auto-generated from name"
              prefix={<code style={{ fontSize: 11, color: '#9ca3af' }}>/</code>}
            />
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>URL-safe, unique slug</div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Position</div>
            <Select
              value={newPos} onChange={v => setNewPos(v)} style={{ width: '100%' }} size="large"
              options={[
                { value: '',        label: 'None — not shown automatically' },
                { value: 'top-nav', label: 'Top Navigation bar'             },
                { value: 'sidebar', label: 'Sidebar category list'          },
              ]}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
            <Button onClick={() => setNewModal(false)}>Cancel</Button>
            <Button
              type="primary" loading={creating} onClick={handleCreate}
              disabled={!newTitle.trim()}
              style={{ background: NAVY, borderColor: NAVY }}
            >
              Create Menu
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Item Drawer ───────────────────────────────────────────────── */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={
          <span style={{ color: NAVY, fontWeight: 700 }}>
            {editParent === null ? 'Add Menu Item' : editChild === null ? 'Edit Item' : editChild === 'new' ? 'Add Sub-item' : 'Edit Sub-item'}
          </span>
        }
        size="default"
        extra={<Button type="primary" onClick={handleDrawerSave} style={{ background: NAVY, borderColor: NAVY }}>Apply</Button>}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Label" name="label" rules={[{ required: true, message: 'Label required' }]}>
            <Input placeholder="e.g. Cameras, New Arrivals…" size="large" />
          </Form.Item>

          <Form.Item label="Type" name="type" rules={[{ required: true }]}>
            <Select
              size="large"
              options={Object.entries(TYPE_META).map(([v, m]) => ({ value: v, label: m.label }))}
            />
          </Form.Item>

          {watchType === 'category' && (
            <Form.Item label="Category" name="categoryName" rules={[{ required: true, message: 'Select a category' }]}>
              <Select showSearch placeholder="Select category" size="large"
                options={categoriesData.map(c => ({ value: c.name, label: c.name }))} />
            </Form.Item>
          )}

          {watchType === 'product' && (
            <Form.Item label="Product" name="productName" rules={[{ required: true, message: 'Select a product' }]}>
              <Select showSearch placeholder="Select product" size="large"
                options={(adminProductList || []).map(p => ({ value: p.name, label: p.name }))} />
            </Form.Item>
          )}

          {watchType === 'url' && (
            <Form.Item label="URL" name="url" rules={[{ required: true, message: 'Enter URL' }]}>
              <Input prefix={<LinkOutlined style={{ color: '#9ca3af' }} />} placeholder="https://…" size="large" />
            </Form.Item>
          )}

          <Form.Item label="Image (optional)" name="imageUrl"
            extra="Shown beside label in sidebar layout">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {itemImageUrl && (
                <div style={{ position: 'relative', width: 80, height: 80 }}>
                  <img src={itemImageUrl} alt="preview"
                    style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <button type="button"
                    onClick={() => { setItemImageUrl(''); form.setFieldValue('imageUrl', '') }}
                    style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#ef4444', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12, lineHeight: '20px', textAlign: 'center', padding: 0 }}>
                    ×
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 14px', borderRadius: 6, border: '1px solid #d9d9d9',
                  cursor: imgUploading ? 'not-allowed' : 'pointer', fontSize: 13,
                  background: imgUploading ? '#f5f5f5' : '#fff', color: '#374151',
                }}>
                  <PlusOutlined style={{ fontSize: 11 }} />
                  {imgUploading ? 'Uploading…' : 'Upload Image'}
                  <input type="file" accept="image/*" style={{ display: 'none' }}
                    disabled={imgUploading} onChange={handleImageUpload} />
                </label>
                {!itemImageUrl && (
                  <Input
                    prefix={<LinkOutlined style={{ color: '#9ca3af' }} />}
                    placeholder="or paste URL…"
                    value={form.getFieldValue('imageUrl') || ''}
                    onChange={e => { setItemImageUrl(e.target.value); form.setFieldValue('imageUrl', e.target.value) }}
                    style={{ flex: 1 }}
                  />
                )}
              </div>
            </div>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}
