import { useState, useEffect, useRef } from 'react'
import {
  Button, Input, Select, Drawer, Form, Popconfirm,
  Tag, Tooltip, Divider, Empty, Spin,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  LinkOutlined, AppstoreOutlined, ShoppingOutlined,
  MenuOutlined, PlusCircleOutlined, HolderOutlined,
} from '@ant-design/icons'
import toast from 'react-hot-toast'
import { useGlobal } from '../../context/GlobalContext'
import PageHeader from '../../components/PageHeader'

const NAVY  = '#1e1b4b'
const BRAND = '#E5550F'

const TYPE_META = {
  all:      { label: 'All Products', color: 'purple',  icon: <AppstoreOutlined /> },
  category: { label: 'Category',     color: 'blue',    icon: <MenuOutlined /> },
  product:  { label: 'Product',      color: 'green',   icon: <ShoppingOutlined /> },
  url:      { label: 'Custom URL',   color: 'default', icon: <LinkOutlined /> },
}

const emptyItem = () => ({
  label: '', type: 'category', categoryName: '',
  productId: null, productName: '', url: '', imageUrl: '',
})

// ── Draggable Item Row ─────────────────────────────────────────────────────
const ItemRow = ({
  item, index, isDragging, isOver,
  onDragStart, onDragOver, onDrop, onDragEnd,
  onEdit, onDelete, onAddChild, isChild = false,
}) => (
  <div
    onDragOver={e => onDragOver(e, index)}
    onDrop={e => onDrop(e, index)}
    style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: isChild ? '8px 10px 8px 28px' : '10px 12px',
      background: isDragging ? '#f0f1f7' : isOver ? '#fff7ed' : (isChild ? '#fafafa' : '#fff'),
      borderBottom: '1px solid #f3f4f6',
      borderLeft: isOver
        ? `3px solid ${BRAND}`
        : isChild ? '3px solid #e5e7eb' : '3px solid transparent',
      opacity: isDragging ? 0.45 : 1,
      transition: 'background 0.1s, border-color 0.1s',
      userSelect: 'none',
    }}
  >
    {/* Drag handle — only this element is draggable */}
    <div
      draggable
      onDragStart={e => onDragStart(e, index)}
      onDragEnd={onDragEnd}
      style={{ color: '#9ca3af', fontSize: 16, cursor: 'grab', display: 'flex', alignItems: 'center', flexShrink: 0, padding: '2px 4px' }}
      title="Drag to reorder"
    >
      <HolderOutlined />
    </div>

    {/* Label + meta */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: 600, fontSize: 13, color: NAVY, display: 'flex', alignItems: 'center', gap: 6 }}>
        {item.label}
        <Tag color={TYPE_META[item.type]?.color} style={{ fontSize: 10, lineHeight: '16px', padding: '0 5px' }}>
          {TYPE_META[item.type]?.label}
        </Tag>
      </div>
      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.type === 'category' && item.categoryName ? `→ ?category=${item.categoryName}` : ''}
        {item.type === 'product'  && item.productName  ? `→ /product/ ${item.productName}` : ''}
        {item.type === 'url'      && item.url          ? `→ ${item.url}` : ''}
        {item.type === 'all'                           ? '→ / (all products)' : ''}
      </div>
    </div>

    {/* Actions */}
    <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
      {!isChild && (
        <Tooltip title="Add submenu item">
          <Button
            size="small" icon={<PlusCircleOutlined />}
            onClick={() => onAddChild(index)}
            style={{ color: BRAND, borderColor: BRAND }}
          />
        </Tooltip>
      )}
      <Tooltip title="Edit">
        <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(index)} />
      </Tooltip>
      <Popconfirm
        title="Remove this item?"
        onConfirm={() => onDelete(index)}
        okText="Remove" okButtonProps={{ danger: true }}
      >
        <Button size="small" icon={<DeleteOutlined />} danger />
      </Popconfirm>
    </div>
  </div>
)

// ── Main component ─────────────────────────────────────────────────────────
const Menus = () => {
  const { API_URL, categories, products, fetchMainMenu, fetchSidebarMenu } = useGlobal()
  const [menus,         setMenus]         = useState([])
  const [loading,       setLoading]       = useState(true)
  const [selectedId,    setSelectedId]    = useState(null)
  const [editMenu,      setEditMenu]      = useState(null)
  const [saving,        setSaving]        = useState(false)
  const [seeding,       setSeeding]       = useState(false)
  const [seedingSidebar, setSeedingSidebar] = useState(false)
  const [drawerOpen,    setDrawerOpen]    = useState(false)
  const [drawerItem,    setDrawerItem]    = useState(emptyItem())
  const [drawerCtx,     setDrawerCtx]     = useState(null)
  const [newMenuOpen,   setNewMenuOpen]   = useState(false)
  const [newMenuName,   setNewMenuName]   = useState('')
  const [newMenuHandle, setNewMenuHandle] = useState('')
  const [productSearch, setProductSearch] = useState('')

  // Drag state: { level: 'top', idx } or { level: 'child', parentIdx, idx }
  const dragFrom    = useRef(null)
  const [dragOver,  setDragOver] = useState(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${API_URL}/menus`)
      const data = await res.json()
      setMenus(Array.isArray(data) ? data : [])
      if (data.length > 0 && !selectedId) selectMenu(data[0])
    } catch { toast.error('Failed to load menus') }
    finally { setLoading(false) }
  }

  const selectMenu = (menu) => {
    setSelectedId(menu._id)
    setEditMenu(JSON.parse(JSON.stringify(menu)))
  }

  // ── Drag handlers — top-level items ─────────────────────────────────────
  const onTopDragStart = (e, idx) => {
    dragFrom.current = { level: 'top', idx }
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', `top:${idx}`)
  }
  const onTopDragOver = (e, idx) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOver?.level !== 'top' || dragOver?.idx !== idx) {
      setDragOver({ level: 'top', idx })
    }
  }
  const onTopDrop = (e, toIdx) => {
    e.preventDefault()
    const from = dragFrom.current
    if (!from || from.level !== 'top' || from.idx === toIdx) { cleanup(); return }
    const updated = JSON.parse(JSON.stringify(editMenu))
    const [moved] = updated.items.splice(from.idx, 1)
    updated.items.splice(toIdx, 0, moved)
    setEditMenu(updated)
    cleanup()
  }

  // ── Drag handlers — child items within a parent ──────────────────────────
  const onChildDragStart = (e, parentIdx, childIdx) => {
    dragFrom.current = { level: 'child', parentIdx, idx: childIdx }
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', `child:${parentIdx}:${childIdx}`)
    e.stopPropagation()
  }
  const onChildDragOver = (e, parentIdx, childIdx) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    if (dragOver?.level !== 'child' || dragOver?.parentIdx !== parentIdx || dragOver?.idx !== childIdx) {
      setDragOver({ level: 'child', parentIdx, idx: childIdx })
    }
  }
  const onChildDrop = (e, parentIdx, toIdx) => {
    e.preventDefault()
    e.stopPropagation()
    const from = dragFrom.current
    if (!from || from.level !== 'child' || from.parentIdx !== parentIdx || from.idx === toIdx) { cleanup(); return }
    const updated = JSON.parse(JSON.stringify(editMenu))
    const children = updated.items[parentIdx].children
    const [moved] = children.splice(from.idx, 1)
    children.splice(toIdx, 0, moved)
    setEditMenu(updated)
    cleanup()
  }

  const cleanup = () => { dragFrom.current = null; setDragOver(null) }

  const isDraggingTop   = (idx) => dragFrom.current?.level === 'top' && dragFrom.current?.idx === idx
  const isDraggingChild = (pIdx, cIdx) => dragFrom.current?.level === 'child' && dragFrom.current?.parentIdx === pIdx && dragFrom.current?.idx === cIdx
  const isOverTop       = (idx) => dragOver?.level === 'top' && dragOver?.idx === idx
  const isOverChild     = (pIdx, cIdx) => dragOver?.level === 'child' && dragOver?.parentIdx === pIdx && dragOver?.idx === cIdx

  // ── Persistence ──────────────────────────────────────────────────────────
  const seedMain = async () => {
    setSeeding(true)
    try {
      const res  = await fetch(`${API_URL}/menus/seed-main`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) { toast.success('Main menu seeded from categories!'); await load(); fetchMainMenu() }
      else toast.error(data.message || 'Failed')
    } catch { toast.error('Network error') }
    finally { setSeeding(false) }
  }

  const seedSidebar = async () => {
    setSeedingSidebar(true)
    try {
      const res  = await fetch(`${API_URL}/menus/seed-sidebar`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) { toast.success('Sidebar menu seeded from categories!'); await load(); fetchSidebarMenu() }
      else toast.error(data.message || 'Failed')
    } catch { toast.error('Network error') }
    finally { setSeedingSidebar(false) }
  }

  const createMenu = async () => {
    if (!newMenuName.trim() || !newMenuHandle.trim()) return toast.error('Name and handle required')
    try {
      const res  = await fetch(`${API_URL}/menus`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newMenuName.trim(), handle: newMenuHandle.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Menu created')
        setNewMenuOpen(false); setNewMenuName(''); setNewMenuHandle('')
        await load()
      } else toast.error(data.message || 'Failed')
    } catch { toast.error('Network error') }
  }

  const saveMenu = async () => {
    if (!editMenu) return
    setSaving(true)
    try {
      const res  = await fetch(`${API_URL}/menus/${editMenu._id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editMenu.name, items: editMenu.items }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Menu saved')
        setMenus(prev => prev.map(m => m._id === data._id ? data : m))
        setEditMenu(JSON.parse(JSON.stringify(data)))
        if (data.handle === 'main-menu')    fetchMainMenu()
        if (data.handle === 'sidebar-menu') fetchSidebarMenu()
      } else toast.error(data.message || 'Save failed')
    } catch { toast.error('Network error') }
    finally { setSaving(false) }
  }

  const deleteMenu = async (id) => {
    try {
      const res  = await fetch(`${API_URL}/menus/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        toast.success('Menu deleted')
        const remaining = menus.filter(m => m._id !== id)
        setMenus(remaining)
        if (remaining.length > 0) selectMenu(remaining[0])
        else { setSelectedId(null); setEditMenu(null) }
      } else toast.error(data.message || 'Delete failed')
    } catch { toast.error('Network error') }
  }

  // ── Item CRUD ─────────────────────────────────────────────────────────────
  const openAddTopLevel = () => {
    setDrawerItem(emptyItem())
    setDrawerCtx({ parentIdx: -1, childIdx: -2 })
    setDrawerOpen(true)
  }
  const openAddChild = (parentIdx) => {
    setDrawerItem(emptyItem())
    setDrawerCtx({ parentIdx, childIdx: -1 })
    setDrawerOpen(true)
  }
  const openEditItem = (parentIdx, childIdx = -1) => {
    const item = childIdx >= 0
      ? editMenu.items[parentIdx].children[childIdx]
      : editMenu.items[parentIdx]
    setDrawerItem(JSON.parse(JSON.stringify(item)))
    setDrawerCtx({ parentIdx, childIdx })
    setDrawerOpen(true)
  }

  const saveDrawerItem = () => {
    if (!drawerItem.label.trim()) return toast.error('Label is required')
    const updated = JSON.parse(JSON.stringify(editMenu))
    const { parentIdx, childIdx } = drawerCtx

    if (parentIdx === -1) {
      // New top-level
      updated.items.push({ ...drawerItem, children: [], position: updated.items.length })
    } else if (childIdx === -1) {
      // New child
      if (!updated.items[parentIdx].children) updated.items[parentIdx].children = []
      updated.items[parentIdx].children.push({ ...drawerItem, position: updated.items[parentIdx].children.length })
    } else if (childIdx >= 0) {
      // Edit existing child
      updated.items[parentIdx].children[childIdx] = { ...updated.items[parentIdx].children[childIdx], ...drawerItem }
    } else {
      // Edit existing top-level (childIdx === -2 means editing top-level)
      if (parentIdx >= 0) {
        const existing = updated.items[parentIdx]
        updated.items[parentIdx] = { ...existing, ...drawerItem, children: existing.children || [] }
      }
    }

    setEditMenu(updated)
    setDrawerOpen(false)
    setDrawerItem(emptyItem())
  }

  const deleteItem = (parentIdx, childIdx = -1) => {
    const updated = JSON.parse(JSON.stringify(editMenu))
    if (childIdx >= 0) updated.items[parentIdx].children.splice(childIdx, 1)
    else updated.items.splice(parentIdx, 1)
    setEditMenu(updated)
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const filteredProducts = products.filter(p =>
    !productSearch || (p.name || '').toLowerCase().includes(productSearch.toLowerCase())
  ).slice(0, 50)

  return (
    <div>
      <PageHeader
        eyebrow="Storefront"
        title="Navigation Menus"
        subtitle="Build your storefront navigation — drag items to reorder, add submenus per item"
        actions={
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setNewMenuOpen(true)}>
            New Menu
          </Button>
        }
      />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spin size="large" /></div>
      ) : (
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

          {/* ── Left: menu list ──────────────────────────────────── */}
          <div style={{ width: 260, flexShrink: 0 }}>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: NAVY }}>All Menus</span>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>{menus.length} menu{menus.length !== 1 ? 's' : ''}</span>
              </div>

              {menus.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>No menus yet. Create one using the New Menu button.</div>
                </div>
              ) : (
                menus.map(menu => (
                  <div
                    key={menu._id}
                    onClick={() => selectMenu(menu)}
                    style={{
                      padding: '10px 16px', cursor: 'pointer', transition: 'background 0.1s',
                      background: selectedId === menu._id ? '#fff7ed' : '#fff',
                      borderLeft: selectedId === menu._id ? `3px solid ${BRAND}` : '3px solid transparent',
                      borderBottom: '1px solid #f9fafb',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: 6,
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: selectedId === menu._id ? BRAND : NAVY, display: 'flex', alignItems: 'center', gap: 5 }}>
                        {menu.name}
                        {menu.handle === 'main-menu' && (
                          <Tag color="orange" style={{ fontSize: 9, lineHeight: '14px', padding: '0 4px', marginLeft: 2 }}>Top Nav</Tag>
                        )}
                        {menu.handle === 'sidebar-menu' && (
                          <Tag color="purple" style={{ fontSize: 9, lineHeight: '14px', padding: '0 4px', marginLeft: 2 }}>Sidebar</Tag>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{menu.handle} · {menu.items?.length || 0} items</div>
                    </div>
                    {menu.handle !== 'main-menu' && menu.handle !== 'sidebar-menu' && (
                      <Popconfirm
                        title="Delete this menu?"
                        onConfirm={e => { e.stopPropagation(); deleteMenu(menu._id) }}
                        okText="Delete" okButtonProps={{ danger: true }}
                      >
                        <Button size="small" icon={<DeleteOutlined />} danger onClick={e => e.stopPropagation()} />
                      </Popconfirm>
                    )}
                  </div>
                ))
              )}
            </div>

          </div>

          {/* ── Right: menu editor ──────────────────────────────── */}
          {editMenu ? (
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Header row */}
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0', padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Menu Name</div>
                  <Input
                    value={editMenu.name}
                    onChange={e => setEditMenu(prev => ({ ...prev, name: e.target.value }))}
                    style={{ maxWidth: 280, fontWeight: 700, fontSize: 15 }}
                  />
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                    Handle: <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: 4 }}>{editMenu.handle}</code>
                    {editMenu.handle === 'main-menu'    && <Tag color="orange" style={{ marginLeft: 8, fontSize: 10 }}>Active Top Navigation</Tag>}
                    {editMenu.handle === 'sidebar-menu' && <Tag color="purple" style={{ marginLeft: 8, fontSize: 10 }}>Active Sidebar Menu</Tag>}
                  </div>
                </div>
                <Button type="primary" loading={saving} onClick={saveMenu} size="large">Save Menu</Button>
              </div>

              {/* Items list */}
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 13, color: NAVY }}>Menu Items ({editMenu.items.length})</span>
                    <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 8 }}>
                      <HolderOutlined /> Drag to reorder
                    </span>
                  </div>
                  <Button icon={<PlusOutlined />} size="small" type="primary" onClick={openAddTopLevel}>Add Item</Button>
                </div>

                {editMenu.items.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center' }}>
                    <Empty description="No items yet — click Add Item to start building your menu" />
                  </div>
                ) : (
                  <div>
                    {editMenu.items.map((item, pi) => (
                      <div key={String(item._id || pi)}>
                        {/* Top-level item */}
                        <ItemRow
                          item={item}
                          index={pi}
                          isDragging={isDraggingTop(pi)}
                          isOver={isOverTop(pi)}
                          onDragStart={onTopDragStart}
                          onDragOver={onTopDragOver}
                          onDrop={onTopDrop}
                          onDragEnd={cleanup}
                          onEdit={(i) => openEditItem(i)}
                          onDelete={(i) => deleteItem(i)}
                          onAddChild={(i) => openAddChild(i)}
                        />

                        {/* Children */}
                        {(item.children || []).map((child, ci) => (
                          <ItemRow
                            key={String(child._id || ci)}
                            item={child}
                            index={ci}
                            isDragging={isDraggingChild(pi, ci)}
                            isOver={isOverChild(pi, ci)}
                            onDragStart={(e, i) => onChildDragStart(e, pi, i)}
                            onDragOver={(e, i) => onChildDragOver(e, pi, i)}
                            onDrop={(e, i) => onChildDrop(e, pi, i)}
                            onDragEnd={cleanup}
                            onEdit={(i) => openEditItem(pi, i)}
                            onDelete={(i) => deleteItem(pi, i)}
                            onAddChild={() => {}}
                            isChild
                          />
                        ))}

                        {/* Drop zone hint when dragging a child into an empty parent */}
                        {(item.children || []).length === 0 && dragFrom.current?.level === 'child' && (
                          <div style={{ height: 4, background: '#f3f4f6', marginLeft: 28 }} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 8, fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
                Changes are local — click <strong>Save Menu</strong> to publish to the storefront.
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
              <Empty description="Select a menu to edit, or create a new one" />
            </div>
          )}
        </div>
      )}

      {/* ── New menu drawer ──────────────────────────────────────── */}
      <Drawer
        open={newMenuOpen}
        onClose={() => setNewMenuOpen(false)}
        title={<span style={{ fontWeight: 700, color: NAVY }}>New Menu</span>}
        width={400}
        extra={<Button type="primary" onClick={createMenu}>Create</Button>}
        destroyOnHidden
      >
        <Form layout="vertical">
          <Form.Item label="Menu Name" required>
            <Input
              placeholder="e.g. Main Navigation, Footer Links"
              value={newMenuName}
              onChange={e => {
                setNewMenuName(e.target.value)
                setNewMenuHandle(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
              }}
            />
          </Form.Item>
          <Form.Item label="Handle" extra="'main-menu' is the primary storefront navigation.">
            <Input
              value={newMenuHandle}
              onChange={e => setNewMenuHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              addonBefore="/"
              placeholder="main-menu"
            />
          </Form.Item>
        </Form>
      </Drawer>

      {/* ── Item editor drawer ───────────────────────────────────── */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={
          <span style={{ fontWeight: 700, color: NAVY }}>
            {drawerCtx?.childIdx === -2 ? 'Add Top-Level Item'
              : drawerCtx?.childIdx === -1 ? 'Add Submenu Item'
              : 'Edit Item'}
          </span>
        }
        width={440}
        extra={<Button type="primary" onClick={saveDrawerItem}>Save Item</Button>}
        destroyOnHidden
      >
        <Form layout="vertical">
          <Form.Item label="Label" required extra="Text shown in the navigation menu">
            <Input
              placeholder="e.g. Cameras, Shop All, Lenses"
              value={drawerItem.label}
              onChange={e => setDrawerItem(p => ({ ...p, label: e.target.value }))}
              size="large"
            />
          </Form.Item>

          <Form.Item label="Link Type">
            <Select
              value={drawerItem.type}
              onChange={v => setDrawerItem(p => ({ ...p, type: v, categoryName: '', productId: null, productName: '', url: '' }))}
              size="large"
              style={{ width: '100%' }}
              options={[
                { value: 'all',      label: '🏠  All Products — links to homepage' },
                { value: 'category', label: '🏷️  Category — links to a product category' },
                { value: 'product',  label: '📦  Product — links to a specific product' },
                { value: 'url',      label: '🔗  Custom URL — any URL you choose' },
              ]}
            />
          </Form.Item>

          {drawerItem.type === 'category' && (
            <Form.Item label="Category" required>
              <Select
                value={drawerItem.categoryName || undefined}
                onChange={v => setDrawerItem(p => ({ ...p, categoryName: v, label: p.label || v }))}
                placeholder="Select a category"
                size="large"
                style={{ width: '100%' }}
                showSearch
                options={categories.map(c => ({ value: c, label: c }))}
              />
            </Form.Item>
          )}

          {drawerItem.type === 'product' && (
            <Form.Item label="Product" required>
              <Input
                placeholder="Search products…"
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                style={{ marginBottom: 8 }}
                allowClear
              />
              <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: 8 }}>
                {filteredProducts.map(p => (
                  <div
                    key={p._id}
                    onClick={() => setDrawerItem(prev => ({ ...prev, productId: p._id, productName: p.name, label: prev.label || p.name }))}
                    style={{
                      padding: '8px 12px', cursor: 'pointer',
                      background: drawerItem.productId === p._id ? '#fff7ed' : '#fff',
                      borderBottom: '1px solid #f9fafb',
                      fontSize: 13,
                      fontWeight: drawerItem.productId === p._id ? 600 : 400,
                      color: drawerItem.productId === p._id ? BRAND : NAVY,
                    }}
                  >
                    {p.name}
                    <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 6 }}>₹{p.pricePerDay}/day</span>
                  </div>
                ))}
              </div>
            </Form.Item>
          )}

          {drawerItem.type === 'url' && (
            <Form.Item label="URL" required>
              <Input
                prefix={<LinkOutlined style={{ color: '#9ca3af' }} />}
                placeholder="https://… or /path"
                value={drawerItem.url}
                onChange={e => setDrawerItem(p => ({ ...p, url: e.target.value }))}
                size="large"
              />
            </Form.Item>
          )}

          <Divider style={{ margin: '16px 0' }} />

          <Form.Item label="Sidebar Image URL" extra="Optional — shown in the left sidebar. Leave blank to auto-use the category/product image.">
            <Input
              prefix={<LinkOutlined style={{ color: '#9ca3af' }} />}
              placeholder="https://… or /uploads/filename.jpg"
              value={drawerItem.imageUrl}
              onChange={e => setDrawerItem(p => ({ ...p, imageUrl: e.target.value }))}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}

export default Menus
