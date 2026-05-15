import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { HiShoppingCart, HiCalendar, HiClock } from 'react-icons/hi'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import { differenceInDays, addDays } from 'date-fns'
import { useGlobal } from '../context/GlobalContext'
import toast from 'react-hot-toast'

const HERO_SLIDES = [
  {
    image: '/images/hero1.png',
    title: 'Professional Cinema Gear',
    subtitle: 'Rent the best cameras for your next big project.'
  },
  {
    image: '/images/hero2.png',
    title: 'Master-Class Optics',
    subtitle: 'Ultra-sharp lenses for every cinematic perspective.'
  },
  {
    image: '/images/hero3.png',
    title: 'Studio Lighting Kits',
    subtitle: 'Shape your story with professional grade lighting.'
  }
]

const LandingPage = ({ setAuthMode, setShowBookingModal }) => {
  const { products, user, addToCart, rentalDates, setRentalDates } = useGlobal()
  const [currentSlide, setCurrentSlide] = useState(0)
  // Local state for the picker to allow natural range selection behavior
  const [selection, setSelection] = useState({ from: rentalDates.from, to: rentalDates.to })

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const handleDateChange = (dates) => {
    const [start, end] = dates
    setSelection({ from: start, to: end })
    
    if (start && end) {
      const days = differenceInDays(end, start)
      if (days > 10) {
        toast.error('Rental period cannot exceed 10 days')
        setSelection({ from: start, to: null })
        return
      }
      
      const newFrom = new Date(start)
      const newTo = new Date(end)
      if (rentalDates.from) newFrom.setHours(rentalDates.from.getHours(), rentalDates.from.getMinutes())
      if (rentalDates.to) newTo.setHours(rentalDates.to.getHours(), rentalDates.to.getMinutes())
      
      setRentalDates({ from: newFrom, to: newTo })
    }
  }

  const handleTimeChange = (type, time) => {
    const newDates = { ...rentalDates }
    if (type === 'from' && newDates.from) {
      const updated = new Date(newDates.from)
      updated.setHours(time.getHours(), time.getMinutes())
      newDates.from = updated
    } else if (type === 'to' && newDates.to) {
      const updated = new Date(newDates.to)
      updated.setHours(time.getHours(), time.getMinutes())
      newDates.to = updated
    }
    setRentalDates(newDates)
  }

  const handleDateSubmit = (e) => {
    e.preventDefault()
    if (rentalDates.from && rentalDates.to) {
      document.getElementById('inventory').scrollIntoView({ behavior: 'smooth' })
    } else {
      toast.error('Please select a date range')
    }
  }

  return (
    <>
      <div 
        className="relative h-[400px] overflow-hidden bg-slate-900" 
        style={{ cursor: 'url(/camera-cursor.png) 16 16, auto' }}
      >
        {HERO_SLIDES.map((slide, index) => (
          <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute inset-0 bg-black/40 z-10"></div>
            <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-8">
              <h2 className="text-[46px] font-black text-white mb-2 animate-in fade-in slide-in-from-bottom-8 duration-700 uppercase tracking-widest">{slide.title}</h2>
              <p className="text-[22px] text-indigo-100 max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 font-medium">{slide.subtitle}</p>
              <button onClick={() => document.getElementById('search-bar').scrollIntoView({ behavior: 'smooth' })} className="mt-6 bg-white text-[#03045e] px-8 py-3 font-black text-[12px] hover:bg-[#5e60ce] hover:text-white transition-all transform hover:-translate-y-1 rounded-xl uppercase tracking-widest">Start Rental</button>
            </div>
          </div>
        ))}
      </div>

      {/* Date Search Bar */}
      <div id="search-bar" className="bg-white border-b border-slate-100 sticky top-[60px] z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            {/* Date Range Picker */}
            <div className="relative w-full">
              <label className="text-[9px] font-black text-[#5e60ce] uppercase tracking-widest ml-1 absolute -top-2.5 left-4 bg-white px-2 z-10 border border-slate-100 rounded-full">Rental Dates (Max 10 Days)</label>
              <div className="relative group">
                <DatePicker
                  selectsRange={true}
                  startDate={selection.from}
                  endDate={selection.to}
                  onChange={handleDateChange}
                  dateFormat="MMM d, yyyy"
                  minDate={new Date(new Date().setHours(0, 0, 0, 0))}
                  isClearable={true}
                  className="w-full bg-white border border-slate-200 p-4 pl-12 rounded-xl font-black text-[12px] focus:border-[#5e60ce] outline-none transition-all uppercase cursor-pointer shadow-sm group-hover:border-indigo-300"
                  placeholderText="Select Date Range"
                  wrapperClassName="w-full"
                />
                <HiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[#5e60ce]" />
              </div>
            </div>

            {/* Receive Time */}
            <div className="relative w-full">
              <label className="text-[9px] font-black text-[#5e60ce] uppercase tracking-widest ml-1 absolute -top-2.5 left-4 bg-white px-2 z-10 border border-slate-100 rounded-full">Receive Time</label>
              <div className="relative group">
                <DatePicker
                  selected={rentalDates.from}
                  onChange={(time) => handleTimeChange('from', time)}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={30}
                  timeCaption="Time"
                  dateFormat="h:mm aa"
                  minTime={
                    rentalDates.from && rentalDates.from.toDateString() === new Date().toDateString()
                      ? new Date()
                      : new Date(new Date().setHours(0, 0, 0, 0))
                  }
                  maxTime={new Date(new Date().setHours(23, 30, 0, 0))}
                  className="w-full bg-white border border-slate-200 p-4 pl-12 rounded-xl font-black text-[12px] focus:border-[#5e60ce] outline-none transition-all uppercase cursor-pointer shadow-sm group-hover:border-indigo-300"
                  wrapperClassName="w-full"
                />
                <HiClock className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[#5e60ce]" />
              </div>
            </div>

            {/* Return Time */}
            <div className="relative w-full">
              <label className="text-[9px] font-black text-[#5e60ce] uppercase tracking-widest ml-1 absolute -top-2.5 left-4 bg-white px-2 z-10 border border-slate-100 rounded-full">Return Time</label>
              <div className="relative group">
                <DatePicker
                  selected={rentalDates.to}
                  onChange={(time) => handleTimeChange('to', time)}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={30}
                  timeCaption="Time"
                  dateFormat="h:mm aa"
                  minTime={
                    rentalDates.to && rentalDates.from && rentalDates.to.toDateString() === rentalDates.from.toDateString()
                      ? rentalDates.from
                      : new Date(new Date().setHours(0, 0, 0, 0))
                  }
                  maxTime={new Date(new Date().setHours(23, 30, 0, 0))}
                  className="w-full bg-white border border-slate-200 p-4 pl-12 rounded-xl font-black text-[12px] focus:border-[#5e60ce] outline-none transition-all uppercase cursor-pointer shadow-sm group-hover:border-indigo-300"
                  wrapperClassName="w-full"
                />
                <HiClock className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[#5e60ce]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-10 min-h-[400px]" id="inventory">
        {rentalDates.from && rentalDates.to ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 border-l-4 border-[#5e60ce] pl-4 flex justify-between items-end">
              <div>
                <p className="text-[#00b4d8] font-black uppercase tracking-[0.3em] text-[8px] mb-1">Available Gear for Selected Dates</p>
                <h2 className="text-[16px] font-black text-[#03045e] uppercase tracking-widest">Inventory</h2>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Selected Window</p>
                <p className="text-[10px] text-[#5e60ce] font-black uppercase">
                  {rentalDates.from.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} 
                  <span className="mx-2 text-slate-300">►</span>
                  {rentalDates.to.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map(product => (
                <div key={product._id} className="bg-white border border-slate-100 shadow-xl hover:shadow-indigo-100/50 transition-all group overflow-hidden rounded-3xl">
                  <Link to={`/product/${product._id}`} className="h-48 relative block overflow-hidden bg-slate-900">
                    <img src={product.imageUrl || 'https://via.placeholder.com/600'} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />
                    <div className="absolute bottom-0 left-0 bg-[#03045e] text-white p-2.5 font-black text-[14px] rounded-tr-2xl">
                      ₹{product.pricePerDay}<span className="text-[8px] uppercase opacity-60 tracking-widest block font-bold">Per Day</span>
                    </div>
                  </Link>
                  <div className="p-5 flex flex-col h-[150px]">
                    <Link to={`/product/${product._id}`} className="hover:text-[#5e60ce] transition-colors">
                      <h3 className="text-[14px] font-black text-[#03045e] mb-1 uppercase tracking-tight line-clamp-1">{product.name}</h3>
                    </Link>
                    <p className="text-slate-400 line-clamp-2 text-[12px] font-medium leading-relaxed">{product.description}</p>
                    <div className="flex mt-auto border-t border-slate-50 pt-1 gap-2">
                      {(!user || user.role !== 'admin') && (
                        <button onClick={() => addToCart(product)} className="flex-1 bg-slate-50 text-slate-400 p-2 rounded-xl font-black text-[8px] uppercase tracking-widest hover:bg-[#03045e] hover:text-white transition-all flex items-center justify-center space-x-1">
                          <HiShoppingCart className="text-sm" /> <span>Cart</span>
                        </button>
                      )}
                      <button onClick={() => setShowBookingModal(product)} className="flex-1 bg-gradient-to-r from-[#03045e] to-[#5e60ce] text-white p-2 rounded-xl font-black text-[8px] uppercase tracking-widest hover:shadow-lg transition-all">Rent Now</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-pulse">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <HiCalendar className="text-4xl text-slate-200" />
            </div>
            <h3 className="text-[14px] font-black text-slate-300 uppercase tracking-widest">Select dates above to view available gear</h3>
            <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest">We need to check our inventory for your specific dates</p>
          </div>
        )}
      </div>
    </>
  )
}

export default LandingPage
