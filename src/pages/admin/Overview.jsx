import { useState } from 'react'
import { HiChartBar, HiCube, HiShoppingCart, HiCalendar, HiFilter, HiCheckCircle, HiClock, HiExclamationCircle, HiSearch } from 'react-icons/hi'
import { useGlobal } from '../../context/GlobalContext'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import { isWithinInterval, differenceInDays, isSameDay } from 'date-fns'
import toast from 'react-hot-toast'

const AdminOverview = () => {
  const { adminStats, allOrders, API_URL } = useGlobal()
  const [dateRange, setDateRange] = useState([null, null])
  const [startDate, endDate] = dateRange
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('rented') // default to rented
  const [isReturnConfirming, setIsReturnConfirming] = useState(null)
  
  const [outDate, setOutDate] = useState(new Date())
  const [inDate, setInDate] = useState(new Date())
  const [returnCondition, setReturnCondition] = useState('Good')
  const [returnNotes, setReturnNotes] = useState('')
  const [editingNotes, setEditingNotes] = useState({ id: null, notes: '', condition: '' })
  
  const scheduleOut = allOrders.filter(order => 
    order.status !== 'Returned' && 
    isSameDay(new Date(order.startDate), outDate)
  )
  
  const scheduleIn = allOrders.filter(order => 
    order.status !== 'Returned' && 
    isSameDay(new Date(order.endDate), inDate)
  )

  const flattenItems = (orders) => {
    return orders.flatMap(order => {
      const items = order.items && order.items.length > 0 
        ? order.items 
        : [{ productId: order.productId, name: order.productId?.name, imageUrl: order.productId?.imageUrl || order.imageUrl, _id: 'legacy' }]
        
      return items.map((item, idx) => ({
        ...order,
        displayItem: item,
        uniqueKey: `${order._id}-${item.productId?._id || item._id || idx}`
      }))
    })
  }

  const flattenedOut = flattenItems(scheduleOut)
  const flattenedIn = flattenItems(scheduleIn)

  const filteredOrders = allOrders.filter(order => {
    // 1. Search Filter
    const searchMatch = 
      order.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userMobile?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.items && order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))) ||
      order.productId?.name?.toLowerCase().includes(searchTerm.toLowerCase())

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

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <p className="text-primary font-black uppercase tracking-[0.3em] text-[12px] mb-1">Analytics Dashboard</p>
        <h2 className="text-[16px] font-black text-brand-navy uppercase tracking-widest">Performance</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg relative overflow-hidden group hover:shadow-orange-50 transition-all">
          <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
            <HiCube className="text-4xl text-brand-navy" />
          </div>
          <p className="text-slate-400 font-black uppercase tracking-widest text-[12px] mb-2">Total Inventory</p>
          <div className="flex items-baseline space-x-2">
            <p className="text-[24px] font-black text-brand-navy tracking-tighter">{adminStats.productCount}</p>
            <span className="text-brand-orange font-black text-[12px] uppercase">Units</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg relative overflow-hidden group hover:shadow-red-50 transition-all">
          <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
            <HiShoppingCart className="text-4xl text-brand-red" />
          </div>
          <p className="text-slate-400 font-black uppercase tracking-widest text-[12px] mb-2">Active Bookings</p>
          <div className="flex items-baseline space-x-2">
            <p className="text-[24px] font-black text-brand-red tracking-tighter">{adminStats.bookingCount}</p>
            <span className="text-brand-red font-black text-[12px] uppercase">Orders</span>
          </div>
        </div>
        <div className="bg-primary p-6 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <HiChartBar className="text-4xl text-white" />
          </div>
          <p className="text-brand-yellow font-black uppercase tracking-widest text-[12px] mb-2">Total Revenue</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-brand-yellow font-black text-[14px] leading-none">₹</span>
            <p className="text-[24px] font-black text-white tracking-tighter">{adminStats.totalRevenue}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Going Out */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden group hover:border-brand-orange/20 transition-all duration-300">
          <div className="p-6 border-b border-slate-50 bg-slate-50/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-brand-orange/10 rounded-xl flex items-center justify-center text-brand-orange">
                  <HiShoppingCart className="text-xl" />
                </div>
                <div>
                  <h3 className="text-[14px] font-black text-brand-navy uppercase tracking-wider">Going Out</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Pickups: {outDate.toLocaleDateString('en-GB')}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="relative group/picker min-w-[120px]">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                    <HiCalendar className="text-brand-orange text-[10px]" />
                  </div>
                  <DatePicker
                    selected={outDate}
                    onChange={(date) => setOutDate(date)}
                    className="w-full border border-slate-100 p-1.5 pl-7 rounded-lg font-black uppercase text-[9px] tracking-widest focus:border-brand-orange outline-none transition-all cursor-pointer bg-white shadow-sm"
                    placeholderText="DATE"
                    portalId="root"
                    popperProps={{ strategy: "fixed" }}
                    dateFormat="dd/MM/yyyy"
                  />
                </div>
                <div className="px-3 py-1 bg-brand-orange text-white rounded-lg text-[12px] font-black shadow-lg shadow-orange-100 flex-shrink-0">
                  {flattenedOut.length}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 max-h-[220px] overflow-y-auto custom-scrollbar">
            {flattenedOut.length > 0 ? (
              <div className="space-y-3">
                {flattenedOut.map(item => (
                  <div key={item.uniqueKey} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-white rounded-xl border border-slate-100 flex items-center justify-center overflow-hidden shadow-sm">
                        <img 
                          src={item.displayItem.imageUrl || item.displayItem.productId?.imageUrl || 'https://via.placeholder.com/32'} 
                          className="w-full h-full object-contain p-1"
                          alt=""
                        />
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-brand-navy uppercase tracking-tight">
                          {item.displayItem.name || 'Unknown Item'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{item.userName}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-black bg-orange-100 text-brand-orange px-2 py-0.5 rounded-full uppercase">Active</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 opacity-20">
                  <HiShoppingCart className="text-xl text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-300 font-black uppercase tracking-widest">No orders scheduled</p>
              </div>
            )}
          </div>
        </div>

        {/* Coming Back */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden group hover:border-emerald-500/20 transition-all duration-300">
          <div className="p-6 border-b border-slate-50 bg-slate-50/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                  <HiCheckCircle className="text-xl" />
                </div>
                <div>
                  <h3 className="text-[14px] font-black text-brand-navy uppercase tracking-wider">Coming Back</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Returns: {inDate.toLocaleDateString('en-GB')}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="relative group/picker min-w-[120px]">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                    <HiCalendar className="text-emerald-500 text-[10px]" />
                  </div>
                  <DatePicker
                    selected={inDate}
                    onChange={(date) => setInDate(date)}
                    className="w-full border border-slate-100 p-1.5 pl-7 rounded-lg font-black uppercase text-[9px] tracking-widest focus:border-emerald-500 outline-none transition-all cursor-pointer bg-white shadow-sm"
                    placeholderText="DATE"
                    portalId="root"
                    popperProps={{ strategy: "fixed" }}
                    dateFormat="dd/MM/yyyy"
                  />
                </div>
                <div className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-[12px] font-black shadow-lg shadow-emerald-100 flex-shrink-0">
                  {flattenedIn.length}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 max-h-[220px] overflow-y-auto custom-scrollbar">
            {flattenedIn.length > 0 ? (
              <div className="space-y-3">
                {flattenedIn.map(item => (
                  <div key={item.uniqueKey} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-white rounded-xl border border-slate-100 flex items-center justify-center overflow-hidden shadow-sm">
                        <img 
                          src={item.displayItem.imageUrl || item.displayItem.productId?.imageUrl || 'https://via.placeholder.com/32'} 
                          className="w-full h-full object-contain p-1"
                          alt=""
                        />
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-brand-navy uppercase tracking-tight">
                          {item.displayItem.name || 'Unknown Item'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{item.userName}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsReturnConfirming(item._id)}
                      className="px-3 py-1.5 bg-brand-navy text-white rounded-lg text-[9px] font-black uppercase hover:bg-emerald-600 transition-all shadow-sm hover:shadow-md"
                    >
                      Return
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 opacity-20">
                  <HiCheckCircle className="text-xl text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-300 font-black uppercase tracking-widest">No returns due</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-50 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-brand-navy rounded-xl flex items-center justify-center shadow-lg shadow-orange-100">
                <HiCalendar className="text-white text-xl" />
              </div>
              <div>
                <h3 className="text-[14px] font-black text-brand-navy uppercase tracking-wider">Rental Pipeline</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Track, search and manage every booking</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="relative group flex-1 min-w-[200px]">
                <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-orange transition-colors" />
                <input 
                  type="text" 
                  placeholder="SEARCH BY NAME, MOBILE, EMAIL, OR GEAR..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-100 p-3 pl-10 rounded-xl font-black uppercase text-[12px] tracking-widest focus:border-brand-orange focus:ring-4 focus:ring-orange-50 outline-none transition-all shadow-sm"
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
                  className="w-full border border-slate-100 p-3 pl-10 rounded-xl font-black uppercase text-[12px] tracking-widest focus:border-brand-orange outline-none transition-all cursor-pointer bg-white shadow-sm"
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
                className={`px-6 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${
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
              <tr className="bg-[#f8fafc]/50 text-brand-navy uppercase text-[12px] tracking-[0.2em] font-black">
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
                            src={(order.items && order.items.length > 0 ? (order.items[0].productId?.imageUrl || order.items[0].imageUrl) : (order.productId?.imageUrl || order.imageUrl)) || 'https://via.placeholder.com/40'} 
                            alt="" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div>
                          <p className="text-brand-navy font-black uppercase text-[12px] tracking-tight group-hover:text-brand-orange transition-colors">
                            {order.items && order.items.length > 0 
                              ? `${order.items.length} Items Order` 
                              : (order.productId?.name || 'Unknown Item')}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(order.items && order.items.length > 0 ? order.items : [order.productId]).slice(0, 2).map((item, idx) => (
                              <span key={idx} className="text-[12px] bg-slate-50 text-slate-400 px-1 py-0.5 rounded uppercase font-black">{item?.name}</span>
                            ))}
                            {(order.items?.length > 2) && <span className="text-[12px] text-slate-300 font-black">+{order.items.length - 2}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <p className="font-black text-brand-navy uppercase text-[12px] tracking-tight">{order.userName}</p>
                      <p className="text-[12px] text-brand-orange font-black uppercase tracking-widest mt-0.5">{order.userMobile || 'No Contact'}</p>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="text-brand-navy font-black text-[12px] tracking-tighter">
                          {new Date(order.endDate).toLocaleDateString('en-GB')}
                        </span>
                        <span className="text-[12px] text-slate-400 font-black uppercase mt-0.5">
                          At {new Date(order.endDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center justify-center gap-3">
                        {order.status === 'Returned' ? (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl border border-emerald-100 shadow-sm shadow-emerald-50">
                              <HiCheckCircle className="text-sm" />
                              <span className="text-[12px] font-black uppercase tracking-widest">Returned</span>
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
                              <span className="text-[12px] font-black uppercase tracking-widest">
                                {new Date(order.endDate) < new Date() ? 'Overdue' : 'Active'}
                              </span>
                            </div>
                            <button 
                              onClick={() => setIsReturnConfirming(order._id)}
                              className="flex items-center space-x-1.5 bg-brand-navy text-white px-3 py-1.5 rounded-xl hover:bg-primary transition-all shadow-lg shadow-orange-100/50 group/btn justify-center"
                            >
                              <HiCheckCircle className="text-xs group-hover/btn:scale-110 transition-transform" />
                              <span className="text-[12px] font-black uppercase tracking-widest">Mark Returned</span>
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
                      <p className="text-slate-400 text-[12px] font-black uppercase tracking-widest">No rentals found for this period</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Confirmation Popup */}      {isReturnConfirming && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
          <div className="bg-white max-w-sm w-full p-8 rounded-3xl shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl shadow-inner">
              <HiCheckCircle />
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

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => {
                  setIsReturnConfirming(null)
                  setReturnCondition('Good')
                  setReturnNotes('')
                }}
                className="py-3 bg-slate-50 text-slate-400 rounded-xl font-black text-[12px] uppercase tracking-widest hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  updateBookingStatus(isReturnConfirming, 'Returned', returnCondition, returnNotes)
                  setIsReturnConfirming(null)
                  setReturnCondition('Good')
                  setReturnNotes('')
                }}
                className={`py-3 text-white rounded-xl font-black text-[12px] uppercase tracking-widest transition-all shadow-lg ${returnCondition === 'Bad' ? 'bg-red-500 hover:bg-red-600 shadow-red-100' : 'bg-brand-navy hover:bg-emerald-600 shadow-emerald-100'}`}
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

export default AdminOverview
