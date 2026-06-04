import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { differenceInDays, addDays, eachDayOfInterval, format } from 'date-fns'
import toast from 'react-hot-toast'
import {
  HiOutlineShoppingCart, HiArrowLeft, HiOutlineCheckCircle,
  HiOutlineClock, HiOutlineShieldCheck, HiOutlineInformationCircle,
  HiOutlineCalendar, HiArrowRight,
} from 'react-icons/hi'
import { useGlobal } from '../context/GlobalContext'

// ── Time select options 7 AM → 10 PM every 30 min ──────────────────────
const TIME_OPTIONS = Array.from({ length: 31 }, (_, i) => {
  const mins  = 7 * 60 + i * 30
  const h     = Math.floor(mins / 60)
  const m     = mins % 60
  const value = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
  const ampm  = h < 12 ? 'AM' : 'PM'
  const dh    = h > 12 ? h - 12 : h === 0 ? 12 : h
  return { value, label: `${dh}:${String(m).padStart(2,'0')} ${ampm}` }
})

// ── Booking calendar + time card ────────────────────────────────────────
const BookingCard = ({ product, setShowBookingModal }) => {
  const { API_URL, setRentalDates, setRentalQty, user, addToCart, setAuthMode } = useGlobal()
  const [ranges,     setRanges]     = useState([])
  const [startDate,  setStartDate]  = useState(null)
  const [endDate,    setEndDate]    = useState(null)
  const [pickupTime, setPickupTime] = useState('10:00')
  const [returnTime, setReturnTime] = useState('18:00')
  const [qty, setQty] = useState(1)

  const maxQty  = product.availableQuantity ?? (product.isAvailable ? 1 : 0)
  const soldOut = maxQty <= 0

  useEffect(() => {
    fetch(`${API_URL}/bookings/product/${product._id}`)
      .then(r => r.json())
      .then(d => setRanges(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [product._id])

  const blockedDates = useMemo(() =>
    ranges.flatMap(b => {
      try { return eachDayOfInterval({ start: new Date(b.startDate), end: new Date(b.endDate) }) }
      catch { return [] }
    }), [ranges])

  const days  = startDate && endDate ? Math.max(1, differenceInDays(endDate, startDate) + 1) : 0
  const total = days * product.pricePerDay * qty

  const applyTimesToDates = () => {
    const [ph, pm] = pickupTime.split(':').map(Number)
    const [rh, rm] = returnTime.split(':').map(Number)
    const start = new Date(startDate); start.setHours(ph, pm, 0, 0)
    const end   = new Date(endDate || startDate); end.setHours(rh, rm, 0, 0)
    return { start, end }
  }

  const handleBook = () => {
    if (!user) { setAuthMode('login'); return }
    if (!startDate) { toast.error('Please select your rental dates'); return }
    const { start, end } = applyTimesToDates()
    setRentalDates({ from: start, to: end })
    setRentalQty(qty)
    setShowBookingModal(product)
  }

  const handleCart = () => {
    if (startDate && endDate) {
      const { start, end } = applyTimesToDates()
      setRentalDates({ from: start, to: end })
    }
    addToCart(product)
  }

  return (
    <>
      {/* Scoped calendar styles */}
      <style>{`
        .bk-cal .react-datepicker { border:none!important; font-family:inherit!important; width:100%!important; background:transparent!important; box-shadow:none!important; }
        .bk-cal .react-datepicker__month-container { width:100%!important; float:none!important; }
        .bk-cal .react-datepicker__header { background:transparent!important; border-bottom:1px solid #f1f5f9!important; padding:0 0 10px!important; }
        .bk-cal .react-datepicker__current-month { font-size:13px!important; font-weight:700!important; color:#1a1a2e!important; padding:10px 0 6px!important; }
        .bk-cal .react-datepicker__navigation { top:10px!important; }
        .bk-cal .react-datepicker__navigation-icon::before { border-color:#94a3b8!important; border-width:2px 2px 0 0!important; width:7px!important; height:7px!important; }
        .bk-cal .react-datepicker__day-names { display:flex!important; justify-content:space-around!important; margin:6px 0 0!important; }
        .bk-cal .react-datepicker__day-name { font-size:10px!important; font-weight:700!important; color:#94a3b8!important; width:2.2rem!important; line-height:2.2rem!important; text-align:center!important; }
        .bk-cal .react-datepicker__week { display:flex!important; justify-content:space-around!important; }
        .bk-cal .react-datepicker__day { width:2.2rem!important; height:2.2rem!important; line-height:2.2rem!important; font-size:12px!important; border-radius:50%!important; margin:2px 0!important; color:#374151!important; font-weight:500!important; transition:all .15s!important; }
        .bk-cal .react-datepicker__day:hover:not(.react-datepicker__day--excluded):not(.react-datepicker__day--disabled) { background:#fff7ed!important; color:#e5550f!important; }
        .bk-cal .react-datepicker__day--today:not(.react-datepicker__day--selected):not(.react-datepicker__day--in-range) { background:#1a1a2e!important; color:#fff!important; font-weight:700!important; border-radius:50%!important; }
        .bk-cal .react-datepicker__day--in-selecting-range { background:#fff7ed!important; color:#e5550f!important; border-radius:0!important; }
        .bk-cal .react-datepicker__day--in-range:not(.react-datepicker__day--range-start):not(.react-datepicker__day--range-end) { background:#fff7ed!important; color:#c2410c!important; border-radius:0!important; }
        .bk-cal .react-datepicker__day--range-start,.bk-cal .react-datepicker__day--selecting-range-start { background:#e5550f!important; color:#fff!important; font-weight:700!important; border-radius:50% 0 0 50%!important; }
        .bk-cal .react-datepicker__day--range-end,.bk-cal .react-datepicker__day--selecting-range-end { background:#e5550f!important; color:#fff!important; font-weight:700!important; border-radius:0 50% 50% 0!important; }
        .bk-cal .react-datepicker__day--range-start.react-datepicker__day--range-end { border-radius:50%!important; }
        .bk-cal .react-datepicker__day--excluded { background:#fee2e2!important; color:#ef4444!important; text-decoration:line-through!important; cursor:not-allowed!important; opacity:.75!important; border-radius:50%!important; }
        .bk-cal .react-datepicker__day--disabled:not(.react-datepicker__day--excluded) { color:#d1d5db!important; cursor:not-allowed!important; }
      `}</style>

      {soldOut ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
            <HiOutlineCalendar className="text-2xl text-red-400" />
          </div>
          <p className="text-[15px] font-bold text-[#1a1a2e] mb-1">Currently Sold Out</p>
          <p className="text-[12px] text-slate-400 mb-4">All units are rented out right now. Check back soon or browse similar gear below.</p>
          <span className="inline-block bg-red-500 text-white text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-full">
            Out of Stock
          </span>
        </div>
      ) : (
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {/* Calendar header */}
        <div className="flex items-center gap-2 px-4 pt-4 pb-2">
          <HiOutlineCalendar className="text-primary text-base" />
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Select Rental Dates</span>
          {ranges.length > 0 && (
            <span className="ml-auto text-[10px] text-slate-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-300 inline-block" /> {ranges.length} booked
            </span>
          )}
        </div>

        {/* Inline calendar */}
        <div className="bk-cal px-3 pb-2">
          <DatePicker
            inline
            selectsRange
            startDate={startDate}
            endDate={endDate}
            onChange={([s, e]) => { setStartDate(s); setEndDate(e) }}
            minDate={new Date()}
            maxDate={startDate ? addDays(startDate, 10) : undefined}
            excludeDates={blockedDates}
          />
        </div>

        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
          {/* Time pickers */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Pickup Time</label>
              <select
                value={pickupTime}
                onChange={e => setPickupTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-[12px] font-semibold text-slate-700 outline-none focus:border-primary transition-colors"
              >
                {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Return Time</label>
              <select
                value={returnTime}
                onChange={e => setReturnTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-[12px] font-semibold text-slate-700 outline-none focus:border-primary transition-colors"
              >
                {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {/* Quantity stepper */}
          {maxQty > 1 && (
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quantity</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{maxQty} units available</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-1.5 py-1">
                <button
                  type="button"
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-sm transition-all text-lg font-bold leading-none disabled:opacity-30"
                  disabled={qty <= 1}
                >−</button>
                <span className="text-[15px] font-bold text-[#1a1a2e] min-w-[20px] text-center">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty(q => Math.min(maxQty, q + 1))}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-sm transition-all text-lg font-bold leading-none disabled:opacity-30"
                  disabled={qty >= maxQty}
                >+</button>
              </div>
            </div>
          )}

          {/* Rental summary */}
          {startDate && endDate ? (
            <div className="bg-orange-50 rounded-xl px-4 py-3 flex items-center justify-between border border-orange-100">
              <div>
                <p className="text-[11px] font-semibold text-slate-600">
                  {format(startDate, 'MMM d')} → {format(endDate, 'MMM d, yyyy')}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {qty > 1 ? `${qty} units × ` : ''}{days} day{days > 1 ? 's' : ''} × ₹{product.pricePerDay?.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Total</p>
                <p className="text-[18px] font-bold text-[#1a1a2e]">₹{total.toLocaleString()}</p>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 text-center py-1">
              {startDate ? 'Now select a return date' : 'Click a date to start your selection'}
            </p>
          )}

          {/* Action buttons */}
          {(!user || user.role !== 'admin') && (
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={handleCart}
                className="flex-1 border-2 border-slate-200 text-[#1a1a2e] py-3 rounded-xl font-semibold text-[13px] hover:border-[#1a1a2e] transition-all flex items-center justify-center gap-2"
              >
                <HiOutlineShoppingCart className="text-base" /> Cart
              </button>
              <button
                onClick={handleBook}
                className="flex-[2] bg-primary text-white py-3 rounded-xl font-bold text-[13px] hover:bg-primary-dark transition-all shadow-md shadow-orange-100"
              >
                {startDate ? 'Book Now' : 'Select Dates to Book'}
              </button>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#1a1a2e] inline-block" />
              <span className="text-[10px] text-slate-400">Today</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary inline-block" />
              <span className="text-[10px] text-slate-400">Selected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-300 inline-block" />
              <span className="text-[10px] text-slate-400">Booked</span>
            </div>
          </div>
        </div>
      </div>
      )}
    </>
  )
}

// ── Related products strip ──────────────────────────────────────────────
const RelatedProducts = ({ currentId, category, setShowBookingModal }) => {
  const { products, user, addToCart, setAuthMode } = useGlobal()
  const navigate = useNavigate()

  const related = products
    .filter(p => p._id !== currentId && p.category === category)
    .slice(0, 6)

  if (related.length === 0) return null

  return (
    <div className="mt-14">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">More from {category}</p>
          <h2 className="text-[18px] font-bold text-[#1a1a2e]">Related Equipment</h2>
        </div>
        <button onClick={() => navigate('/')} className="text-[12px] font-semibold text-primary hover:underline underline-offset-2 flex items-center gap-1">
          View all <HiArrowRight className="text-xs" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {related.map(p => {
          const pSoldOut = !p.isAvailable || (p.availableQuantity ?? 0) <= 0
          return (
          <div
            key={p._id}
            className="group bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col cursor-pointer"
            onClick={() => { navigate(`/product/${p._id}`); window.scrollTo(0, 0) }}
          >
            {/* Image */}
            <div className="relative aspect-square overflow-hidden bg-slate-50">
              <img
                src={p.imageUrl}
                alt={p.name}
                className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${pSoldOut ? 'grayscale opacity-70' : ''}`}
              />
              {pSoldOut ? (
                <div className="absolute inset-0 bg-slate-900/25 flex items-center justify-center">
                  <span className="bg-red-500 text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full -rotate-6">Sold Out</span>
                </div>
              ) : (
                <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-green-500" title="Available" />
              )}
            </div>

            {/* Info */}
            <div className="p-3 flex flex-col flex-1">
              <p className="text-[13px] font-semibold text-[#1a1a2e] line-clamp-1 mb-1">{p.name}</p>
              <p className="text-primary font-bold text-[13px] mt-auto">
                ₹{p.pricePerDay?.toLocaleString()}
                <span className="text-slate-400 font-normal text-[10px]"> /day</span>
              </p>

              {/* Quick actions */}
              <div className="flex gap-1.5 mt-2" onClick={e => e.stopPropagation()}>
                {pSoldOut ? (
                  <button disabled className="flex-1 bg-slate-100 text-slate-400 py-1.5 rounded-lg text-[11px] font-medium cursor-not-allowed">
                    Unavailable
                  </button>
                ) : (
                  <>
                    {(!user || user.role !== 'admin') && (
                      <button
                        onClick={() => addToCart(p)}
                        className="flex-1 border border-slate-200 text-slate-500 py-1.5 rounded-lg text-[11px] font-medium hover:border-[#1a1a2e] hover:text-[#1a1a2e] transition-all flex items-center justify-center"
                      >
                        <HiOutlineShoppingCart className="text-xs" />
                      </button>
                    )}
                    <button
                      onClick={() => user ? setShowBookingModal(p) : setAuthMode('login')}
                      className="flex-[2] bg-[#1a1a2e] text-white py-1.5 rounded-lg text-[11px] font-semibold hover:bg-primary transition-all"
                    >
                      Book
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )})}
      </div>
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────────────
const ProductDetails = ({ setShowBookingModal }) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { products, user } = useGlobal()

  const product   = products.find(p => p._id === id)
  const allImages = product ? [product.imageUrl, ...(product.galleryImages || [])].filter(Boolean) : []
  const [activeImg, setActiveImg] = useState(0)

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
          <HiOutlineInformationCircle className="text-3xl text-slate-300" />
        </div>
        <h2 className="text-xl font-bold text-[#1a1a2e]">Equipment not found</h2>
        <button onClick={() => navigate('/')} className="text-primary font-medium text-sm hover:underline">Return to catalog</button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <button onClick={() => navigate('/')} className="mb-6 inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors text-sm font-medium group">
        <div className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-primary transition-all">
          <HiArrowLeft className="text-xs" />
        </div>
        Back to catalog
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

        {/* ── LEFT: sticky image ── */}
        <div className="lg:sticky lg:top-30 space-y-3">
          {/* Hero */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden relative aspect-square">
            <img
              key={activeImg}
              src={allImages[activeImg] || product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover animate-in fade-in duration-300"
            />
            <span className={`absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm ${product.isAvailable ? 'bg-green-500/15 text-green-700' : 'bg-red-500/15 text-red-700'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${product.isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
              {product.isAvailable
                ? `${product.availableQuantity ?? 1} of ${product.totalQuantity ?? 1} available`
                : 'Fully booked'}
            </span>
            {allImages.length > 1 && (
              <span className="absolute bottom-3 right-3 bg-black/40 text-white text-[10px] font-semibold px-2 py-1 rounded-full backdrop-blur-sm">
                {activeImg + 1} / {allImages.length}
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="flex gap-2">
              {allImages.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${i === activeImg ? 'border-primary scale-105 shadow-md shadow-orange-100' : 'border-transparent opacity-60 hover:opacity-100 hover:border-slate-200'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: HiOutlineShieldCheck, color: '#E5550F', label: 'Insured' },
              { icon: HiOutlineClock,       color: '#3b82f6', label: '24/7 Support' },
              { icon: HiOutlineCheckCircle, color: '#16a34a', label: 'Verified' },
            ].map((f, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-xl p-3 flex flex-col items-center gap-1.5">
                <f.icon className="text-lg" style={{ color: f.color }} />
                <span className="text-[11px] font-medium text-slate-500">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: info ── */}
        <div className="space-y-5">
          {/* Title + price */}
          <div>
            <span className="text-[11px] font-bold text-primary tracking-[0.2em] uppercase">{product.category || 'Equipment'}</span>
            <h1 className="text-[26px] font-bold text-[#1a1a2e] leading-tight mt-1">{product.name}</h1>
            <div className="flex items-baseline gap-1.5 mt-3">
              <span className="text-primary font-bold text-base">₹</span>
              <span className="text-[36px] font-bold text-[#1a1a2e] tracking-tight leading-none">{product.pricePerDay?.toLocaleString()}</span>
              <span className="text-slate-400 text-sm font-medium ml-1">per day</span>
            </div>
          </div>

          {/* ── Interactive booking card ── */}
          <BookingCard product={product} setShowBookingModal={setShowBookingModal} />

          {/* Specs */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            {[
              { label: 'Condition',    value: 'Excellent / Pro-Grade' },
              { label: 'Category',     value: product.category || 'Professional Gear' },
              { label: 'Max Duration', value: '10 days per booking' },
            ].map((s, i) => (
              <div key={i} className="flex justify-between items-center px-4 py-3 border-b border-slate-100">
                <span className="text-[13px] text-slate-400">{s.label}</span>
                <span className="text-[13px] font-semibold text-[#1a1a2e]">{s.value}</span>
              </div>
            ))}

            {/* Stock row */}
            {(() => {
              const avail = product.availableQuantity ?? (product.isAvailable ? 1 : 0)
              const total = product.totalQuantity ?? 1
              const pct   = total > 0 ? Math.round((avail / total) * 100) : 0
              const color = avail === 0 ? '#ef4444' : avail <= 2 ? '#f59e0b' : '#10b981'
              return (
                <div className="px-4 py-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[13px] text-slate-400">Stock</span>
                    <span className="text-[13px] font-semibold" style={{ color }}>
                      {avail} / {total} units available
                      {avail > 0 && avail <= 2 && <span className="ml-1.5 text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-md font-bold">Low Stock</span>}
                      {avail === 0 && <span className="ml-1.5 text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded-md font-bold">Fully Booked</span>}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Description */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">About this item</p>
            <p className="text-[14px] text-slate-600 leading-relaxed">{product.description}</p>
          </div>
        </div>
      </div>

      {/* ── Related products ── */}
      <RelatedProducts
        currentId={product._id}
        category={product.category}
        setShowBookingModal={setShowBookingModal}
      />
    </div>
  )
}

export default ProductDetails
