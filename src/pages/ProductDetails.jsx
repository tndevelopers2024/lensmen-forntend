import { useParams, useNavigate } from 'react-router-dom'
import { HiShoppingCart, HiArrowLeft, HiCheckCircle, HiClock, HiShieldCheck, HiOutlineInformationCircle } from 'react-icons/hi'
import { useGlobal } from '../context/GlobalContext'

const ProductDetails = ({ setShowBookingModal }) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { products, user, addToCart } = useGlobal()
  
  const product = products.find(p => p._id === id)

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
          <HiOutlineInformationCircle className="text-4xl text-slate-200" />
        </div>
        <h2 className="text-2xl font-black text-brand-navy uppercase tracking-widest">Gear Not Found</h2>
        <button onClick={() => navigate('/')} className="text-primary font-black uppercase tracking-widest text-xs hover:underline">Return to Inventory</button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Breadcrumb Navigation */}
      <button 
        onClick={() => navigate('/')} 
        className="group mb-12 flex items-center space-x-3 text-slate-400 hover:text-primary transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all shadow-sm">
          <HiArrowLeft className="text-sm group-hover:text-white" />
        </div>
        <span className="font-black uppercase tracking-[0.2em] text-[12px]">Back to Catalog</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Image Showcase */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-2 rounded-[1.5rem] shadow-xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden group">
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full max-h-[400px] object-cover rounded-[1rem] transition-transform duration-700 group-hover:scale-105" 
            />
            
            {/* Availability Badge */}
            <div className="absolute top-4 left-4">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full backdrop-blur-md shadow-lg border ${product.isAvailable ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-red-500/10 border-red-500/20 text-red-600'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${product.isAvailable ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="font-black uppercase tracking-widest text-[12px]">{product.isAvailable ? 'Available Now' : 'Currently Rented'}</span>
              </div>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-center">
              <HiShieldCheck className="text-lg text-primary mx-auto mb-2" />
              <p className="font-black text-[12px] uppercase tracking-widest text-slate-400">Insured</p>
            </div>
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-center">
              <HiClock className="text-lg text-[#00b4d8] mx-auto mb-2" />
              <p className="font-black text-[12px] uppercase tracking-widest text-slate-400">24/7 Support</p>
            </div>
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-center">
              <HiCheckCircle className="text-lg text-green-500 mx-auto mb-2" />
              <p className="font-black text-[12px] uppercase tracking-widest text-slate-400">Verified</p>
            </div>
          </div>
        </div>

        {/* Right Column: Information & Actions */}
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-4">
            <div className="inline-block px-3 py-1 bg-orange-50 border border-primary/20 rounded-md">
              <p className="text-primary font-black uppercase tracking-[0.2em] text-[12px]">Premium Equipment</p>
            </div>
            <h1 className="text-[16px] font-black text-brand-navy leading-tight uppercase tracking-tight">{product.name}</h1>
            
            <div className="flex items-center space-x-4 pt-4 border-t border-slate-100">
              <div className="text-[#00b4d8] font-black">
                <span className="text-sm">₹</span>
                <span className="text-3xl tracking-tighter">{product.pricePerDay}</span>
              </div>
              <div className="h-8 w-px bg-slate-100"></div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[12px]">Rental<br/>Rate / Day</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none">
            <p className="text-[12px] text-slate-500 leading-relaxed font-medium bg-slate-50/50 p-6 rounded-2xl border border-slate-100 italic relative">
              {product.description}
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex gap-3">
              {(!user || user.role !== 'admin') && (
                <button 
                  onClick={() => addToCart(product)} 
                  className="flex-1 bg-white border border-slate-100 text-brand-navy p-3 rounded-xl font-black text-[12px] uppercase tracking-[0.1em] hover:bg-slate-50 hover:border-primary transition-all flex items-center justify-center space-x-2 shadow-sm"
                >
                  <HiShoppingCart className="text-sm" /> 
                  <span>Add to Cart</span>
                </button>
              )}
              <button 
                onClick={() => setShowBookingModal(product)} 
                className="flex-[2] bg-primary text-white p-3 rounded-xl font-black text-[12px] uppercase tracking-[0.1em] hover:shadow-lg transition-all"
              >
                Book Now
              </button>
            </div>
          </div>

          <div className="pt-6 space-y-3">
            <h3 className="font-black text-brand-navy uppercase tracking-widest text-[14px]">Technical Specifications</h3>
            <div className="space-y-2">
              {[
                { label: 'Condition', value: 'Excellent / Pro-Grade' },
                { label: 'Category', value: product.category || 'Professional Gear' },
                { label: 'Availability', value: product.isAvailable ? 'In Stock' : 'On Loan' },
              ].map((spec, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-slate-400 text-[12px] uppercase font-bold tracking-widest">{spec.label}</span>
                  <span className="text-brand-navy text-[12px] uppercase font-black tracking-tight">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetails
