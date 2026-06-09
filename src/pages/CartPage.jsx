import { Link } from 'react-router-dom'
import { HiOutlineShoppingCart, HiOutlineTrash, HiArrowRight } from 'react-icons/hi'
import { useGlobal, getImageUrl } from '../context/GlobalContext'

const INK   = '#1a1a2e'

const CartPage = ({ setShowBookingModal }) => {
  const { cart, removeFromCart, user, setAuthMode } = useGlobal()

  const subtotal = cart.reduce((s, item) => s + (item.pricePerDay || 0), 0)

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 animate-in fade-in duration-400">
      {/* Header */}
      <div className="mb-8">
        <span className="text-xs font-semibold text-primary tracking-[0.16em] uppercase">Your Selection</span>
        <h1 className="text-2xl font-bold text-[#1a1a2e] mt-1 flex items-center gap-3">
          Rental Cart
          {cart.length > 0 && (
            <span className="text-sm font-semibold bg-orange-50 text-primary px-2.5 py-0.5 rounded-lg">{cart.length}</span>
          )}
        </h1>
      </div>

      {cart.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl py-20 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <HiOutlineShoppingCart className="text-3xl text-slate-300" />
          </div>
          <p className="text-base font-semibold text-slate-500 mb-1">Your cart is empty</p>
          <p className="text-sm text-slate-400 mb-6">Add some equipment to get started</p>
          <Link to="/" className="inline-flex items-center gap-2 bg-primary text-white px-7 py-3 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-all">
            Browse Equipment <HiArrowRight />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-3">
            {cart.map(item => (
              <div key={item._id} className="group bg-white p-4 flex items-center gap-4 border border-slate-100 rounded-2xl hover:shadow-md hover:shadow-slate-200/50 transition-all">
                <img src={getImageUrl(item.imageUrl)} alt={item.name} className="w-20 h-20 object-cover rounded-xl bg-slate-100 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-semibold text-[#1a1a2e] truncate">{item.name}</h3>
                  <span className="inline-block text-[11px] font-medium bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md mt-1">
                    {item.category || 'Gear'}
                  </span>
                  <p className="text-primary font-semibold text-sm mt-1.5">₹{item.pricePerDay} <span className="text-slate-400 font-normal text-xs">/ day</span></p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => user ? setShowBookingModal(item) : setAuthMode('login')}
                    className="bg-[#1a1a2e] text-white px-5 py-2.5 rounded-xl font-medium text-[13px] hover:bg-primary transition-all"
                  >
                    Rent Now
                  </button>
                  <button
                    onClick={() => removeFromCart(item._id)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                    title="Remove"
                  >
                    <HiOutlineTrash className="text-lg" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="lg:sticky lg:top-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-6">
              <h3 className="text-base font-bold text-[#1a1a2e] mb-5">Order Summary</h3>
              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Items</span>
                  <span className="text-[#1a1a2e] font-medium">{cart.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Daily subtotal</span>
                  <span className="text-[#1a1a2e] font-medium">₹{subtotal.toLocaleString()}</span>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4 mb-5">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-[#1a1a2e]">Total / day</span>
                  <span className="text-xl font-bold text-[#1a1a2e]">₹{subtotal.toLocaleString()}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Final price depends on rental duration</p>
              </div>
              <button
                onClick={() => user ? setShowBookingModal(cart) : setAuthMode('login')}
                className="w-full bg-primary text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-all shadow-md shadow-orange-100 flex items-center justify-center gap-2"
              >
                Checkout All <HiArrowRight />
              </button>
              <Link to="/" className="block text-center text-sm text-slate-400 hover:text-primary font-medium mt-4 transition-colors">
                Continue browsing
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CartPage
