import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { HiCalendar, HiX, HiUser, HiPhone, HiMail, HiLocationMarker, HiClock, HiArrowRight, HiCheckCircle, HiExclamationCircle } from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useGlobal } from '../context/GlobalContext'
import TablePagination from '../components/TablePagination'

const renderStatusBadge = (status) => {
  let classes = ""
  switch (status) {
    case 'Request Submitted':
      classes = "bg-slate-50 text-slate-500 border-slate-100"; break;
    case 'KYC Pending':
      classes = "bg-amber-50 text-amber-600 border-amber-100 animate-pulse-subtle"; break;
    case 'KYC Approved':
      classes = "bg-cyan-50 text-cyan-600 border-cyan-100"; break;
    case 'Approved':
      classes = "bg-emerald-50 text-emerald-600 border-emerald-100"; break;
    case 'Ready for Pickup':
      classes = "bg-indigo-50 text-indigo-600 border-indigo-100"; break;
    case 'Picked Up':
    case 'During Rental':
    case 'Active':
      classes = "bg-blue-50 text-blue-600 border-blue-100"; break;
    case 'Return Pending':
      classes = "bg-orange-50 text-orange-600 border-orange-100 animate-pulse-subtle"; break;
    case 'Returned':
    case 'Closed':
      classes = "bg-green-50 text-green-600 border-green-100"; break;
    case 'Rejected':
      classes = "bg-rose-50 text-rose-600 border-rose-100"; break;
    default:
      classes = "bg-slate-50 text-slate-500 border-slate-100";
  }
  return (
    <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl uppercase tracking-widest border ${classes}`}>
      {status}
    </span>
  )
}

const renderStatusStepper = (currentStatus) => {
  if (currentStatus === 'Rejected') {
    return (
      <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl flex items-center space-x-4 shadow-sm">
        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 text-2xl shrink-0">
          <HiExclamationCircle />
        </div>
        <div>
          <h4 className="text-[13px] font-black text-rose-800 uppercase tracking-wider">Rental Request Rejected</h4>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1">Please check email/rejection reason or submit a new request.</p>
        </div>
      </div>
    )
  }

  const milestones = [
    { label: 'Submitted', key: 'Submitted' },
    { label: 'KYC Verified', key: 'KYC' },
    { label: 'Approved', key: 'Approved' },
    { label: 'Ready', key: 'Ready' },
    { label: 'Active', key: 'Active' },
    { label: 'Closed', key: 'Closed' }
  ]

  let activeIndex = -1
  if (['Request Submitted', 'KYC Pending'].includes(currentStatus)) activeIndex = 0
  else if (currentStatus === 'KYC Approved') activeIndex = 1
  else if (currentStatus === 'Approved') activeIndex = 2
  else if (currentStatus === 'Ready for Pickup') activeIndex = 3
  else if (['Picked Up', 'During Rental', 'Return Pending', 'Active'].includes(currentStatus)) activeIndex = 4
  else if (['Returned', 'Closed'].includes(currentStatus)) activeIndex = 5

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative w-full px-2">
        <div className="absolute left-0 top-[22px] right-0 h-1 bg-slate-100 -z-10 rounded"></div>
        <div 
          className="absolute left-0 top-[22px] h-1 bg-primary -z-10 rounded transition-all duration-500" 
          style={{ width: `${(Math.max(0, activeIndex) / (milestones.length - 1)) * 100}%` }}
        ></div>

        {milestones.map((m, idx) => {
          const isCompleted = idx < activeIndex
          const isActive = idx === activeIndex
          let circleClass = ""
          let labelClass = ""

          if (isCompleted) {
            circleClass = "bg-primary text-white scale-105 shadow-md shadow-orange-100"
            labelClass = "text-primary font-black"
          } else if (isActive) {
            circleClass = "bg-brand-navy text-white ring-4 ring-orange-100 scale-110 shadow-lg shadow-orange-100"
            labelClass = "text-brand-navy font-black scale-105"
          } else {
            circleClass = "bg-white border-2 border-slate-200 text-slate-300"
            labelClass = "text-slate-400 font-bold"
          }

          return (
            <div key={m.label} className="flex flex-col items-center flex-1 relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black transition-all ${circleClass}`}>
                {isCompleted ? <HiCheckCircle className="text-lg" /> : <span>{idx + 1}</span>}
              </div>
              <span className={`text-[9px] uppercase tracking-widest mt-2 block text-center whitespace-nowrap ${labelClass}`}>
                {m.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}


const MyOrdersPage = () => {
  const { userOrders, fetchUserOrders, fetchProducts, API_URL } = useGlobal()
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const location = useLocation()

  const paginatedOrders = userOrders.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  useEffect(() => {
    if (location.state?.autoOpenOrderId && userOrders.length > 0) {
      const order = userOrders.find(o => o._id === location.state.autoOpenOrderId)
      if (order) {
        setSelectedOrder(order)
        // Clear state to prevent re-opening on refresh
        window.history.replaceState({}, document.title)
      }
    }
  }, [location.state, userOrders])

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
        <HiCalendar className="text-primary text-xl" /> <span>My Orders</span>
      </h2>
      
      {userOrders.length === 0 ? (
        <div className="bg-white p-16 text-center border-2 border-dashed border-primary/20 rounded-[2rem]">
          <p className="text-[14px] font-bold text-slate-300 mb-6 uppercase tracking-widest">You have no active orders</p>
          <Link to="/" className="bg-primary text-white px-8 py-3 font-black text-[12px] hover:bg-primary-dark transition-all uppercase tracking-widest rounded-lg inline-block">Explore Products</Link>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-50 overflow-hidden">
          <div className="p-8 space-y-4">
            {paginatedOrders.map(order => (
              <div key={order._id} className="bg-white p-6 flex items-center justify-between border-l-4 border-primary shadow-lg group hover:bg-slate-50 transition-all rounded-r-2xl border border-slate-100">
                <div className="flex items-center space-x-8">
                  <div className="w-32 flex items-center -space-x-6 flex-shrink-0">
                    {(order.items && order.items.length > 0 ? order.items : [order.productId]).slice(0, 3).map((item, idx) => (
                      <div key={idx} className="relative">
                        <img 
                          src={item?.productId?.imageUrl || item?.imageUrl || 'https://via.placeholder.com/200'} 
                          alt="" 
                          className="w-16 h-16 object-cover border-2 border-white shadow-lg rounded-xl bg-white group-hover:scale-105 transition-transform" 
                        />
                      </div>
                    ))}
                    {(order.items?.length > 3) && (
                      <div className="w-16 h-16 bg-slate-50 rounded-xl border-2 border-white flex items-center justify-center text-[12px] font-black text-slate-400 shadow-sm relative z-10">
                        +{order.items.length - 3}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-[250px]">
                     <div className="flex items-center space-x-3">
                      <h3 className="text-[15px] font-black text-slate-900 uppercase tracking-tight group-hover:text-primary transition-colors">
                        {order.items && order.items.length > 0 
                          ? `${order.items.length} ${order.items.length === 1 ? 'Item' : 'Items'} Order` 
                          : (order.productId?.name || 'Unknown Product')}
                      </h3>
                      {renderStatusBadge(order.status)}
                    </div>
                    
                    <div className="mt-1 flex items-center space-x-2">
                      <p className="text-brand-navy font-black text-[12px] uppercase tracking-widest flex items-center">
                        {new Date(order.startDate).toLocaleDateString('en-GB')}
                        <HiArrowRight className="mx-2 text-brand-orange text-[10px]" />
                        {new Date(order.endDate).toLocaleDateString('en-GB')}
                      </p>
                    </div>
                    
                    <div className="mt-1.5 flex items-center space-x-2">
                      <span className="text-[11px] text-slate-400 font-black uppercase tracking-widest">Total:</span>
                      <span className="text-[13px] text-brand-navy font-black">₹{order.totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center ml-6">
                  <button 
                    onClick={() => setSelectedOrder(order)}
                    className="bg-brand-navy text-white px-8 py-3 rounded-xl font-black text-[12px] uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-orange-100/50"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
          <TablePagination 
            totalItems={userOrders.length}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-start justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white max-w-6xl w-full rounded-3xl relative shadow-2xl border-t-8 border-primary my-8 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setSelectedOrder(null)}
              className="absolute right-4 top-4 text-slate-300 hover:text-red-500 transition-colors p-2 text-2xl font-light"
            >
              <HiX />
            </button>

            <div className="p-8">
              <div className="mb-8 border-b border-slate-50 pb-6 flex justify-between items-end">
                <div>
                  <p className="text-primary font-black uppercase tracking-[0.3em] text-[12px] mb-1">Rental Requests</p>
                  <h2 className="text-[18px] font-black text-slate-900 uppercase tracking-widest">Order Details</h2>
                </div>
                <div className="text-right">
                  {renderStatusBadge(selectedOrder.status)}
                </div>
              </div>

              {selectedOrder.status === 'Rejected' && selectedOrder.rejectionReason && (
                <div className="mb-6 bg-rose-50 border border-rose-200 p-4 rounded-2xl">
                  <p className="text-[11px] font-black text-rose-800 uppercase tracking-wider">Reason for Rejection:</p>
                  <p className="text-[12px] font-bold text-rose-700 mt-1 uppercase italic">"{selectedOrder.rejectionReason}"</p>
                </div>
              )}

              <div className="mb-8 bg-slate-50 p-6 rounded-[2rem] border border-slate-100/50">
                {renderStatusStepper(selectedOrder.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {/* Column 1: Products */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3">Gear Details</p>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-100">
                      {(selectedOrder.items && selectedOrder.items.length > 0 ? selectedOrder.items : [selectedOrder.productId]).map((item, idx) => (
                        <div key={idx} className="flex items-center space-x-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <img 
                            src={item?.productId?.imageUrl || item?.imageUrl || 'https://via.placeholder.com/200'} 
                            alt="" 
                            className="w-16 h-16 object-cover rounded-xl shadow-lg"
                          />
                          <div className="flex-1">
                            <h4 className="text-[13px] font-black text-brand-navy uppercase leading-tight">{item?.name || 'Unknown Product'}</h4>
                            <p className="text-[11px] text-brand-orange font-black uppercase mt-1">₹{item?.pricePerDay} / Day</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Column 2: Logistics (Dates & Pickup) */}
                <div className="space-y-8">
                  <div>
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3">Rental Window</p>
                    <div className="bg-slate-50/50 p-5 rounded-3xl border border-slate-100">
                      <div className="flex flex-col space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <HiCalendar className="text-brand-navy text-lg" />
                            <div>
                              <p className="text-[10px] text-slate-400 font-black uppercase">Start Date</p>
                              <p className="text-[12px] font-black text-slate-900">{new Date(selectedOrder.startDate).toLocaleDateString('en-GB')}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 text-right">
                            <HiClock className="text-brand-navy text-lg" />
                            <div>
                              <p className="text-[10px] text-slate-400 font-black uppercase">Start Time</p>
                              <p className="text-[12px] font-black text-slate-900">{new Date(selectedOrder.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                        </div>
                        <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <HiCalendar className="text-brand-orange text-lg" />
                            <div>
                              <p className="text-[10px] text-slate-400 font-black uppercase">End Date</p>
                              <p className="text-[12px] font-black text-slate-900">{new Date(selectedOrder.endDate).toLocaleDateString('en-GB')}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 text-right">
                            <HiClock className="text-brand-orange text-lg" />
                            <div>
                              <p className="text-[10px] text-slate-400 font-black uppercase">End Time</p>
                              <p className="text-[12px] font-black text-slate-900">{new Date(selectedOrder.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 flex items-center">
                      <HiLocationMarker className="mr-2 text-primary" /> Pickup Location
                    </p>
                    <div className="bg-orange-50/50 p-6 rounded-3xl border-2 border-primary/20 shadow-lg shadow-orange-100/10 animate-pulse-subtle relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                      <p className="text-[12px] font-black text-brand-navy uppercase flex items-center">
                        Lensmen Rentals HQ
                        <span className="ml-2 w-1.5 h-1.5 bg-primary rounded-full animate-ping"></span>
                      </p>
                      <p className="text-[11px] text-slate-600 font-bold leading-relaxed mt-2 italic">
                        123 Creative Studio Street, Film City,<br />
                        Chennai, Tamil Nadu - 600001
                      </p>
                    </div>
                    <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mt-3 ml-1 text-center bg-white border border-primary/10 py-3 rounded-full">Collect your Product here</p>
                  </div>
                </div>

                {/* Column 3: Customer & Financials */}
                <div className="space-y-8 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                  <div className="space-y-6">
                    <div>
                      <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center">
                        <HiUser className="mr-2 text-primary" /> Customer Info
                      </p>
                      <div className="space-y-4 px-2">
                        <div>
                          <p className="text-[10px] text-slate-400 font-black uppercase mb-0.5">Full Name</p>
                          <p className="text-[13px] font-black text-slate-900 uppercase">{selectedOrder.userName}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-black uppercase mb-0.5">Mobile Number</p>
                          <p className="text-[13px] font-black text-slate-900">{selectedOrder.userMobile}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-black uppercase mb-0.5">Email Address</p>
                          <p className="text-[13px] font-black text-slate-600 lowercase">{selectedOrder.userEmail}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-black uppercase mb-0.5">Delivery Address</p>
                          <p className="text-[12px] font-medium text-slate-500 leading-tight italic line-clamp-3">{selectedOrder.userAddress}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-200">
                      <div className="bg-brand-navy p-5 rounded-2xl flex flex-col space-y-4 shadow-xl shadow-orange-100/20">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-[11px] font-black text-cyan-400 uppercase tracking-widest mb-1">Total Price</p>
                            <p className="text-[22px] font-black text-white">₹{selectedOrder.totalPrice.toLocaleString()}</p>
                          </div>
                          {renderStatusBadge(selectedOrder.status)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedOrder.status !== 'Returned' && (
                    <button 
                      onClick={() => setIsConfirming(selectedOrder._id)}
                      className="w-full py-4 text-red-500 font-black uppercase text-[12px] tracking-[0.2em] border-2 border-red-50 border-dashed rounded-2xl hover:bg-red-50 hover:border-red-100 transition-all"
                    >
                      Cancel This Rental
                    </button>
                  )}
                </div>
              </div>
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
            <p className="text-[12px] text-slate-400 font-medium uppercase tracking-widest mb-8 leading-relaxed">
              Are you sure you want to cancel this rental? This action cannot be undone.
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
                  cancelOrder(isConfirming)
                  setIsConfirming(null)
                  setSelectedOrder(null)
                }}
                className="py-3 bg-red-500 text-white rounded-xl font-black text-[12px] uppercase tracking-widest hover:bg-red-600 shadow-lg shadow-red-100 transition-all"
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

