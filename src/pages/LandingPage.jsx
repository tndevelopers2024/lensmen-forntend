import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  HiOutlineShoppingCart, HiOutlineCalendar, HiOutlineClock,
  HiOutlineSearch, HiArrowRight, HiArrowNarrowRight,
} from 'react-icons/hi'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import { differenceInDays, addDays } from 'date-fns'
import { useGlobal } from '../context/GlobalContext'
import toast from 'react-hot-toast'

const NAVY = '#1e1b4b'

const HERO_SLIDES = [
  { image: '/images/hero1.png', title: 'Professional Cinema Gear',  subtitle: 'Rent the best cameras for your next big project.' },
  { image: '/images/hero2.png', title: 'Master-Class Optics',       subtitle: 'Ultra-sharp lenses for every cinematic perspective.' },
  { image: '/images/hero3.png', title: 'Studio Lighting Kits',      subtitle: 'Shape your story with professional-grade lighting.' },
]

const LandingPage = ({ setShowBookingModal }) => {
  const { products, user, addToCart, rentalDates, setRentalDates, categories, setAuthMode } = useGlobal()
  const [searchParams]      = useSearchParams()
  const [currentSlide,      setCurrentSlide]      = useState(0)
  const [selection,         setSelection]         = useState({ from: null, to: null })
  const [selectedCategory,  setSelectedCategory]  = useState('All')
  const [datesConfirmed,    setDatesConfirmed]     = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide(prev => (prev + 1) % HERO_SLIDES.length), 5000)
    return () => clearInterval(timer)
  }, [])

  // Sync selected category from the URL (?category=...) set by the nav/footer
  useEffect(() => {
    const cat = searchParams.get('category')
    setSelectedCategory(cat || 'All')
  }, [searchParams])

  const allCategories = ['All', ...categories]

  const filteredProducts = products.filter(p => {
    const categoryMatch = selectedCategory === 'All' || p.category === selectedCategory
    return categoryMatch
  })

  const handleDateChange = (dates) => {
    const [start, end] = dates
    setDatesConfirmed(false)
    setSelection({ from: start, to: end })
    if (start && end) {
      if (differenceInDays(end, start) > 10) {
        toast.error('Rental period cannot exceed 10 days')
        setSelection({ from: start, to: null })
        return
      }
      const newFrom = new Date(start)
      const newTo   = new Date(end)
      if (rentalDates.from) newFrom.setHours(rentalDates.from.getHours(), rentalDates.from.getMinutes())
      if (rentalDates.to)   newTo.setHours(rentalDates.to.getHours(),   rentalDates.to.getMinutes())
      setRentalDates({ from: newFrom, to: newTo })
    }
  }

  const handleTimeChange = (type, time) => {
    const updated = { ...rentalDates }
    if (type === 'from' && updated.from) {
      const d = new Date(updated.from); d.setHours(time.getHours(), time.getMinutes()); updated.from = d
    } else if (type === 'to' && updated.to) {
      const d = new Date(updated.to); d.setHours(time.getHours(), time.getMinutes()); updated.to = d
    }
    setRentalDates(updated)
  }

  const handleCheck = (e) => {
    e.preventDefault()
    if (rentalDates.from && rentalDates.to) {
      setDatesConfirmed(true)
      document.getElementById('inventory').scrollIntoView({ behavior: 'smooth' })
    } else {
      toast.error('Please select a date range first')
    }
  }

  const clearDates = () => {
    setSelection({ from: null, to: null })
    setRentalDates({ from: null, to: null })
    setDatesConfirmed(false)
  }

  const inputCls = "w-full bg-white border border-slate-200 py-3 pl-10 pr-3 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-all cursor-pointer"

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────── */}
      <div className="relative h-[520px] overflow-hidden bg-slate-900">
        {HERO_SLIDES.map((slide, i) => (
          <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${i === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
            <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-900/40 to-transparent" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <p className="text-slate-300/80 text-xs tracking-[0.25em] uppercase font-medium mb-5">
                Lensmen Rentals
              </p>
              <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight max-w-3xl mb-4">
                {slide.title}
              </h1>
              <p className="text-slate-300 text-lg max-w-md mb-8">
                {slide.subtitle}
              </p>
              <button
                onClick={() => document.getElementById('inventory').scrollIntoView({ behavior: 'smooth' })}
                className="bg-white text-slate-900 px-7 py-3 rounded-xl font-semibold text-sm hover:bg-slate-100 transition-all flex items-center gap-2 group"
              >
                Browse Equipment
                <HiArrowNarrowRight className="group-hover:translate-x-1 transition-transform text-base" />
              </button>
            </div>
          </div>
        ))}
        {/* Slide dots */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-1 rounded-full transition-all ${i === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/30 hover:bg-white/60'}`}
            />
          ))}
        </div>
      </div>

      {/* ── Availability checker ────────────────────────────────────── */}
      <div id="search-bar" className="max-w-5xl mx-auto px-6 -mt-10 relative z-20">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Check Availability</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-slate-500 font-medium block mb-1">Rental Dates</label>
              <div className="relative">
                <DatePicker
                  selectsRange startDate={selection.from} endDate={selection.to}
                  onChange={handleDateChange} dateFormat="MMM d, yyyy"
                  minDate={new Date(new Date().setHours(0,0,0,0))}
                  maxDate={selection.from ? addDays(selection.from, 10) : null}
                  isClearable placeholderText="Pick date range"
                  className={inputCls} wrapperClassName="w-full"
                />
                <HiOutlineCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium block mb-1">Pickup Time</label>
              <div className="relative">
                <DatePicker
                  selected={rentalDates.from} onChange={t => handleTimeChange('from', t)}
                  showTimeSelect showTimeSelectOnly timeIntervals={30} timeCaption="Time" dateFormat="h:mm aa"
                  minTime={rentalDates.from && rentalDates.from.toDateString() === new Date().toDateString() ? new Date() : new Date(new Date().setHours(0,0,0,0))}
                  maxTime={new Date(new Date().setHours(23,30,0,0))}
                  className={inputCls} wrapperClassName="w-full"
                />
                <HiOutlineClock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium block mb-1">Return Time</label>
              <div className="relative">
                <DatePicker
                  selected={rentalDates.to} onChange={t => handleTimeChange('to', t)}
                  showTimeSelect showTimeSelectOnly timeIntervals={30} timeCaption="Time" dateFormat="h:mm aa"
                  minTime={rentalDates.to && rentalDates.from && rentalDates.to.toDateString() === rentalDates.from.toDateString() ? rentalDates.from : new Date(new Date().setHours(0,0,0,0))}
                  maxTime={new Date(new Date().setHours(23,30,0,0))}
                  className={inputCls} wrapperClassName="w-full"
                />
                <HiOutlineClock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none" />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleCheck}
                className="w-full bg-slate-900 text-white h-[46px] rounded-xl font-semibold text-sm hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
              >
                <HiOutlineSearch className="text-base" />
                Check
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Product catalogue ───────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 pt-14 pb-16" id="inventory">

        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold text-slate-400 tracking-widest uppercase mb-1">Our Fleet</p>
            <h2 className="text-2xl font-bold text-slate-900">Browse Equipment</h2>
          </div>
          {datesConfirmed && rentalDates.from && rentalDates.to && (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5">
              <div className="text-sm font-medium text-slate-700">
                {rentalDates.from.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                {' '}&rarr;{' '}
                {rentalDates.to.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
              </div>
              <button onClick={clearDates} className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2">
                clear
              </button>
            </div>
          )}
        </div>

        {/* Category pills */}
        {allCategories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {allCategories.map(cat => {
              const active = selectedCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    active
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700'
                  }`}
                >
                  {cat}
                  {active && (
                    <span className="ml-2 text-xs opacity-60">
                      {cat === 'All' ? products.length : products.filter(p => p.category === cat).length}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map(product => {
              const soldOut = !product.isAvailable || (product.availableQuantity ?? 0) <= 0
              return (
              <div
                key={product._id}
                className="group bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
              >
                {/* Image */}
                <Link to={`/product/${product._id}`} className="relative block h-48 bg-slate-50 overflow-hidden">
                  <img
                    src={product.imageUrl || ''}
                    alt={product.name}
                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-400 ${soldOut ? 'grayscale opacity-70' : ''}`}
                  />
                  {soldOut && (
                    <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center">
                      <span className="bg-red-500 text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg -rotate-6">
                        Sold Out
                      </span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-white rounded-lg px-2.5 py-1.5 shadow-sm">
                    <span className="font-bold text-slate-900 text-sm">₹{product.pricePerDay?.toLocaleString()}</span>
                    <span className="text-slate-400 text-[10px] ml-0.5">/day</span>
                  </div>
                  {!soldOut && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white rounded-full pl-2 pr-2.5 py-1 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-[10px] font-semibold text-emerald-700">
                        {(product.availableQuantity ?? 1) <= 2
                          ? `${product.availableQuantity} left`
                          : 'Available'}
                      </span>
                    </div>
                  )}
                </Link>

                {/* Body */}
                <div className="p-4 flex flex-col flex-1">
                  <Link
                    to={`/product/${product._id}`}
                    className="font-semibold text-[15px] text-slate-900 hover:text-slate-600 transition-colors line-clamp-1 mb-1"
                  >
                    {product.name}
                  </Link>
                  {product.category && (
                    <span className="self-start text-[11px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md mb-2">
                      {product.category}
                    </span>
                  )}
                  <p className="text-slate-400 text-[13px] leading-relaxed line-clamp-2 mb-4 flex-1">
                    {product.description}
                  </p>
                  <div className="flex gap-2">
                    {soldOut ? (
                      <button
                        disabled
                        className="flex-1 bg-slate-100 text-slate-400 py-2 rounded-xl text-[13px] font-medium cursor-not-allowed"
                      >
                        Currently Unavailable
                      </button>
                    ) : (
                      <>
                        {(!user || user.role !== 'admin') && (
                          <button
                            onClick={() => addToCart(product)}
                            className="flex-1 border border-slate-200 text-slate-500 py-2 rounded-xl text-[13px] font-medium hover:border-slate-400 hover:text-slate-700 transition-all flex items-center justify-center gap-1.5"
                          >
                            <HiOutlineShoppingCart className="text-sm" /> Cart
                          </button>
                        )}
                        <button
                          onClick={() => user ? setShowBookingModal(product) : setAuthMode('login')}
                          className="flex-1 bg-slate-900 text-white py-2 rounded-xl text-[13px] font-medium hover:bg-slate-700 transition-all"
                        >
                          Rent Now
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )})}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-slate-200">
            <HiOutlineSearch className="text-4xl text-slate-200 mb-4" />
            <p className="text-base font-semibold text-slate-500">No gear in this category</p>
            <button
              onClick={() => setSelectedCategory('All')}
              className="mt-3 text-slate-500 font-medium text-sm hover:text-slate-800 underline underline-offset-2"
            >
              Show all
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default LandingPage
