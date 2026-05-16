import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HiTrash, HiPencil, HiX } from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useGlobal } from '../../context/GlobalContext'
import TablePagination from '../../components/TablePagination'

const AdminInventory = () => {
  const { adminProductList, fetchAdminData, API_URL, categories } = useGlobal()
  const [isConfirming, setIsConfirming] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const [editingProduct, setEditingProduct] = useState(null)

  const paginatedProducts = adminProductList.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  const filteredCategories = categories.filter(cat => 
    cat.toLowerCase().includes((editingProduct?.category || '').toLowerCase())
  )

  const deleteProduct = async (id) => {
    try {
      const res = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Product deleted')
        fetchAdminData('/admin/all-products')
      }
    } catch (error) {
      toast.error('Failed to delete product')
    }
  }



  const handleUpdate = async (e) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append('name', editingProduct.name)
    formData.append('description', editingProduct.description || '')
    formData.append('pricePerDay', editingProduct.pricePerDay)
    formData.append('isAvailable', editingProduct.isAvailable)
    formData.append('category', editingProduct.category || '')
    if (editingProduct.newImage) {
      formData.append('image', editingProduct.newImage)
    }

    try {
      const res = await fetch(`${API_URL}/products/${editingProduct._id}`, {
        method: 'PUT',
        body: formData
      })
      if (res.ok) {
        toast.success('Product updated')
        setEditingProduct(null)
        fetchAdminData('/admin/all-products')
      }
    } catch (error) {
      toast.error('Update failed')
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <p className="text-brand-orange font-black uppercase tracking-[0.3em] text-[12px] mb-1">Stock Control</p>
          <h2 className="text-[16px] font-black text-brand-navy uppercase tracking-widest">Inventory</h2>
        </div>
        <Link to="/admin/products" className="bg-primary text-white px-6 py-3 rounded-lg font-black text-[12px] uppercase tracking-widest hover:scale-105 transition-all shadow-md shadow-orange-100">Add New Product</Link>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-slate-50 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f8fafc] text-brand-navy uppercase text-[12px] tracking-[0.2em] font-black border-b border-slate-100">
              <th className="p-4">Product Details</th>
              <th className="p-4">Category</th>
              <th className="p-4">Daily Rate</th>
              <th className="p-4">Inventory Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedProducts.map(item => (
              <tr key={item._id} className="hover:bg-[#f8fafc]/50 transition-colors group">
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden shadow-sm border border-white group-hover:border-brand-orange transition-colors">
                      <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} />
                    </div>
                    <div>
                      <p className="font-black text-brand-navy uppercase text-[12px] mb-0.5 tracking-tight">{item.name}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-[11px] font-black bg-slate-50 text-brand-navy px-3 py-1.5 rounded-lg uppercase tracking-widest border border-slate-100">
                    {item.category || 'Gear'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-baseline space-x-0.5">
                    <span className="text-brand-orange font-black text-[12px]">₹</span>
                    <span className="text-brand-navy font-black text-[13px]">{item.pricePerDay}</span>
                    <span className="text-slate-400 font-bold text-[10px] ml-1 uppercase tracking-tighter">/ day</span>
                  </div>
                </td>
                <td className="p-4">
                  {item.isAvailable ? (
                    <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest border border-emerald-100">In Stock</span>
                  ) : (
                    <span className="bg-slate-50 text-slate-400 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest border border-slate-100">Out of Stock</span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-center space-x-2">
                    <button 
                      onClick={() => setEditingProduct(item)}
                      className="p-2 text-slate-400 hover:text-brand-navy hover:bg-slate-50 rounded-lg transition-all"
                    >
                      <HiPencil />
                    </button>
                    <button 
                      onClick={() => setIsConfirming(item._id)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <HiTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <TablePagination 
          totalItems={adminProductList.length}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setEditingProduct(null)} className="absolute right-4 top-4 text-slate-300 hover:text-slate-600">
              <HiX className="text-2xl" />
            </button>
            <div className="mb-6">
              <p className="text-brand-orange font-black uppercase tracking-[0.3em] text-[12px] mb-1">Gear Management</p>
              <h2 className="text-[16px] font-black text-brand-navy uppercase tracking-widest">Edit Product</h2>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-3">
                <p className="text-[12px] font-black text-brand-orange uppercase tracking-widest ml-1">Update Visual Asset</p>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-100 shadow-sm">
                    <img src={editingProduct.newImage ? URL.createObjectURL(editingProduct.newImage) : editingProduct.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                  </div>
                  <label className="flex-1 cursor-pointer">
                    <div className="border border-dashed border-slate-200 p-3 rounded-lg flex flex-col items-center justify-center hover:bg-slate-50 transition-all">
                      <span className="text-[12px] font-black text-brand-navy uppercase">Change Image</span>
                      <input type="file" className="hidden" accept="image/*" onChange={e => setEditingProduct({...editingProduct, newImage: e.target.files[0]})} />
                    </div>
                  </label>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">Gear Name</label>
                  <input 
                    type="text" 
                    value={editingProduct.name} 
                    onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                    className="w-full border-b border-slate-100 p-2 font-black uppercase text-[12px] focus:border-brand-orange outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">Daily Rate (₹)</label>
                  <input 
                    type="number" 
                    value={editingProduct.pricePerDay} 
                    onChange={e => setEditingProduct({...editingProduct, pricePerDay: e.target.value})}
                    className="w-full border-b border-slate-100 p-2 font-black text-[12px] focus:border-brand-orange outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                <textarea 
                  value={editingProduct.description || ''} 
                  onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                  className="w-full border border-slate-100 p-3 rounded-xl font-medium text-[12px] focus:border-brand-orange outline-none min-h-[100px] resize-none bg-slate-50/50"
                  placeholder="Enter gear specifications and details..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">Availability</label>
                <select 
                  value={editingProduct.isAvailable} 
                  onChange={e => setEditingProduct({...editingProduct, isAvailable: e.target.value === 'true'})}
                  className="w-full border-b border-slate-100 p-2 font-black uppercase text-[12px] focus:border-brand-orange outline-none bg-white"
                >
                  <option value="true">In Stock</option>
                  <option value="false">Rented Out</option>
                </select>
              </div>

              <div className="space-y-1 relative">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">Category (Search or Type)</label>
                <input 
                  type="text" 
                  value={editingProduct.category || ''} 
                  onChange={e => {
                    setEditingProduct({...editingProduct, category: e.target.value})
                    setShowDropdown(true)
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  className="w-full border-b border-slate-100 p-2 font-black uppercase text-[12px] focus:border-brand-orange outline-none"
                  placeholder="e.g. CAMERA, LENS"
                />
                {showDropdown && filteredCategories.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-100 rounded-xl shadow-xl z-50 max-h-40 overflow-y-auto">
                    {filteredCategories.map((cat, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setEditingProduct({ ...editingProduct, category: cat })
                          setShowDropdown(false)
                        }}
                        className="w-full text-left p-3 hover:bg-slate-50 text-[11px] font-black text-brand-navy uppercase border-b border-slate-50 last:border-0 transition-colors"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button type="submit" className="w-full bg-brand-navy text-white p-4 rounded-xl font-black text-[12px] uppercase tracking-widest shadow-lg shadow-orange-100 mt-4 transition-all hover:bg-primary">Save Changes</button>
            </form>
          </div>
        </div>
      )}
 

      {/* Stylish Confirmation Popup */}
      {isConfirming && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
          <div className="bg-white max-w-sm w-full p-8 rounded-3xl shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
              <HiTrash />
            </div>
            <h3 className="text-[18px] font-black text-slate-900 uppercase tracking-tight mb-2">Delete Product?</h3>
            <p className="text-[12px] text-slate-400 font-medium uppercase tracking-widest mb-8 leading-relaxed">
              Are you sure you want to remove this item from the inventory? This action cannot be undone.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setIsConfirming(null)}
                className="py-3 bg-slate-50 text-slate-400 rounded-xl font-black text-[12px] uppercase tracking-widest hover:bg-slate-100 transition-all"
              >
                No, Keep it
              </button>
              <button 
                onClick={() => {
                  deleteProduct(isConfirming)
                  setIsConfirming(null)
                }}
                className="py-3 bg-red-500 text-white rounded-xl font-black text-[12px] uppercase tracking-widest hover:bg-red-600 shadow-lg shadow-red-100 transition-all"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminInventory
