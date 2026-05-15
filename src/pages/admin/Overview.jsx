import { useState } from 'react'
import { HiChartBar, HiCube, HiShoppingCart, HiCalendar, HiFilter, HiCheckCircle, HiClock, HiExclamationCircle, HiSearch } from 'react-icons/hi'
import { useGlobal } from '../../context/GlobalContext'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import { isWithinInterval, differenceInDays } from 'date-fns'
import toast from 'react-hot-toast'

const AdminOverview = () => {
  const { adminStats, allOrders, API_URL } = useGlobal()
  const [dateRange, setDateRange] = useState([null, null])
  const [startDate, endDate] = dateRange
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('rented') // default to rented
  const [isReturnConfirming, setIsReturnConfirming] = useState(null)

  const filteredOrders = allOrders.filter(order => {
    // 1. Search Filter
    const searchMatch = 
      order.productId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order._id.toLowerCase().includes(searchTerm.toLowerCase())

    if (!searchMatch) return false

    // 2. Tab Filter
    if (activeTab === 'rented' && order.status === 'Returned') return false
    if (activeTab === 'returned' && order.status !== 'Returned') return false
    if (activeTab === 'due') {
      const daysLeft = differenceInDays(new Date(order.endDate), new Date())
      if (order.status === 'Returned' || daysLeft < 0 || daysLeft > 3) return false
    }

    // 3. Date Range Filter
    if (!startDate && !endDate) return true
    const orderDate = new Date(order.startDate)
    if (startDate && !endDate) return orderDate >= startDate
    if (startDate && endDate) return isWithinInterval(orderDate, { start: startDate, end: endDate })

    return true
  })

  const updateBookingStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/admin/bookings/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        toast.success(`Marked as ${newStatus}`)
        window.location.reload()
      }
    } catch (error) {
      toast.error('Update failed')
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <p className="text-[#00b4d8] font-black uppercase tracking-[0.3em] text-[8px] mb-1">Analytics Dashboard</p>
        <h2 className="text-[16px] font-black text-[#03045e] uppercase tracking-widest">Performance</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg relative overflow-hidden group hover:shadow-orange-50 transition-all">
          <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
            <HiCube className="text-4xl text-brand-navy" />
          </div>
          <p className="text-slate-400 font-black uppercase tracking-widest text-[8px] mb-2">Total Inventory</p>
          <div className="flex items-baseline space-x-2">
            <p className="text-[24px] font-black text-brand-navy tracking-tighter">{adminStats.productCount}</p>
            <span className="text-brand-orange font-black text-[10px] uppercase">Units</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg relative overflow-hidden group hover:shadow-red-50 transition-all">
          <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
            <HiShoppingCart className="text-4xl text-brand-red" />
          </div>
          <p className="text-slate-400 font-black uppercase tracking-widest text-[8px] mb-2">Active Bookings</p>
          <div className="flex items-baseline space-x-2">
            <p className="text-[24px] font-black text-brand-red tracking-tighter">{adminStats.bookingCount}</p>
            <span className="text-brand-red font-black text-[10px] uppercase">Orders</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-brand-navy via-brand-red to-brand-orange p-6 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <HiChartBar className="text-4xl text-white" />
          </div>
          <p className="text-brand-yellow font-black uppercase tracking-widest text-[8px] mb-2">Total Revenue</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-brand-yellow font-black text-[14px] leading-none">₹</span>
            <p className="text-[24px] font-black text-white tracking-tighter">{adminStats.totalRevenue}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-50 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-brand-navy rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                <HiCalendar className="text-white text-xl" />
              </div>
              <div>
                <h3 className="text-[14px] font-black text-brand-navy uppercase tracking-wider">Rental Pipeline</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Track, search and manage every booking</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="relative group flex-1 min-w-[200px]">
                <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-orange transition-colors" />
                <input 
                  type="text" 
                  placeholder="SEARCH BY CLIENT OR GEAR..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-100 p-3 pl-10 rounded-xl font-black uppercase text-[9px] tracking-widest focus:border-brand-orange focus:ring-4 focus:ring-orange-50 outline-none transition-all shadow-sm"
                />
              </div>

              <div className="relative group min-w-[240px]">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                  <HiFilter className="text-brand-orange text-xs" />
                </div>
                <DatePicker
                  selectsRange={true}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(update) => setDateRange(update)}
                  isClearable={true}
                  placeholderText="FILTER BY DATES"
                  className="w-full border border-slate-100 p-3 pl-10 rounded-xl font-black uppercase text-[9px] tracking-widest focus:border-brand-orange outline-none transition-all cursor-pointer bg-white shadow-sm"
                  wrapperClassName="w-full"
                  popperProps={{ strategy: "fixed" }}
                  portalId="root"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1 mt-8 bg-slate-100/50 p-1 rounded-2xl w-fit">
            {[
              { id: 'all', label: 'All Rentals' },
              { id: 'rented', label: 'Rented Out' },
              { id: 'returned', label: 'Returned' },
              { id: 'due', label: 'Return in 3 Days', color: 'text-brand-red' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id 
                  ? 'bg-white text-brand-navy shadow-md shadow-slate-200/50 scale-105' 
                  : `text-slate-400 hover:text-slate-600 ${tab.color || ''}`
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#f8fafc]/50 text-brand-navy uppercase text-[8px] tracking-[0.2em] font-black">
                <th className="p-6">Equipment</th>
                <th className="p-6">Client</th>
                <th className="p-6">Return Date</th>
                <th className="p-6 text-center">Status & Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.length > 0 ? (
                filteredOrders.map(order => (
                  <tr key={order._id} className="hover:bg-[#f8fafc]/50 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200 p-1">
                          <img 
                            src={order.productId?.imageUrl || 'https://via.placeholder.com/40'} 
                            alt="" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div>
                          <p className="text-brand-navy font-black uppercase text-[11px] tracking-tight group-hover:text-brand-orange transition-colors">
                            {order.productId?.name || 'Unknown Item'}
                          </p>
                          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                            ID: {order._id.slice(-6)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <p className="font-black text-brand-navy uppercase text-[10px] tracking-tight">{order.userName}</p>
                      <p className="text-[8px] text-brand-orange font-black uppercase tracking-widest mt-0.5">{order.userMobile || 'No Contact'}</p>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="text-[#03045e] font-black text-[12px] tracking-tighter">
                          {new Date(order.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-[7px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">
                          At 06:00 PM
                        </span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center justify-center gap-3">
                        {order.status === 'Returned' ? (
                          <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl border border-emerald-100 shadow-sm shadow-emerald-50">
                            <HiCheckCircle className="text-sm" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Returned</span>
                          </div>
                        ) : (
                          <>
                            <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border shadow-sm ${
                              new Date(order.endDate) < new Date() 
                              ? 'bg-red-50 text-red-500 border-red-100 shadow-red-50' 
                              : 'bg-indigo-50 text-indigo-600 border-indigo-100 shadow-indigo-50'
                            }`}>
                              {new Date(order.endDate) < new Date() ? <HiExclamationCircle className="text-sm" /> : <HiClock className="text-sm" />}
                              <span className="text-[8px] font-black uppercase tracking-widest">
                                {new Date(order.endDate) < new Date() ? 'Overdue' : 'Active'}
                              </span>
                            </div>
                            <button 
                              onClick={() => setIsReturnConfirming(order._id)}
                              className="flex items-center space-x-1.5 bg-[#03045e] text-white px-3 py-1.5 rounded-xl hover:bg-[#5e60ce] transition-all shadow-lg shadow-indigo-100/50 group/btn justify-center"
                            >
                              <HiCheckCircle className="text-xs group-hover/btn:scale-110 transition-transform" />
                              <span className="text-[8px] font-black uppercase tracking-widest">Mark Returned</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                        <HiFilter className="text-slate-200 text-xl" />
                      </div>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">No rentals found for this period</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Confirmation Popup */}
      {isReturnConfirming && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
          <div className="bg-white max-w-sm w-full p-8 rounded-3xl shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl shadow-inner">
              <HiCheckCircle />
            </div>
            <h3 className="text-[18px] font-black text-slate-900 uppercase tracking-tight mb-2">Mark as Returned?</h3>
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest mb-8 leading-relaxed">
              Confirming this will restore the equipment to inventory and mark the rental as completed.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setIsReturnConfirming(null)}
                className="py-3 bg-slate-50 text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  updateBookingStatus(isReturnConfirming, 'Returned')
                  setIsReturnConfirming(null)
                }}
                className="py-3 bg-[#03045e] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#5e60ce] shadow-lg shadow-indigo-100 transition-all"
              >
                Yes, Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOverview

