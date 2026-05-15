import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HiCalendar, HiX, HiUser, HiPhone, HiMail, HiLocationMarker, HiClock, HiArrowRight } from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useGlobal } from '../context/GlobalContext'

const MyOrdersPage = () => {
  const { userOrders, fetchUserOrders, fetchProducts, API_URL } = useGlobal()
  const [selectedOrder, setSelectedOrder] = useState(null)

  const cancelOrder = async (id) => {
    try {
      const res = await fetch(`${API_URL}/bookings/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Order cancelled')
        fetchUserOrders()
        fetchProducts()
      } else {
        toast.error('Failed to cancel order')
      }
    } catch (error) {
      toast.error('Error cancelling order')
    }
  }

  const [isConfirming, setIsConfirming] = useState(null)

  return (
    <div className="max-w-5xl mx-auto p-12 animate-in fade-in duration-500">
      <h2 className="text-[16px] font-black text-slate-900 mb-10 uppercase tracking-widest flex items-center space-x-4">
        <HiCalendar className="text-[#5e60ce] text-xl" /> <span>My Orders</span>
      </h2>
      
      {userOrders.length === 0 ? (
        <div className="bg-white p-16 text-center border-2 border-dashed border-indigo-100 rounded-[2rem]">
          <p className="text-[14px] font-bold text-slate-300 mb-6 uppercase tracking-widest">You have no active orders</p>
          <Link to="/" className="bg-indigo-600 text-white px-8 py-3 font-black text-[12px] hover:bg-indigo-700 transition-all uppercase tracking-widest rounded-lg inline-block">Explore Products</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {userOrders.map(order => (
            <div key={order._id} className="bg-white p-6 flex items-center justify-between border-l-4 border-[#00b4d8] shadow-lg group hover:bg-slate-50 transition-all rounded-r-2xl">
              <div className="flex items-center space-x-6">
                <img src={order.productId?.imageUrl || 'https://via.placeholder.com/200'} alt={order.productId?.name} className="w-16 h-16 object-cover border border-slate-100 shadow-sm rounded-lg" />
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{order.productId?.name || 'Unknown Product'}</h3>
                    {order.status === 'Returned' && (
                      <span className="bg-emerald-50 text-emerald-600 text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-emerald-100">Returned</span>
                    )}
                  </div>
                  <p className="text-brand-navy font-black text-[10px] uppercase tracking-widest mt-0.5 flex items-center">
                    {new Date(order.startDate).toLocaleDateString('en-GB')}
                    <HiArrowRight className="mx-2 text-brand-orange" />
                    {new Date(order.endDate).toLocaleDateString('en-GB')}
                  </p>
                  <p className="text-slate-400 text-[10px] font-bold uppercase mt-1">Total: ₹{order.totalPrice}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setSelectedOrder(order)}
                  className="bg-[#03045e] text-white px-6 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-[#5e60ce] transition-all shadow-lg shadow-indigo-100/50"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white max-w-xl w-full rounded-3xl overflow-hidden relative shadow-2xl border-t-8 border-[#00b4d8]">
            <button 
              onClick={() => setSelectedOrder(null)}
              className="absolute right-4 top-4 text-slate-300 hover:text-red-500 transition-colors p-2 text-2xl font-light"
            >
              <HiX />
            </button>

            <div className="p-8">
              <div className="mb-8 border-b border-slate-50 pb-6">
                <p className="text-[#00b4d8] font-black uppercase tracking-[0.3em] text-[8px] mb-1">Rental Confirmation</p>
                <h2 className="text-[18px] font-black text-slate-900 uppercase tracking-widest">Order Details</h2>
              </div>

              <div className="flex items-start space-x-6 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <img 
                  src={selectedOrder.productId?.imageUrl || 'https://via.placeholder.com/200'} 
                  alt="" 
                  className="w-24 h-24 object-cover rounded-xl shadow-lg"
                />
                <div className="flex-1">
                  <h4 className="text-[16px] font-black text-[#03045e] uppercase leading-tight mb-2">{selectedOrder.productId?.name}</h4>
                  <div className="space-y-1">
                    <div className="flex items-center text-[10px] text-slate-500 font-bold space-x-2">
                      <HiCalendar className="text-brand-navy" />
                      <span>{new Date(selectedOrder.startDate).toLocaleDateString('en-GB')}</span>
                      <HiClock className="text-brand-navy ml-2" />
                      <span>{new Date(selectedOrder.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center text-[10px] text-slate-500 font-bold space-x-2">
                      <HiArrowRight className="w-4 text-brand-orange flex justify-center" />
                      <span>{new Date(selectedOrder.endDate).toLocaleDateString('en-GB')}</span>
                      <HiClock className="text-brand-red ml-2" />
                      <span>{new Date(selectedOrder.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8 px-2">
                <div className="space-y-4">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center">
                      <HiUser className="mr-1" /> Customer
                    </p>
                    <p className="text-[11px] font-black text-slate-900 uppercase">{selectedOrder.userName}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center">
                      <HiMail className="mr-1" /> Contact Email
                    </p>
                    <p className="text-[11px] font-black text-slate-600 lowercase">{selectedOrder.userEmail}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center">
                      <HiPhone className="mr-1" /> Mobile
                    </p>
                    <p className="text-[11px] font-black text-slate-900">{selectedOrder.userMobile}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center">
                      <HiLocationMarker className="mr-1" /> Address
                    </p>
                    <p className="text-[11px] font-medium text-slate-500 leading-tight italic line-clamp-2">{selectedOrder.userAddress}</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#03045e] p-6 rounded-2xl flex justify-between items-center shadow-xl shadow-indigo-100/50 mb-4">
                <div>
                  <p className="text-[8px] font-black text-cyan-400 uppercase tracking-widest mb-1">Final Amount</p>
                  <p className="text-[20px] font-black text-white">₹{selectedOrder.totalPrice.toLocaleString()}</p>
                </div>
                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                  selectedOrder.status === 'Returned' 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-white/10 text-white border border-white/20'
                }`}>
                  {selectedOrder.status || 'Active'}
                </div>
              </div>

              {selectedOrder.status !== 'Returned' && (
                <button 
                  onClick={() => setIsConfirming(selectedOrder._id)}
                  className="w-full py-4 text-red-500 font-black uppercase text-[10px] tracking-[0.2em] border-2 border-red-50 border-dashed rounded-2xl hover:bg-red-50 hover:border-red-100 transition-all"
                >
                  Cancel This Rental
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stylish Confirmation Popup */}
      {isConfirming && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
          <div className="bg-white max-w-sm w-full p-8 rounded-3xl shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
              <HiX />
            </div>
            <h3 className="text-[18px] font-black text-slate-900 uppercase tracking-tight mb-2">Cancel Order?</h3>
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest mb-8 leading-relaxed">
              Are you sure you want to cancel this rental? This action cannot be undone.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setIsConfirming(null)}
                className="py-3 bg-slate-50 text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all"
              >
                No, Keep it
              </button>
              <button 
                onClick={() => {
                  cancelOrder(isConfirming)
                  setIsConfirming(null)
                  setSelectedOrder(null)
                }}
                className="py-3 bg-red-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 shadow-lg shadow-red-100 transition-all"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyOrdersPage

