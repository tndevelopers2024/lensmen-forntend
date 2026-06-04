import { HiOutlineShoppingCart, HiOutlineTrash, HiArrowRight, HiX, HiMinus, HiPlus } from 'react-icons/hi'
import { useGlobal } from '../context/GlobalContext'

const CartSidebar = ({ setShowBookingModal }) => {
  const { cart, removeFromCart, updateCartQty, cartOpen, setCartOpen, user, setAuthMode, setRentalQty } = useGlobal()

  const subtotal = cart.reduce((s, item) => s + (item.pricePerDay || 0) * (item.cartQty || 1), 0)

  const handleRent = (target) => {
    setCartOpen(false)
    if (user) {
      if (!Array.isArray(target)) setRentalQty(target.cartQty || 1)
      setShowBookingModal(target)
    } else {
      setAuthMode('login')
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px] transition-opacity duration-300 ${cartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setCartOpen(false)}
      />

      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full w-[400px] max-w-[92vw] bg-white z-50 flex flex-col shadow-[−20px_0_60px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out ${cartOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <HiOutlineShoppingCart className="text-[18px] text-slate-600" />
            <span className="font-bold text-[16px] text-[#1a1a2e]">Rental Cart</span>
            {cart.length > 0 && (
              <span className="bg-orange-50 text-primary text-[11px] font-bold px-2 py-0.5 rounded-lg leading-none">
                {cart.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setCartOpen(false)}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all"
          >
            <HiX className="text-[17px]" />
          </button>
        </div>

        {/* Empty state */}
        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-dashed border-slate-200">
              <HiOutlineShoppingCart className="text-3xl text-slate-300" />
            </div>
            <p className="font-semibold text-slate-600 mb-1">Your cart is empty</p>
            <p className="text-[13px] text-slate-400 mb-6">Browse equipment and add items to get started.</p>
            <button
              onClick={() => setCartOpen(false)}
              className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold text-[13px] hover:bg-primary-dark transition-all"
            >
              Browse Equipment
            </button>
          </div>
        ) : (
          <>
            {/* Item list */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {cart.map(item => (
                <div key={item._id} className="flex items-center gap-3 bg-slate-50 rounded-2xl p-3 border border-slate-100/80">
                  <img
                    src={item.imageUrl} alt={item.name}
                    className="w-[60px] h-[60px] rounded-xl object-cover flex-shrink-0 bg-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[13.5px] text-[#1a1a2e] truncate leading-tight">{item.name}</p>
                    <span className="inline-block text-[10px] font-medium bg-white text-slate-400 px-1.5 py-0.5 rounded-md mt-0.5 border border-slate-100">
                      {item.category || 'Gear'}
                    </span>
                    <p className="text-primary font-semibold text-[13px] mt-1">
                      ₹{((item.pricePerDay || 0) * (item.cartQty || 1)).toLocaleString()}
                      <span className="text-slate-400 font-normal text-[11px]"> /day</span>
                    </p>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <button
                        onClick={() => updateCartQty(item._id, -1)}
                        disabled={(item.cartQty || 1) <= 1}
                        className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:border-primary hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <HiMinus className="text-[10px]" />
                      </button>
                      <span className="text-[13px] font-bold text-[#1a1a2e] min-w-[18px] text-center">
                        {item.cartQty || 1}
                      </span>
                      <button
                        onClick={() => updateCartQty(item._id, 1)}
                        disabled={(item.cartQty || 1) >= (item.availableQuantity ?? 1)}
                        className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:border-primary hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <HiPlus className="text-[10px]" />
                      </button>
                      {(item.availableQuantity ?? 1) > 1 && (
                        <span className="text-[10px] text-slate-300">of {item.availableQuantity}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-stretch gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleRent(item)}
                      className="bg-[#1a1a2e] text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg hover:bg-primary transition-all whitespace-nowrap"
                    >
                      Rent Now
                    </button>
                    <button
                      onClick={() => removeFromCart(item._id)}
                      className="flex items-center justify-center py-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <HiOutlineTrash className="text-[14px]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer summary */}
            <div className="border-t border-slate-100 px-5 py-5 flex-shrink-0 bg-white">
              <div className="flex justify-between text-[12.5px] text-slate-400 mb-1">
                <span>{cart.reduce((s, i) => s + (i.cartQty || 1), 0)} item{cart.reduce((s, i) => s + (i.cartQty || 1), 0) !== 1 ? 's' : ''} selected</span>
                <span>Daily subtotal</span>
              </div>
              <div className="flex justify-between items-baseline mb-5">
                <span className="text-[11px] text-slate-300">Final price depends on duration</span>
                <span className="text-[22px] font-bold text-[#1a1a2e]">₹{subtotal.toLocaleString()}</span>
              </div>
              <button
                onClick={() => handleRent(cart)}
                className="w-full bg-primary text-white py-3.5 rounded-xl font-semibold text-[14px] hover:bg-primary-dark transition-all flex items-center justify-center gap-2 shadow-md shadow-orange-100"
              >
                Checkout All <HiArrowRight />
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default CartSidebar
