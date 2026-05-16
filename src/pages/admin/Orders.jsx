import { useState } from 'react'
import { useGlobal } from '../../context/GlobalContext'
import toast from 'react-hot-toast'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import { HiCheckCircle, HiClock, HiExclamationCircle, HiArrowRight, HiShoppingCart, HiX, HiCalendar, HiLocationMarker, HiUser, HiPhone, HiMail, HiEye } from 'react-icons/hi'
import TablePagination from '../../components/TablePagination'

const OrdersMonitor = () => {
  const { allOrders, API_URL } = useGlobal()
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('ALL RENTALS')
  const [dateFilter, setDateFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [isReturnConfirming, setIsReturnConfirming] = useState(null)
  const [returnCondition, setReturnCondition] = useState('Good')
  const [returnNotes, setReturnNotes] = useState('')
  const [editingNotes, setEditingNotes] = useState({ id: null, notes: '', condition: '' })

  const updateBookingStatus = async (id, newStatus, condition = 'Good', notes = '') => {
    try {
      const res = await fetch(`${API_URL}/admin/bookings/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, returnCondition: condition, returnNotes: notes })
      })
      if (res.ok) {
        toast.success(`Marked as ${newStatus}`)
        window.location.reload()
      }
    } catch (error) {
      toast.error('Update failed')
    }
  }

  const filteredOrders = allOrders.filter(order => {
    // Search filter
    const matchesSearch = 
      order.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.userMobile?.includes(searchQuery) ||
      order.userEmail?.toLowerCase().includes(searchQuery.toLowerCase())

    // Tab filter
    let matchesTab = true
    if (activeTab === 'RENTED OUT') {
      matchesTab = order.status !== 'Returned'
    } else if (activeTab === 'RETURNED') {
      matchesTab = order.status === 'Returned'
    } else if (activeTab === 'RETURN IN 3 DAYS') {
      const threeDaysFromNow = new Date()
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
      matchesTab = order.status !== 'Returned' && new Date(order.endDate) <= threeDaysFromNow && new Date(order.endDate) >= new Date()
    }

    // Date filter
    const matchesDate = !dateFilter || new Date(order.startDate).toLocaleDateString() === new Date(dateFilter).toLocaleDateString()

    return matchesSearch && matchesTab && matchesDate
  })

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-brand-navy rounded-2xl flex items-center justify-center shadow-lg shadow-brand-navy/20">
            <HiShoppingCart className="text-white text-xl" />
          </div>
          <div>
            <p className="text-primary font-black uppercase tracking-[0.3em] text-[12px] mb-0.5">Rental Pipeline</p>
            <h2 className="text-[18px] font-black text-brand-navy uppercase tracking-widest leading-tight">Orders Monitor</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em]">Track, search and manage every booking</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative group flex-1 sm:w-64">
            <HiEye className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-orange transition-colors" />
            <input 
              type="text"
              placeholder="SEARCH BY NAME, MOBILE..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-[12px] font-black uppercase tracking-widest focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all shadow-sm"
            />
          </div>
          <div className="relative group min-w-[200px]">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
              <HiCalendar className="text-slate-300 group-focus-within:text-brand-orange transition-colors" />
            </div>
            <DatePicker
              selected={dateFilter ? new Date(dateFilter) : null}
              onChange={(date) => setDateFilter(date)}
              dateFormat="dd/MM/yyyy"
              placeholderText="FILTER BY DATE"
              isClearable
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-[12px] font-black uppercase tracking-widest focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all shadow-sm cursor-pointer"
              wrapperClassName="w-full"
              portalId="root"
              popperProps={{ strategy: "fixed" }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 bg-slate-50/50 p-2 rounded-2xl border border-slate-100 w-fit">
        {['ALL RENTALS', 'RENTED OUT', 'RETURNED', 'RETURN IN 3 DAYS'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab 
              ? 'bg-white text-brand-navy shadow-md shadow-slate-200/50 border border-slate-100' 
              : 'text-slate-400 hover:text-brand-navy hover:bg-white/50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-slate-50 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f8fafc] text-brand-navy uppercase text-[12px] tracking-[0.2em] font-black border-b border-slate-100">
              <th className="p-6">Equipment Details</th>
              <th className="p-6">Client & Contact</th>
              <th className="p-6">Return Schedule</th>
              <th className="p-6 text-center">Actions & Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-20 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-slate-100">
                      <HiShoppingCart className="text-slate-200 text-2xl" />
                    </div>
                    <p className="text-[12px] font-black text-slate-300 uppercase tracking-[0.2em]">No results found</p>
                    <p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest mt-1">Try adjusting your filters or search query</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedOrders.map(order => (
                <tr key={order._id} className="hover:bg-[#f8fafc]/50 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-4">
                        <div className="w-24 flex items-center -space-x-4 flex-shrink-0">
                          {(order.items && order.items.length > 0 ? order.items : [order.productId]).slice(0, 3).map((item, idx) => (
                            <div key={idx} className="relative">
                              <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-white shadow-sm bg-white">
                                <img src={item?.productId?.imageUrl || item?.imageUrl} className="w-full h-full object-cover" alt="" />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-1">
                           {(order.items && order.items.length > 0 ? order.items : [order.productId]).slice(0, 2).map((item, idx) => (
                             <div key={idx} className="flex items-center space-x-2">
                               <div className="w-1 h-1 bg-brand-navy/30 rounded-full flex-shrink-0"></div>
                               <p className="text-brand-navy font-black uppercase text-[11px] tracking-tight truncate max-w-[150px]">{item?.name || 'Item'}</p>
                             </div>
                           ))}
                           {(order.items?.length > 2) && <p className="text-[9px] text-slate-400 font-black uppercase ml-2.5">+{order.items.length - 2} More Items</p>}
                        </div>
                      </div>
                      {order.status === 'Returned' && order.returnNotes && (
                        <div className="ml-auto flex items-center pr-4">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight italic bg-slate-50/50 px-3 py-1.5 rounded-xl border border-slate-100 max-w-[200px] truncate" title={order.returnNotes}>
                            "{order.returnNotes}"
                          </p>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center space-x-2">
                      <p className="font-black text-brand-navy uppercase text-[12px] tracking-tight">{order.userName}</p>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${order.accountType === 'Company' ? 'bg-orange-50 text-primary border border-primary/20' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                        {order.accountType || 'Private'}
                      </span>
                    </div>
                    <p className="text-[12px] text-brand-orange font-black mt-0.5">{order.userMobile || 'No Contact'}</p>
                    <p className="text-[11px] text-slate-400 font-medium lowercase tracking-tight">{order.userEmail}</p>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="text-brand-navy font-black text-[12px] tracking-tighter">
                        {new Date(order.endDate).toLocaleDateString('en-GB')}
                      </span>
                      <span className="text-[11px] text-slate-400 font-black uppercase mt-0.5 flex items-center">
                        <HiClock className="mr-1 text-[10px]" />
                        At {new Date(order.endDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center justify-center gap-3">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 bg-slate-50 text-slate-300 hover:text-brand-navy hover:bg-slate-100 rounded-lg transition-all"
                        title="View Full Details"
                      >
                        <HiEye className="text-base" />
                      </button>
                      
                      {order.status === 'Returned' ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl border border-emerald-100">
                            <HiCheckCircle className="text-sm" />
                            <span className="text-[11px] font-black uppercase tracking-widest">Returned</span>
                          </div>
                          {order.returnCondition && (
                            <button 
                              onClick={() => setEditingNotes({ 
                                id: order._id, 
                                notes: order.returnNotes || '', 
                                condition: order.returnCondition 
                              })}
                              className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl border transition-all hover:scale-105 active:scale-95 shadow-sm ${order.returnCondition === 'Good' ? 'bg-slate-50 text-emerald-500 border-emerald-100 hover:bg-emerald-50' : 'bg-red-50 text-red-500 border-red-100 hover:bg-red-100'}`}
                              title="Click to Edit Return Details"
                            >
                              {order.returnCondition}
                            </button>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border shadow-sm ${
                            new Date(order.endDate) < new Date() 
                            ? 'bg-red-50 text-red-500 border-red-100 shadow-red-50' 
                            : 'bg-orange-50 text-primary border-primary/20 shadow-orange-50'
                          }`}>
                            {new Date(order.endDate) < new Date() ? <HiExclamationCircle className="text-sm" /> : <HiClock className="text-sm" />}
                            <span className="text-[11px] font-black uppercase tracking-widest">
                              {new Date(order.endDate) < new Date() ? 'Overdue' : 'Active'}
                            </span>
                          </div>
                          <button 
                            onClick={() => setIsReturnConfirming(order._id)}
                            className="flex items-center space-x-1.5 bg-brand-navy text-white px-3 py-1.5 rounded-xl hover:bg-primary transition-all shadow-lg shadow-orange-100/50 group/btn"
                          >
                            <HiCheckCircle className="text-xs group-hover/btn:scale-110 transition-transform" />
                            <span className="text-[11px] font-black uppercase tracking-widest">Mark Returned</span>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <TablePagination 
          totalItems={filteredOrders.length}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      </div>

      {/* Admin Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-start justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white max-w-6xl w-full rounded-3xl relative shadow-2xl border-t-8 border-brand-navy my-8 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setSelectedOrder(null)}
              className="absolute right-6 top-6 text-slate-300 hover:text-red-500 transition-colors p-2 text-2xl font-light"
            >
              <HiX />
            </button>

            <div className="p-10">
              <div className="mb-8 border-b border-slate-50 pb-6 flex justify-between items-end">
                <div>
                  <p className="text-brand-orange font-black uppercase tracking-[0.3em] text-[12px] mb-1">Internal Order View</p>
                  <h2 className="text-[20px] font-black text-brand-navy uppercase tracking-widest">Order Details</h2>
                  <p className="text-[12px] text-slate-400 font-bold uppercase mt-1">Ref: {selectedOrder._id}</p>
                </div>
                <div className="text-right">
                   <span className={`px-4 py-1.5 rounded-full text-[12px] font-black uppercase tracking-[0.2em] ${selectedOrder.status === 'Returned' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-orange-50 text-primary border border-primary/20'}`}>
                    {selectedOrder.status}
                   </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {/* Column 1: Equipment List */}
                <div className="space-y-4">
                  <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Equipment List</p>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-100">
                    {(selectedOrder.items && selectedOrder.items.length > 0 ? selectedOrder.items : [selectedOrder.productId]).map((item, idx) => (
                      <div key={idx} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-white rounded-xl overflow-hidden border border-slate-100 p-1">
                             <img src={item?.productId?.imageUrl || item?.imageUrl || 'https://via.placeholder.com/100'} className="w-full h-full object-contain" alt="" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[12px] font-black text-brand-navy uppercase tracking-tight leading-tight">{item?.name || 'Unknown Item'}</p>
                            <p className="text-[11px] text-slate-400 font-bold uppercase mt-0.5">Rate: ₹{item?.pricePerDay || 0} / Day</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 2: Rental Window & Pickup */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Logistics</p>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-6">
                      <div className="flex justify-between items-center">
                        <div className="text-center flex-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Pick Up</p>
                          <p className="text-[12px] font-black text-brand-navy uppercase">{new Date(selectedOrder.startDate).toLocaleDateString('en-GB')}</p>
                          <p className="text-[11px] text-brand-orange font-bold mt-0.5">{new Date(selectedOrder.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="px-4">
                          <HiArrowRight className="text-slate-300" />
                        </div>
                        <div className="text-center flex-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Return</p>
                          <p className="text-[12px] font-black text-brand-navy uppercase">{new Date(selectedOrder.endDate).toLocaleDateString('en-GB')}</p>
                          <p className="text-[11px] text-brand-orange font-bold mt-0.5">{new Date(selectedOrder.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-slate-200 border-dashed flex justify-between items-center">
                        <p className="text-[11px] font-black text-slate-400 uppercase">Total Duration</p>
                        <p className="text-[13px] font-black text-brand-navy uppercase">{selectedOrder.totalDays || Math.ceil(Math.abs(new Date(selectedOrder.endDate) - new Date(selectedOrder.startDate)) / (1000 * 60 * 60 * 24)) || 1} Day(s)</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Pickup Point</p>
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
                  </div>
                </div>

                {/* Column 3: Client Info & Financials */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Client Profile</p>
                    <div className="space-y-4 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-brand-navy shadow-sm border border-slate-100">
                          <HiUser className="text-sm" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-slate-400 font-bold">Full Name</p>
                          <p className="text-[12px] font-black text-brand-navy uppercase leading-none">{selectedOrder.userName}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-brand-navy shadow-sm border border-slate-100">
                          <HiMail className="text-sm" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-slate-400 font-bold">Email Address</p>
                          <p className="text-[12px] font-black text-brand-navy leading-none">{selectedOrder.userEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-brand-navy shadow-sm border border-slate-100">
                          <HiPhone className="text-sm" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-slate-400 font-bold">Mobile Number</p>
                          <p className="text-[12px] font-black text-brand-navy leading-none">{selectedOrder.userMobile}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-brand-navy shadow-sm border border-slate-100 mt-0.5">
                          <HiLocationMarker className="text-sm" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-slate-400 font-bold">Delivery Address</p>
                          <p className="text-[11px] font-black text-brand-navy uppercase leading-relaxed line-clamp-3">{selectedOrder.userAddress}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="pt-4 space-y-6">
                    <div className="bg-brand-navy p-6 rounded-3xl flex flex-col space-y-4 shadow-xl shadow-orange-100/20">
                      <div>
                        <p className="text-[11px] font-black text-cyan-400 uppercase tracking-widest mb-1">Total Revenue</p>
                        <p className="text-[28px] font-black text-white tracking-tighter leading-none">₹{selectedOrder.totalPrice.toLocaleString()}</p>
                      </div>
                      
                      {selectedOrder.status !== 'Returned' && (
                        <button 
                          onClick={() => setIsReturnConfirming(selectedOrder._id)}
                          className="w-full bg-white text-brand-navy py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-lg"
                        >
                          Mark as Returned
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return Confirmation Modal */}
      {isReturnConfirming && (
        <div className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-emerald-100">
              <HiCheckCircle className="text-4xl text-emerald-500" />
            </div>
            <h3 className="text-[18px] font-black text-brand-navy uppercase tracking-tight mb-2">Equipment Return</h3>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed mb-6">
              Please verify the condition of the equipment before confirming the return.
            </p>

            <div className="space-y-6 mb-8 text-left">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Physical Condition</label>
                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                  <button 
                    onClick={() => setReturnCondition('Good')}
                    className={`flex-1 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${returnCondition === 'Good' ? 'bg-white text-emerald-500 shadow-md border border-slate-100' : 'text-slate-400 hover:text-brand-navy'}`}
                  >
                    Good Condition
                  </button>
                  <button 
                    onClick={() => setReturnCondition('Bad')}
                    className={`flex-1 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${returnCondition === 'Bad' ? 'bg-white text-red-500 shadow-md border border-slate-100' : 'text-slate-400 hover:text-brand-navy'}`}
                  >
                    Found Issues
                  </button>
                </div>
              </div>

              <div className={`transition-all duration-300 ${returnCondition === 'Bad' ? 'opacity-100 translate-y-0 h-auto' : 'opacity-0 -translate-y-2 h-0 overflow-hidden'}`}>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Issue Details</label>
                <textarea 
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="DESCRIBE THE DAMAGE OR ISSUE..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-[11px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all resize-none h-24"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button 
                onClick={() => {
                  setIsReturnConfirming(null)
                  setReturnCondition('Good')
                  setReturnNotes('')
                }}
                className="flex-1 px-6 py-3 bg-slate-50 text-slate-400 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  updateBookingStatus(isReturnConfirming, 'Returned', returnCondition, returnNotes)
                  setIsReturnConfirming(null)
                  setReturnCondition('Good')
                  setReturnNotes('')
                  if (selectedOrder) setSelectedOrder(null)
                }}
                className={`flex-1 px-6 py-3 text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg ${returnCondition === 'Bad' ? 'bg-red-500 hover:bg-red-600 shadow-red-100' : 'bg-brand-navy hover:bg-emerald-600 shadow-emerald-100'}`}
              >
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Return Details Modal */}
      {editingNotes.id && (
        <div className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-8 text-center animate-in zoom-in-95 duration-200">
            <h3 className="text-[18px] font-black text-brand-navy uppercase tracking-tight mb-2">Edit Return Info</h3>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed mb-6">
              Update the condition or notes for this equipment.
            </p>

            <div className="space-y-6 mb-8 text-left">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Physical Condition</label>
                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                  <button 
                    onClick={() => setEditingNotes(prev => ({ ...prev, condition: 'Good' }))}
                    className={`flex-1 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${editingNotes.condition === 'Good' ? 'bg-white text-emerald-500 shadow-md border border-slate-100' : 'text-slate-400 hover:text-brand-navy'}`}
                  >
                    Good
                  </button>
                  <button 
                    onClick={() => setEditingNotes(prev => ({ ...prev, condition: 'Bad' }))}
                    className={`flex-1 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${editingNotes.condition === 'Bad' ? 'bg-white text-red-500 shadow-md border border-slate-100' : 'text-slate-400 hover:text-brand-navy'}`}
                  >
                    Bad
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Notes</label>
                <textarea 
                  value={editingNotes.notes}
                  onChange={(e) => setEditingNotes(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="ADD ANY NOTES..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-[11px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-brand-navy/10 focus:border-brand-navy outline-none transition-all resize-none h-24"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button 
                onClick={() => setEditingNotes({ id: null, notes: '', condition: '' })}
                className="flex-1 px-6 py-3 bg-slate-50 text-slate-400 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  updateBookingStatus(editingNotes.id, 'Returned', editingNotes.condition, editingNotes.notes)
                  setEditingNotes({ id: null, notes: '', condition: '' })
                }}
                className="flex-1 px-6 py-3 bg-brand-navy text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrdersMonitor
