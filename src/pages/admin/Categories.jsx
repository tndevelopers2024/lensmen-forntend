import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Button, Tag, Drawer, Form, Input, Space,
  Typography, Popconfirm, Tooltip, Divider,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  HolderOutlined, ArrowUpOutlined, ArrowDownOutlined,
} from '@ant-design/icons'
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
  const [search,     setSearch]     = useState('')

  // drag state
  const dragIdx = useRef(null)
  const [draggingId, setDraggingId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)

  const displayCategories = useMemo(() => {
    if (!search.trim()) return categories
    const q = search.toLowerCase()
    return categories.filter(c => (c.name || '').toLowerCase().includes(q))
  }, [categories, search])

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

  const saveOrder = async (reordered) => {
    try {
      await fetch(`${API_URL}/categories/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reordered.map((c, i) => ({ id: c._id, position: i }))),
      })
    } catch { toast.error('Failed to save order') }
  }

  // ── Drag handlers ─────────────────────────────────────────────────
  const onDragStart = (e, idx) => {
    dragIdx.current = idx
    setDraggingId(categories[idx]._id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const onDragOver = (e, idx) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverId(categories[idx]._id)
  }

  const onDrop = (e, idx) => {
    e.preventDefault()
    const from = dragIdx.current
    if (from === null || from === idx) { cleanup(); return }
    const reordered = [...categories]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(idx, 0, moved)
    setCategories(reordered)
    saveOrder(reordered)
    cleanup()
  }

  const cleanup = () => { dragIdx.current = null; setDraggingId(null); setDragOverId(null) }

  // ── Up / Down arrows ──────────────────────────────────────────────
  const move = (idx, dir) => {
    const target = idx + dir
    if (target < 0 || target >= categories.length) return
    const reordered = [...categories]
    ;[reordered[idx], reordered[target]] = [reordered[target], reordered[idx]]
    setCategories(reordered)
    saveOrder(reordered)
  }

  // ── CRUD ──────────────────────────────────────────────────────────
  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true) }
  const openEdit   = (cat) => { setEditing(cat); form.setFieldsValue({ name: cat.name, description: cat.description }); setModalOpen(true) }

  const handleSave = async () => {
    const values = await form.validateFields()
    setSaving(true)
    try {
      const url    = editing ? `${API_URL}/categories/${editing._id}` : `${API_URL}/categories`
      const method = editing ? 'PUT' : 'POST'
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) })
      const data   = await res.json()
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

  return (
    <div>
      <PageHeader
        eyebrow="Inventory"
        title="Categories"
        subtitle="Organise your rental equipment — drag rows or use arrows to reorder the menu"
        actions={
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={openCreate}>
            New Category
          </Button>
        }
      />

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total',         value: categories.length },
          { label: 'With products', value: categories.filter(c => c.productCount > 0).length },
          { label: 'Empty',         value: categories.filter(c => c.productCount === 0).length },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '12px 20px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, background: '#fff', borderRadius: 14, padding: '12px 16px', border: '1px solid #f0f0f0' }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
          placeholder="Search categories…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          allowClear
          style={{ maxWidth: 300 }}
        />
        <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 4 }}>
          {displayCategories.length} of {categories.length} categories{search ? ` matching "${search}"` : ''}
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: '#9ca3af' }}>
          Drag <HolderOutlined /> or use ↑↓ to reorder · order reflects on the storefront menu
        </span>
      </div>

      {/* Drag-to-reorder table */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '44px 44px 1fr 260px 110px 130px 100px', alignItems: 'center', padding: '10px 16px', borderBottom: '2px solid #f0f0f0', background: '#fafafa' }}>
          {['', 'POS', 'CATEGORY NAME', 'DESCRIPTION', 'PRODUCTS', 'CREATED', 'ACTIONS'].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Loading…</div>
        ) : displayCategories.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>No categories found</div>
        ) : (
          displayCategories.map((cat, idx) => {
            const realIdx = categories.findIndex(c => c._id === cat._id)
            const isDragging = draggingId === cat._id
            const isOver     = dragOverId === cat._id

            return (
              <div
                key={cat._id}
                draggable
                onDragStart={e => onDragStart(e, realIdx)}
                onDragOver={e => onDragOver(e, realIdx)}
                onDrop={e => onDrop(e, realIdx)}
                onDragEnd={cleanup}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '44px 44px 1fr 260px 110px 130px 100px',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderBottom: '1px solid #f9fafb',
                  background: isDragging ? '#f0f1f7' : isOver ? '#fff7ed' : '#fff',
                  borderLeft: isOver ? `3px solid ${BRAND}` : '3px solid transparent',
                  opacity: isDragging ? 0.5 : 1,
                  cursor: 'grab',
                  transition: 'background 0.1s, border-color 0.1s',
                }}
              >
                {/* Drag handle */}
                <div style={{ color: '#9ca3af', fontSize: 16, cursor: 'grab', display: 'flex', alignItems: 'center' }}>
                  <HolderOutlined />
                </div>

                {/* Position */}
                <div style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af' }}>{realIdx + 1}</div>

                {/* Name */}
                <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{cat.name}</div>

                {/* Description */}
                <div style={{ fontSize: 12, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {cat.description || <em style={{ color: '#d1d5db' }}>No description</em>}
                </div>

                {/* Products */}
                <div>
                  <Tag color={cat.productCount > 0 ? 'blue' : 'default'} style={{ fontWeight: 600 }}>
                    {cat.productCount} product{cat.productCount !== 1 ? 's' : ''}
                  </Tag>
                </div>

                {/* Created */}
                <div style={{ fontSize: 12, color: '#9ca3af' }}>
                  {new Date(cat.createdAt).toLocaleDateString('en-GB')}
                </div>

                {/* Actions */}
                <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 4 }}>
                  <Tooltip title="Move up">
                    <Button size="small" icon={<ArrowUpOutlined />} onClick={() => move(realIdx, -1)} disabled={realIdx === 0} />
                  </Tooltip>
                  <Tooltip title="Move down">
                    <Button size="small" icon={<ArrowDownOutlined />} onClick={() => move(realIdx, 1)} disabled={realIdx === categories.length - 1} />
                  </Tooltip>
                  <Tooltip title="Edit">
                    <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(cat)} />
                  </Tooltip>
                  <Popconfirm
                    title="Delete this category?"
                    description={cat.productCount > 0 ? `${cat.productCount} product(s) use this — reassign first.` : 'This cannot be undone.'}
                    onConfirm={() => handleDelete(cat)}
                    okText="Delete" okButtonProps={{ danger: true }}
                    disabled={cat.productCount > 0}
                  >
                    <Tooltip title={cat.productCount > 0 ? 'Cannot delete — products assigned' : 'Delete'}>
                      <Button size="small" icon={<DeleteOutlined />} danger disabled={cat.productCount > 0} />
                    </Tooltip>
                  </Popconfirm>
                </div>
              </div>
            )
          })
        )}
      </div>

      <Drawer
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={<span style={{ color: NAVY, fontWeight: 700 }}>{editing ? `Edit — ${editing.name}` : 'New Category'}</span>}
        width={480}
        extra={<Button type="primary" loading={saving} onClick={handleSave}>{editing ? 'Save Changes' : 'Create Category'}</Button>}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Divider orientation="left" style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Category Details
          </Divider>
          <Form.Item label="Category Name" name="name" rules={[{ required: true, message: 'Name is required' }]}>
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
