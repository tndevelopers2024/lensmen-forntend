import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiUpload } from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useGlobal } from '../../context/GlobalContext'

const AddGear = () => {
  const { fetchProducts, API_URL, products } = useGlobal()
  const navigate = useNavigate()
  const [newProduct, setNewProduct] = useState({ name: '', description: '', pricePerDay: '', category: '' })
  const [productFile, setProductFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const existingCategories = [...new Set(products.map(p => p.category).filter(Boolean))]
  const filteredCategories = existingCategories.filter(cat => 
    cat.toLowerCase().includes(newProduct.category.toLowerCase())
  )

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProductFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      toast.success('Image selected');
    }
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()
    const formData = new FormData();
    formData.append('name', newProduct.name);
    formData.append('description', newProduct.description);
    formData.append('pricePerDay', newProduct.pricePerDay);
    formData.append('category', newProduct.category);
    if (productFile) formData.append('image', productFile);

    try {
      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        toast.success('Product added successfully')
        fetchProducts()
        navigate('/admin/all-products')
      } else {
        toast.error('Failed to add product')
      }
    } catch (error) {
      toast.error('Error adding product')
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <p className="text-primary font-black uppercase tracking-[0.3em] text-[12px] mb-1">Inventory Expansion</p>
        <h2 className="text-[16px] font-black text-brand-navy uppercase tracking-widest">Add Gear</h2>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-50">
        <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[12px] font-black text-primary uppercase tracking-widest ml-1">Product Name</label>
            <input 
              type="text" 
              placeholder="e.g. ARRI Alexa Mini" 
              required 
              value={newProduct.name} 
              onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} 
              className="w-full border-b border-slate-100 p-2 font-black uppercase text-[12px] focus:border-primary outline-none transition-all placeholder:text-slate-200" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-black text-primary uppercase tracking-widest ml-1">Daily Rate (INR)</label>
            <input 
              type="number" 
              placeholder="0.00" 
              required 
              value={newProduct.pricePerDay} 
              onChange={e => setNewProduct({ ...newProduct, pricePerDay: e.target.value })} 
              className="w-full border-b border-slate-100 p-2 font-black uppercase text-[12px] focus:border-primary outline-none transition-all placeholder:text-slate-200" 
            />
          </div>

          <div className="space-y-1 relative">
            <label className="text-[12px] font-black text-primary uppercase tracking-widest ml-1">Category (Search or Type)</label>
            <input 
              type="text" 
              placeholder="e.g. CAMERA, LENS, LIGHTING" 
              required 
              value={newProduct.category} 
              onChange={e => {
                setNewProduct({ ...newProduct, category: e.target.value })
                setShowDropdown(true)
              }} 
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              className="w-full border-b border-slate-100 p-2 font-black uppercase text-[12px] focus:border-primary outline-none transition-all placeholder:text-slate-200" 
            />
            {showDropdown && filteredCategories.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-100 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                {filteredCategories.map((cat, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setNewProduct({ ...newProduct, category: cat })
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

          <div className="md:col-span-2 space-y-3">
            <p className="text-[12px] font-black text-primary uppercase tracking-widest ml-1">Upload Image</p>
            <div className="flex items-center space-x-6">
              <label className="flex-1 cursor-pointer group">
                <div className="border border-dashed border-slate-200 p-8 rounded-xl flex flex-col items-center justify-center space-y-2 hover:border-primary hover:bg-slate-50 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <HiUpload className="text-xl text-slate-300 group-hover:text-primary" />
                  </div>
                  <span className="font-black text-[12px] uppercase tracking-[0.2em] text-slate-400 group-hover:text-brand-navy">Select Image File</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </div>
              </label>
              {previewUrl && (
                <div className="w-32 h-32 rounded-xl border border-slate-100 shadow-md overflow-hidden relative group">
                  <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="text-[12px] font-black text-primary uppercase tracking-widest ml-1">Description</label>
            <textarea 
              placeholder="Describe the gear's features and condition..." 
              required 
              value={newProduct.description} 
              onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} 
              className="w-full border border-slate-100 p-4 rounded-xl font-medium text-[12px] focus:border-primary outline-none h-24 transition-all resize-none" 
            />
          </div>

          <button type="submit" className="md:col-span-2 bg-primary text-white p-4 rounded-xl font-black text-[14px] uppercase tracking-[0.1em] hover:shadow-lg transition-all">Add to Products</button>
        </form>
      </div>
    </div>
    
  )
}

export default AddGear
