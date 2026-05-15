import { Link } from 'react-router-dom'
import { HiShoppingCart, HiTrash } from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useGlobal } from '../context/GlobalContext'

const CartPage = ({ setShowBookingModal }) => {
  const { cart, removeFromCart } = useGlobal()

  return (
    <div className="max-w-5xl mx-auto p-12 animate-in fade-in duration-500">
      <h2 className="text-[16px] font-black text-slate-900 mb-10 uppercase tracking-widest flex items-center space-x-4">
        <HiShoppingCart className="text-indigo-600 text-xl" /> <span>Rental Cart</span>
      </h2>
      {cart.length === 0 ? (
        <div className="bg-white p-16 text-center border-2 border-dashed border-indigo-100 rounded-[2rem]">
          <p className="text-[14px] font-bold text-slate-300 mb-6 uppercase tracking-widest">Your cart is empty</p>
          <Link to="/" className="bg-indigo-600 text-white px-8 py-3 font-black text-[12px] hover:bg-indigo-700 transition-all uppercase tracking-widest rounded-lg inline-block">Shop Now</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {cart.map(item => (
            <div key={item._id} className="bg-white p-6 flex items-center justify-between border-l-4 border-[#5e60ce] shadow-lg group hover:bg-slate-50 transition-all rounded-r-2xl">
              <div className="flex items-center space-x-6">
                <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover border border-slate-100 shadow-sm rounded-lg" />
                <div>
                  <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{item.name}</h3>
                  <p className="text-[#00b4d8] font-black text-[12px] uppercase tracking-widest mt-0.5">₹{item.pricePerDay} / Day</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button onClick={() => setShowBookingModal(item)} className="bg-slate-900 text-white px-6 py-2 font-black text-[10px] uppercase tracking-widest hover:bg-[#5e60ce] transition-all rounded-md">Rent Now</button>
                <button onClick={() => removeFromCart(item._id)} className="text-slate-300 hover:text-red-500 transition-colors p-1"><HiTrash className="text-xl" /></button>
              </div>
            </div>
          ))}
          <div className="pt-10 flex justify-between items-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cart.length} items in cart</p>
            <button onClick={() => toast.success('Checkout feature coming soon')} className="bg-gradient-to-r from-[#03045e] to-[#5e60ce] text-white px-10 py-4 font-black text-[14px] hover:shadow-lg transition-all shadow-md shadow-indigo-100 uppercase tracking-tighter rounded-xl">Checkout All</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CartPage
