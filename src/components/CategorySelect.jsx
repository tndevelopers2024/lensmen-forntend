import { useState, useEffect, useRef } from 'react'
import { Select, Input, Button, Divider, Space } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import toast from 'react-hot-toast'
import { useGlobal } from '../context/GlobalContext'

const CategorySelect = ({ value, onChange, size = 'middle', placeholder = 'Select category', ...rest }) => {
  const { API_URL } = useGlobal()
  const [categories, setCategories] = useState([])
  const [newName,    setNewName]    = useState('')
  const [adding,     setAdding]     = useState(false)
  const inputRef = useRef(null)

  const load = async () => {
    try {
      const res  = await fetch(`${API_URL}/categories`)
      const data = await res.json()
      if (Array.isArray(data)) setCategories(data)
    } catch { /* silent */ }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name) return
    setAdding(true)
    try {
      const res  = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Category "${data.name}" created`)
        setCategories(prev => [...prev, data])
        setNewName('')
        onChange?.(data.name)
      } else {
        toast.error(data.message || 'Failed to create category')
      }
    } catch { toast.error('Network error') }
    finally { setAdding(false) }
  }

  const dropdownRender = (menu) => (
    <>
      {menu}
      <Divider style={{ margin: '6px 0' }} />
      <Space style={{ padding: '4px 10px 8px' }}>
        <Input
          ref={inputRef}
          size="small"
          placeholder="New category name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreate() } }}
          style={{ width: 160 }}
        />
        <Button
          type="text"
          size="small"
          icon={<PlusOutlined />}
          loading={adding}
          onClick={handleCreate}
          style={{ color: '#E5550F', fontWeight: 600, padding: '0 6px' }}
        >
          Add
        </Button>
      </Space>
    </>
  )

  return (
    <Select
      showSearch
      value={value}
      onChange={onChange}
      size={size}
      placeholder={placeholder}
      dropdownRender={dropdownRender}
      filterOption={(input, opt) =>
        opt.label.toLowerCase().includes(input.toLowerCase())
      }
      options={categories.map(c => ({ value: c.name, label: c.name }))}
      {...rest}
    />
  )
}

export default CategorySelect
