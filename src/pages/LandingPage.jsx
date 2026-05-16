import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { HiShoppingCart, HiCalendar, HiClock, HiSearch } from 'react-icons/hi'
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
  const { products, user, addToCart, rentalDates, setRentalDates, categories } = useGlobal()
  const [currentSlide, setCurrentSlide] = useState(0)
  // Local state for the picker to allow natural range selection behavior
  const [selection, setSelection] = useState({ from: rentalDates.from, to: rentalDates.to })
  
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [maxPrice, setMaxPrice] = useState(10000)

  useEffect(() => {
    if (products.length > 0) {
      const highest = Math.max(...products.map(p => p.pricePerDay))
      setMaxPrice(highest)
    }
  }, [products])

  const allCategories = ['All', ...categories]
  
  const filteredProducts = products.filter(p => {
    const categoryMatch = selectedCategory === 'All' || p.category === selectedCategory
    const priceMatch = (p.pricePerDay || 0) <= maxPrice
    return categoryMatch && priceMatch
  })

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
              <p className="text-[22px] text-orange-100 max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 font-medium">{slide.subtitle}</p>
              <button onClick={() => document.getElementById('search-bar').scrollIntoView({ behavior: 'smooth' })} className="mt-6 bg-white text-brand-navy px-8 py-3 font-black text-[12px] hover:bg-primary hover:text-white transition-all transform hover:-translate-y-1 rounded-xl uppercase tracking-widest">Start Rental</button>
            </div>
          </div>
        ))}
      </div>

      {/* Date Search Bar */}
      {/* Equipment Availability Heading - Static */}
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
        <div className="text-center">
          <h2 className="text-[24px] font-black text-brand-navy uppercase tracking-[0.2em]">Equipment Availability</h2>
          <p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest mt-2">Select your production dates to find the best gear</p>
        </div>
      </div>

      {/* Sticky Compact Search Bar */}
      <div id="search-bar" className="bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-[60px] z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="grid grid-cols-1 md:grid-cols-4 items-end gap-3 bg-white p-3 rounded-2xl border border-slate-100">
            {/* Date Range Picker */}
            <div className="relative w-full">
              <label className="text-[12px] font-black text-primary uppercase tracking-widest ml-1 absolute -top-2.5 left-4 bg-white px-2 z-10 border border-slate-100 rounded-full">Rental Dates (Max 10 Days)</label>
              <div className="relative group">
                <DatePicker
                  selectsRange={true}
                  startDate={selection.from}
                  endDate={selection.to}
                  onChange={handleDateChange}
                  dateFormat="MMM d, yyyy"
                  minDate={new Date(new Date().setHours(0, 0, 0, 0))}
                  maxDate={selection.from ? addDays(selection.from, 10) : null}
                  isClearable={true}
                  className="w-full bg-white border border-slate-200 p-4 pl-12 rounded-xl font-black text-[12px] focus:border-primary outline-none transition-all uppercase cursor-pointer shadow-sm group-hover:border-orange-200"
                  placeholderText="Select Date Range"
                  wrapperClassName="w-full"
                />
                <HiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-primary" />
              </div>
            </div>

            {/* Receive Time */}
            <div className="relative w-full">
              <label className="text-[12px] font-black text-primary uppercase tracking-widest ml-1 absolute -top-2.5 left-4 bg-white px-2 z-10 border border-slate-100 rounded-full">Receive Time</label>
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
                  className="w-full bg-white border border-slate-200 p-4 pl-12 rounded-xl font-black text-[12px] focus:border-primary outline-none transition-all uppercase cursor-pointer shadow-sm group-hover:border-orange-200"
                  wrapperClassName="w-full"
                />
                <HiClock className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-primary" />
              </div>
            </div>

            {/* Return Time */}
            <div className="relative w-full">
              <label className="text-[12px] font-black text-primary uppercase tracking-widest ml-1 absolute -top-2.5 left-4 bg-white px-2 z-10 border border-slate-100 rounded-full">Return Time</label>
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
                  className="w-full bg-white border border-slate-200 p-4 pl-12 rounded-xl font-black text-[12px] focus:border-primary outline-none transition-all uppercase cursor-pointer shadow-sm group-hover:border-orange-200"
                  wrapperClassName="w-full"
                />
                <HiClock className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-primary" />
              </div>
            </div>

            {/* Check Availability Button */}
            <button 
              onClick={handleDateSubmit}
              className="w-full bg-primary text-white h-[48px] rounded-xl font-black text-[12px] uppercase tracking-widest hover:shadow-lg transition-all active:scale-95 flex items-center justify-center space-x-2"
            >
              <HiSearch className="text-lg" />
              <span className="hidden lg:inline">Check Availability</span>
              <span className="lg:hidden">Search</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-10 min-h-[400px]" id="inventory">
        {rentalDates.from && rentalDates.to ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 border-l-4 border-primary pl-4 flex justify-between items-end">
              <div>
                <p className="text-primary/60 font-black uppercase tracking-[0.3em] text-[12px] mb-1">Available Products for Selected Dates</p>
                <h2 className="text-[16px] font-black text-brand-navy uppercase tracking-widest">Inventory</h2>
              </div>
              <div className="text-right">
                <p className="text-[12px] text-slate-400 font-black uppercase tracking-widest">Selected Window</p>
                <p className="text-[12px] text-primary font-black uppercase">
                  {rentalDates.from.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} 
                  <span className="mx-2 text-slate-300">►</span>
                  {rentalDates.to.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Sidebar Filters */}
              <div className="lg:col-span-1 space-y-8 sticky top-42 self-start">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50">
                  <h3 className="text-[14px] font-black text-brand-navy uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Categories</h3>
                  <div className="space-y-2">
                    {allCategories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl text-[12px] font-black uppercase tracking-wider transition-all ${
                          selectedCategory === cat 
                          ? 'bg-primary text-white shadow-lg shadow-orange-100' 
                          : 'text-slate-400 hover:bg-slate-50 hover:text-brand-navy'
                        }`}
                      >
                        <span>{cat}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg ${selectedCategory === cat ? 'bg-white/20' : 'bg-slate-100'}`}>
                          {cat === 'All' ? products.length : products.filter(p => p.category === cat).length}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50">
                  <div className="flex items-center justify-between mb-6 border-b border-slate-50 pb-4">
                    <h3 className="text-[14px] font-black text-brand-navy uppercase tracking-widest">Price Limit</h3>
                    <span className="text-primary font-black text-[14px]">₹{maxPrice}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={products.length > 0 ? Math.max(...products.map(p => p.pricePerDay)) : 10000}
                    step="100"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between mt-2 text-[10px] text-slate-300 font-black uppercase tracking-widest">
                    <span>Min</span>
                    <span>Max</span>
                  </div>
                </div>
              </div>

              {/* Product Grid */}
              <div className="lg:col-span-3">
                {filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map(product => (
                      <div key={product._id} className="bg-white border border-slate-100 shadow-xl hover:shadow-orange-100/50 transition-all group overflow-hidden rounded-3xl">
                        <Link to={`/product/${product._id}`} className="h-48 relative block overflow-hidden bg-slate-900">
                          <img src={product.imageUrl || 'https://via.placeholder.com/600'} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />
                          <div className="absolute bottom-0 left-0 bg-brand-navy text-white p-2.5 font-black text-[14px] rounded-tr-2xl">
                            ₹{product.pricePerDay}<span className="text-[12px] uppercase opacity-60 tracking-widest block font-bold">Per Day</span>
                          </div>
                        </Link>
                        <div className="p-5 flex flex-col h-[150px]">
                          <Link to={`/product/${product._id}`} className="hover:text-primary transition-colors">
                            <h3 className="text-[14px] font-black text-brand-navy mb-1 uppercase tracking-tight line-clamp-1">{product.name}</h3>
                          </Link>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-[9px] font-black bg-slate-100 text-slate-400 px-2 py-0.5 rounded uppercase tracking-widest">{product.category || 'Gear'}</span>
                          </div>
                          <p className="text-slate-400 line-clamp-2 text-[12px] font-medium leading-relaxed">{product.description}</p>
                          <div className="flex mt-auto border-t border-slate-50 pt-1 gap-2">
                            {(!user || user.role !== 'admin') && (
                              <button onClick={() => addToCart(product)} className="flex-1 bg-slate-50 text-slate-400 p-2 rounded-xl font-black text-[12px] uppercase tracking-widest hover:bg-brand-navy hover:text-white transition-all flex items-center justify-center space-x-1">
                                <HiShoppingCart className="text-sm" /> <span>Cart</span>
                              </button>
                            )}
                            <button onClick={() => setShowBookingModal(product)} className="flex-1 bg-primary text-white p-2 rounded-xl font-black text-[12px] uppercase tracking-widest hover:shadow-lg transition-all">Rent Now</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                    <HiSearch className="text-4xl text-slate-200 mb-4" />
                    <p className="text-[14px] font-black text-slate-400 uppercase tracking-widest">No gear matches your filters</p>
                    <button onClick={() => { setSelectedCategory('All'); setMaxPrice(10000); }} className="mt-4 text-primary font-black text-[12px] uppercase hover:underline">Clear all filters</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-pulse">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <HiCalendar className="text-4xl text-slate-200" />
            </div>
            <h3 className="text-[14px] font-black text-slate-300 uppercase tracking-widest">Select dates above to view available gear</h3>
            <p className="text-[12px] text-slate-400 mt-2 uppercase tracking-widest">We need to check our inventory for your specific dates</p>
          </div>
        )}
      </div>
    </>
  )
}

export default LandingPage
