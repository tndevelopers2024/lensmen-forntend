import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import { differenceInDays, addDays } from 'date-fns'
import { useGlobal } from '../context/GlobalContext'
import { HiCalendar, HiClock } from 'react-icons/hi'

const BookingModal = ({ product, onClose, setAuthMode }) => {
  const { user, fetchProducts, setCart, cart, API_URL, rentalDates, fetchUserOrders } = useGlobal()
  const navigate = useNavigate()
  
  const isBulk = Array.isArray(product);
  const products = isBulk ? product : [product];

  const [bookingData, setBookingData] = useState({ 
    startDate: rentalDates.from || new Date(), 
    endDate: rentalDates.to || addDays(new Date(), 1),
    fullName: user?.fullName || '',
    email: user?.email || '',
    address: user?.address || '',
    mobile: user?.mobile || ''
  })

  const totalPerDay = products.reduce((sum, p) => sum + (p.pricePerDay || 0), 0);
  const duration = bookingData.startDate && bookingData.endDate 
    ? Math.max(1, Math.ceil(differenceInDays(bookingData.endDate, bookingData.startDate))) 
    : 0;

  const handleBooking = async (e) => {
    e.preventDefault()
    if (!user) {
      setAuthMode('login')
      onClose()
      return
    }

    if (differenceInDays(bookingData.endDate, bookingData.startDate) > 10) {
      toast.error('Rental period cannot exceed 10 days')
      return
    }

    try {
      const res = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: isBulk ? undefined : product._id,
          products: isBulk ? products : undefined,
          userName: bookingData.fullName,
          userEmail: bookingData.email,
          userAddress: bookingData.address,
          userMobile: bookingData.mobile,
          accountType: user?.accountType || 'Private',
          startDate: bookingData.startDate,
          endDate: bookingData.endDate
        })
      })
      const data = await res.json()
      if (res.ok) {
        onClose()
        fetchProducts()
        fetchUserOrders()
        toast.success('Rental confirmed!')
        if (isBulk) {
          setCart([])
        } else {
          setCart(cart.filter(item => item._id !== product._id))
        }
        navigate('/my-orders', { state: { autoOpenOrderId: data._id } })
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('Booking failed')
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-start justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-none p-8 max-w-2xl w-full relative shadow-2xl border-t-8 border-primary my-8">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-300 hover:text-primary transition-colors p-2 text-2xl font-light">×</button>
        <div className="mb-6">
          <p className="text-primary font-black uppercase tracking-[0.3em] text-[12px] mb-1">Rental Details</p>
          <h2 className="text-[16px] font-black text-slate-900 uppercase tracking-widest leading-tight">
            {isBulk ? `Book ${products.length} Items` : `Book ${product.name}`}
          </h2>
          {isBulk && (
            <div className="mt-4 flex flex-wrap gap-2">
              {products.map(p => (
                <span key={p._id} className="bg-slate-50 text-slate-500 text-[12px] font-black px-2 py-1 rounded border border-slate-100 uppercase tracking-widest">{p.name}</span>
              ))}
            </div>
          )}
        </div>
        <form onSubmit={handleBooking} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
              <input
                type="text"
                required
                value={bookingData.fullName}
                onChange={e => setBookingData({ ...bookingData, fullName: e.target.value })}
                className="w-full border-b border-slate-100 p-2 font-black uppercase text-[12px] focus:border-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <input
                type="email"
                required
                value={bookingData.email}
                onChange={e => setBookingData({ ...bookingData, email: e.target.value })}
                className="w-full border-b border-slate-100 p-2 font-black text-[12px] focus:border-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
              <input
                type="tel"
                required
                placeholder="+91"
                value={bookingData.mobile}
                onChange={e => setBookingData({ ...bookingData, mobile: e.target.value })}
                className="w-full border-b border-slate-100 p-2 font-black text-[12px] focus:border-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">Address</label>
              <input
                type="text"
                required
                value={bookingData.address}
                onChange={e => setBookingData({ ...bookingData, address: e.target.value })}
                className="w-full border-b border-slate-100 p-2 font-black text-[12px] focus:border-primary outline-none transition-all"
              />
            </div>

            {/* Date Range Picker */}
            <div className="md:col-span-2 space-y-1 relative">
              <label className="text-[12px] font-black text-primary uppercase tracking-widest ml-1">Rental Dates (Max 10 Days)</label>
              <div className="relative group">
                <DatePicker
                  selectsRange={true}
                  startDate={bookingData.startDate}
                  endDate={bookingData.endDate}
                  onChange={(dates) => {
                    const [start, end] = dates
                    setBookingData(prev => {
                      const newStart = start || prev.startDate
                      const newEnd = end
                      
                      // If times were already set, preserve them on the new dates
                      if (newStart && prev.startDate) newStart.setHours(prev.startDate.getHours(), prev.startDate.getMinutes())
                      if (newEnd && prev.endDate) newEnd.setHours(prev.endDate.getHours(), prev.endDate.getMinutes())
                      
                      return { ...prev, startDate: newStart, endDate: newEnd }
                    })
                  }}
                  dateFormat="dd/MM/yyyy"
                  minDate={new Date(new Date().setHours(0, 0, 0, 0))}
                  maxDate={bookingData.startDate ? addDays(bookingData.startDate, 10) : null}
                  isClearable={true}
                  className="w-full border-b border-slate-100 p-2 pl-8 font-black uppercase text-[12px] focus:border-primary outline-none transition-all cursor-pointer"
                  wrapperClassName="w-full"
                  popperProps={{ strategy: "fixed" }}
                />
                <HiCalendar className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-primary transition-colors" />
              </div>
            </div>

            {/* Receive Time */}
            <div className="space-y-1 relative">
              <label className="text-[12px] font-black text-primary uppercase tracking-widest ml-1">Receive Time</label>
              <div className="relative group">
                <DatePicker
                  selected={bookingData.startDate}
                  onChange={time => {
                    const updated = new Date(bookingData.startDate)
                    updated.setHours(time.getHours(), time.getMinutes())
                    setBookingData({ ...bookingData, startDate: updated })
                  }}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={30}
                  timeCaption="Time"
                  dateFormat="h:mm aa"
                  minTime={new Date(new Date().setHours(0, 0, 0, 0))}
                  maxTime={new Date(new Date().setHours(23, 30, 0, 0))}
                  className="w-full border-b border-slate-100 p-2 pl-8 font-black uppercase text-[12px] focus:border-primary outline-none transition-all cursor-pointer"
                  wrapperClassName="w-full"
                  popperProps={{ strategy: "fixed" }}
                />
                <HiClock className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-primary transition-colors" />
              </div>
            </div>

            {/* Return Time */}
            <div className="space-y-1 relative">
              <label className="text-[12px] font-black text-primary uppercase tracking-widest ml-1">Return Time</label>
              <div className="relative group">
                <DatePicker
                  selected={bookingData.endDate}
                  onChange={time => {
                    const updated = new Date(bookingData.endDate)
                    updated.setHours(time.getHours(), time.getMinutes())
                    setBookingData({ ...bookingData, endDate: updated })
                  }}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={30}
                  timeCaption="Time"
                  dateFormat="h:mm aa"
                  minTime={new Date(new Date().setHours(0, 0, 0, 0))}
                  maxTime={new Date(new Date().setHours(23, 30, 0, 0))}
                  className="w-full border-b border-slate-100 p-2 pl-8 font-black uppercase text-[12px] focus:border-primary outline-none transition-all cursor-pointer"
                  wrapperClassName="w-full"
                  popperProps={{ strategy: "fixed" }}
                />
                <HiClock className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-primary transition-colors" />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
            <div>
              <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">Rental Duration</p>
              <p className="text-[12px] font-black text-brand-navy uppercase">
                {duration} Day(s)
              </p>
            </div>
            <div className="text-right">
              <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">Estimated Total</p>
              <p className="text-[18px] font-black text-primary">
                ₹{(duration * totalPerDay).toLocaleString()}
              </p>
            </div>
          </div>

          <button type="submit" className="w-full bg-brand-navy text-white p-5 rounded-xl font-black text-[14px] uppercase tracking-widest hover:bg-primary transition-all shadow-lg shadow-orange-100 mt-4">
            Submit Request
          </button>
        </form>
      </div>
    </div>
  )
}

export default BookingModal
