import { useGlobal } from '../../context/GlobalContext'
import toast from 'react-hot-toast'
import { HiCheckCircle, HiClock, HiExclamationCircle, HiArrowRight,HiShoppingCart} from 'react-icons/hi'

const OrdersMonitor = () => {
  const { allOrders, API_URL } = useGlobal()

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
        <p className="text-[#00b4d8] font-black uppercase tracking-[0.3em] text-[8px] mb-1">Rental Pipeline</p>
        <h2 className="text-[16px] font-black text-[#03045e] uppercase tracking-widest">Orders Monitor</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-slate-50 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f8fafc] text-[#03045e] uppercase text-[8px] tracking-[0.2em] font-black border-b border-slate-100">
              <th className="p-4">Client & Contact</th>
              <th className="p-4">Equipment</th>
              <th className="p-4">Rental Window</th>
              <th className="p-4">Financials</th>
              <th className="p-4">Status & Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {allOrders.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-20 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-slate-100">
                      <HiShoppingCart className="text-slate-200 text-2xl" />
                    </div>
                    <p className="text-[12px] font-black text-slate-300 uppercase tracking-[0.2em]">No orders here</p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">When customers rent gear, they will appear in this pipeline</p>
                  </div>
                </td>
              </tr>
            ) : (
              allOrders.map(order => (
                <tr key={order._id} className="hover:bg-[#f8fafc]/50 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <p className="font-black text-brand-navy uppercase text-[12px] tracking-tight">{order.userName}</p>
                      <span className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest ${order.accountType === 'Company' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                        {order.accountType || 'Private'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">{order.userEmail}</p>
                    <p className="text-[10px] text-brand-orange font-black mt-1">{order.userMobile || 'No Mobile'}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-1 h-1 bg-brand-navy rounded-full"></div>
                      <p className="text-brand-navy font-black uppercase text-[10px] tracking-widest">{order.productId?.name || 'Unknown'}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="bg-slate-50 px-2 py-1 rounded-md inline-block">
                      <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest flex items-center">
                        {new Date(order.startDate).toLocaleDateString('en-GB')}
                        <HiArrowRight className="mx-2 text-brand-orange" />
                        {new Date(order.endDate).toLocaleDateString('en-GB')}
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-baseline space-x-0.5">
                      <span className="text-brand-orange font-black text-[10px]">₹</span>
                      <p className="font-black text-brand-navy text-[14px] tracking-tighter">{order.totalPrice}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
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
                            onClick={() => updateBookingStatus(order._id, 'Returned')}
                            className="flex items-center space-x-1.5 bg-brand-navy text-white px-3 py-1.5 rounded-xl hover:bg-brand-red transition-all shadow-lg shadow-indigo-100/50 group/btn"
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
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default OrdersMonitor

