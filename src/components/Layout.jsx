import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import {
  HiOutlineShoppingCart, HiOutlineLogout, HiOutlineChartBar,
  HiOutlineUser, HiOutlineSearch, HiLocationMarker, HiCalendar, HiPencilAlt, HiX,
  HiChevronDown,
} from 'react-icons/hi'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { differenceInCalendarDays } from 'date-fns'
import { useGlobal } from '../context/GlobalContext'
import Footer from './Footer'

// Resolve a menu item to a URL string
const resolveItemUrl = (item) => {
  if (!item) return '/'
  if (item.type === 'all') return '/'
  if (item.type === 'category' && item.categoryName) return `/?category=${encodeURIComponent(item.categoryName)}`
  if (item.type === 'product' && item.productId) return `/product/${item.productId}`
  if (item.type === 'url' && item.url) return item.url
  return '/'
}

const Layout = ({ children }) => {
  const { user, cart, logout, setAuthMode, setCartOpen, categories, categoriesData, mainMenu, rentalDates, setRentalDates } = useGlobal()
  const navigate = useNavigate()
  const location = useLocation()
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchInput, setSearchInput] = useState('')

  const isPublic = !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/dashboard')
  const searchParams = new URLSearchParams(location.search)
  const activeCategory = searchParams.get('category') || 'All'
  const activeSub = searchParams.get('sub') || ''
  const [openMenu, setOpenMenu] = useState(null)
  const [dropdownPos, setDropdownPos] = useState({ left: 0, top: 0 })

  // Effective nav items: use mainMenu if set, else fall back to categories
  const navItems = (mainMenu?.items?.length > 0)
    ? mainMenu.items
    : [
        { _id: '__all__', label: 'All', type: 'all', children: [] },
        ...categoriesData.map(c => ({
          _id: c.name, label: c.name, type: 'category', categoryName: c.name,
          imageUrl: c.imageUrl || '', children: [],
        })),
      ]

  const isItemActive = (item) => {
    if (item.type === 'all') return location.pathname === '/' && !searchParams.get('category')
    if (item.type === 'category') return activeCategory === item.categoryName
    if (item.type === 'product') return location.pathname === `/product/${item.productId}`
    return false
  }

  useEffect(() => {
    if (!showSearch) return
    const onKey = (e) => { if (e.key === 'Escape') closeSearch() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showSearch])

  const handleSearch = (e) => {
    e.preventDefault()
    const q = searchInput.trim()
    if (q) navigate(`/?q=${encodeURIComponent(q)}`)
    else navigate('/')
    setShowSearch(false)
    setSearchInput('')
  }

  const openSearch = () => {
    setShowSearch(true)
    setTimeout(() => document.getElementById('header-search-input')?.focus(), 50)
  }

  const closeSearch = () => {
    setShowSearch(false)
    setSearchInput('')
  }

  const goToItem = (item) => {
    const url = resolveItemUrl(item)
    if (item.type === 'url' && item.url?.startsWith('http')) {
      window.open(item.url, '_blank')
    } else {
      navigate(url)
    }
    setOpenMenu(null)
    setTimeout(() => document.getElementById('inventory')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  // Legacy helper kept for any remaining callers
  const goToCategory = (cat) => navigate(cat === 'All' ? '/' : `/?category=${encodeURIComponent(cat)}`)

  // Close dropdown on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setOpenMenu(null) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const fmtDate = (d) => {
    if (!d) return '—'
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  const handleDateChange = (dates) => {
    const [start, end] = dates
    if (start && end) {
      const calDays = differenceInCalendarDays(end, start) + 1
      if (calDays > 10) {
        toast.error('Rental period cannot exceed 10 days')
        setRentalDates({ from: start, to: null })
        return
      }
      setRentalDates({ from: start, to: end })
      setShowDatePicker(false)
    } else {
      setRentalDates({ from: start, to: null })
    }
  }

  const rentalDays = rentalDates.from && rentalDates.to
    ? differenceInCalendarDays(rentalDates.to, rentalDates.from) + 1
    : null

  /* ─── Reusable chip/button pieces ────────────────────────── */
  const locationChip = (
    <button className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 rounded-full px-3 h-[28px] text-white text-[12px] font-medium transition-colors shrink-0">
      <HiLocationMarker className="text-[#E5550F] text-sm shrink-0" />
      <span className="hidden sm:inline">Chennai</span>
      <svg className="w-3 h-3 ml-0.5 opacity-50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )

  const deliveryChip = (
    <button
      onClick={() => setShowDatePicker(true)}
      className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 rounded-full px-3 h-[28px] text-[12px] transition-colors shrink-0"
    >
      <HiCalendar className="text-white/50 text-sm shrink-0" />
      <span className="text-white/60 hidden sm:inline">Pickup:</span>
      <span className="text-white font-semibold">{fmtDate(rentalDates.from)}</span>
    </button>
  )

  const pickupChip = (
    <button
      onClick={() => setShowDatePicker(true)}
      className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 rounded-full px-3 h-[28px] text-[12px] transition-colors shrink-0"
    >
      <HiCalendar className="text-white/50 text-sm shrink-0" />
      <span className="text-white/60 hidden sm:inline">Return:</span>
      <span className="text-white font-semibold">{fmtDate(rentalDates.to)}</span>
    </button>
  )

  const editBtn = (
    <button
      onClick={() => setShowDatePicker(true)}
      className="flex items-center gap-1.5 border border-[#E5550F] text-[#E5550F] rounded-full px-3 h-[28px] text-[12px] font-semibold hover:bg-[#E5550F]/10 transition-colors shrink-0"
    >
      <HiPencilAlt className="text-sm" /> Edit
    </button>
  )

  const rightActions = (
    <div className="flex items-center gap-1.5 shrink-0">
      <button onClick={openSearch} className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors">
        <HiOutlineSearch className="text-[17px]" />
      </button>

      {(!user || user.role !== 'admin') && (
        <button
          onClick={() => user ? setCartOpen(true) : setAuthMode('login')}
          className="relative w-8 h-8 flex items-center justify-center text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors"
        >
          <HiOutlineShoppingCart className="text-[17px]" />
          {cart.length > 0 && (
            <span className="absolute top-0 right-0 bg-[#E5550F] text-white text-[8px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full">
              {cart.length}
            </span>
          )}
        </button>
      )}

      {user ? (
        <>
          <Link
            to="/dashboard"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <HiOutlineUser className="text-[15px]" />
          </Link>
          <span className="text-white text-[13px] font-medium hidden md:block">
            Hi, {user.fullName?.split(' ')[0] || 'User'}
          </span>
          {user.role === 'admin' && (
            <Link
              to="/admin"
              className="bg-[#E5550F] text-white px-2.5 h-7 rounded-full font-semibold text-[11px] hidden sm:flex items-center gap-1 hover:bg-[#c2410c] transition-colors"
            >
              <HiOutlineChartBar className="text-sm" /> Admin
            </Link>
          )}
          <button
            onClick={logout}
            className="w-7 h-7 rounded-full text-white/40 hover:text-red-400 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <HiOutlineLogout className="text-[14px]" />
          </button>
        </>
      ) : (
        <button
          onClick={() => setAuthMode('login')}
          className="flex items-center gap-1.5 text-white text-[13px] font-medium hover:text-white/80 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <HiOutlineUser className="text-[15px]" />
          </div>
          <span className="hidden md:block">Hi, Login</span>
        </button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f5f5f7] font-sans text-gray-900">
      <Toaster
        position="top-center"
        toastOptions={{
          className: 'font-medium shadow-lg',
          duration: 4000,
          style: { borderRadius: '12px', border: '1px solid #ededf1' },
        }}
      />

      {isPublic && (
        <nav className="sticky top-0 z-40">
          <div className="bg-[#1a1a2e]">

            {/* ── Desktop header (md+): single row ─────────────── */}
            <div className="hidden md:flex max-w-[1400px] mx-auto items-center justify-between gap-2 px-5 h-[58px]">
              <Link to="/" className="flex items-center gap-2 shrink-0 mr-1">
                <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-lg object-cover border border-white/10" />
                <span className="text-white font-bold text-[15px]">
                  Lensmen <span className="text-[#E5550F]">Rentals</span>
                </span>
              </Link>
              <div className="flex items-center gap-2">
                {locationChip}
                {deliveryChip}
                {pickupChip}
                {editBtn}
              </div>
              
              {rightActions}
            </div>

            {/* ── Mobile header (<md): two rows ────────────────── */}
            <div className="md:hidden">
              {/* Row 1: Logo + actions */}
              <div className="flex items-center justify-between px-4 h-[48px]">
                <Link to="/" className="flex items-center gap-2 shrink-0">
                  <img src="/logo.jpg" alt="Logo" className="w-7 h-7 rounded-lg object-cover border border-white/10" />
                  <span className="text-white font-bold text-[14px]">
                    Lensmen <span className="text-[#E5550F]">Rentals</span>
                  </span>
                </Link>
                {rightActions}
              </div>
              {/* Row 2: Location + date chips */}
              <div
                className="flex items-center gap-2 px-4 pb-2.5 overflow-x-auto"
                style={{ scrollbarWidth: 'none' }}
              >
                {locationChip}
                {deliveryChip}
                {pickupChip}
                {editBtn}
              </div>
            </div>
          </div>

          {/* ── Nav menu row ───────────────────────────────────── */}
          <div className="bg-white border-b border-gray-200 shadow-sm">
            <div
              className="max-w-[1400px] mx-auto px-3 md:px-5 flex items-center overflow-x-auto"
              style={{ scrollbarWidth: 'none' }}
            >
              {navItems.map(item => {
                const hasChildren = item.children?.length > 0
                const isActive    = isItemActive(item)
                const itemKey     = String(item._id || item.label)
                const isOpen      = openMenu === itemKey

                return (
                  <div key={itemKey} className="shrink-0">
                    <button
                      onClick={(e) => {
                        if (hasChildren) {
                          if (isOpen) { setOpenMenu(null); return }
                          const rect = e.currentTarget.getBoundingClientRect()
                          setDropdownPos({ left: rect.left, top: rect.bottom })
                          setOpenMenu(itemKey)
                        } else {
                          goToItem(item)
                        }
                      }}
                      className={`flex items-center gap-1 px-4 md:px-6 py-3.5 text-[13px] md:text-[14px] font-semibold whitespace-nowrap border-b-2 transition-all ${
                        isActive
                          ? 'border-[#E5550F] text-[#E5550F]'
                          : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                      }`}
                    >
                      {item.label}
                      {hasChildren && (
                        <HiChevronDown className={`text-[12px] mt-0.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Dropdown portal — fixed, escapes overflow ──────── */}
          {openMenu && (() => {
            const item = navItems.find(i => String(i._id || i.label) === openMenu)
            const children = item?.children || []
            return children.length > 0 ? (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setOpenMenu(null)} />
                <div
                  style={{ position: 'fixed', left: dropdownPos.left, top: dropdownPos.top, zIndex: 9999 }}
                  className="min-w-[180px] bg-white border border-gray-100 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.15)] py-1.5"
                >
                  <button
                    onClick={() => goToItem(item)}
                    className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-orange-50 hover:text-[#E5550F] transition-colors"
                  >
                    All {item.label}
                  </button>
                  <div className="mx-3 h-px bg-gray-100 my-1" />
                  {children.map(child => (
                    <button
                      key={String(child._id || child.label)}
                      onClick={() => { goToItem(child); }}
                      className="w-full text-left px-4 py-2 text-[13px] text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      {child.label}
                    </button>
                  ))}
                </div>
              </>
            ) : null
          })()}
        </nav>
      )}

      {/* ── Date picker modal ────────────────────────────────── */}
      {showDatePicker && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={() => setShowDatePicker(false)}
        >
          <div className="absolute inset-0 bg-black/55 backdrop-blur-[3px]" />

          <div
            className="relative z-10 w-full max-w-[390px] rounded-2xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
            onClick={e => e.stopPropagation()}
          >
            {/* ── Dark header ─────────────────────────────── */}
            <div className="bg-[#1a1a2e] px-5 pt-5 pb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white font-bold text-[17px] tracking-tight">Rental Dates</h3>
                  <p className="text-white/45 text-[11px] mt-0.5">Select delivery & pickup — max 10 days</p>
                </div>
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                >
                  <HiX className="text-[18px]" />
                </button>
              </div>

              {/* Delivery / Pickup chips */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className={`rounded-xl p-3 transition-all ${rentalDates.from ? 'bg-[#E5550F]' : 'bg-white/8 border border-dashed border-white/20'}`}>
                  <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${rentalDates.from ? 'text-white/70' : 'text-white/35'}`}>
                    Pickup
                  </p>
                  <p className={`text-[15px] font-black leading-none ${rentalDates.from ? 'text-white' : 'text-white/25'}`}>
                    {rentalDates.from ? fmtDate(rentalDates.from) : '— —'}
                  </p>
                </div>
                <div className={`rounded-xl p-3 transition-all ${rentalDates.to ? 'bg-white/15 border border-white/10' : 'bg-white/5 border border-dashed border-white/20'}`}>
                  <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${rentalDates.to ? 'text-white/60' : 'text-white/35'}`}>
                    Return
                  </p>
                  <p className={`text-[15px] font-black leading-none ${rentalDates.to ? 'text-white' : 'text-white/25'}`}>
                    {rentalDates.to ? fmtDate(rentalDates.to) : '— —'}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex gap-1.5 mt-3.5">
                <div className={`h-[3px] flex-1 rounded-full transition-all duration-300 ${rentalDates.from ? 'bg-[#E5550F]' : 'bg-white/15'}`} />
                <div className={`h-[3px] flex-1 rounded-full transition-all duration-300 ${rentalDates.to ? 'bg-[#E5550F]' : 'bg-white/15'}`} />
              </div>
              <p className="text-white/35 text-[11px] mt-1.5 text-center">
                {!rentalDates.from
                  ? '① Pick your delivery date'
                  : !rentalDates.to
                  ? '② Now pick your pickup date'
                  : `✓ ${rentalDays} ${rentalDays === 1 ? 'day' : 'days'} selected`}
              </p>
            </div>

            {/* ── Calendar ────────────────────────────────── */}
            <div className="bg-white px-3 pt-2 pb-1 lmr-datepicker">
              <style>{`
                .lmr-datepicker .react-datepicker { border: none; font-family: inherit; width: 100%; }
                .lmr-datepicker .react-datepicker__month-container { width: 100%; float: none; }
                .lmr-datepicker .react-datepicker__header { background: #fff; border-bottom: 1px solid #f3f4f6; padding: 10px 0 8px; border-radius: 0; }
                .lmr-datepicker .react-datepicker__current-month { font-size: 14px; font-weight: 800; color: #111827; letter-spacing: -0.01em; }
                .lmr-datepicker .react-datepicker__day-names { margin-top: 6px; }
                .lmr-datepicker .react-datepicker__day-name { color: #9ca3af; font-size: 11px; font-weight: 700; width: 40px; line-height: 28px; }
                .lmr-datepicker .react-datepicker__week { display: flex; }
                .lmr-datepicker .react-datepicker__day { width: 40px; height: 40px; line-height: 40px; margin: 1px 0; font-size: 13px; border-radius: 50%; color: #374151; transition: all 0.15s; }
                .lmr-datepicker .react-datepicker__day:hover:not(.react-datepicker__day--disabled) { background: #fff7ed; color: #E5550F; transform: scale(1.1); }
                .lmr-datepicker .react-datepicker__day--today { font-weight: 800; color: #E5550F; }
                .lmr-datepicker .react-datepicker__day--selected { background: #E5550F !important; color: #fff !important; font-weight: 700; border-radius: 50% !important; }
                .lmr-datepicker .react-datepicker__day--range-start,
                .lmr-datepicker .react-datepicker__day--range-end { background: #E5550F !important; color: #fff !important; font-weight: 700; }
                .lmr-datepicker .react-datepicker__day--range-start { border-radius: 50% 0 0 50% !important; }
                .lmr-datepicker .react-datepicker__day--range-end { border-radius: 0 50% 50% 0 !important; }
                .lmr-datepicker .react-datepicker__day--range-start.react-datepicker__day--range-end { border-radius: 50% !important; }
                .lmr-datepicker .react-datepicker__day--in-range { background: #fff3e8; color: #c2410c; border-radius: 0; }
                .lmr-datepicker .react-datepicker__day--in-selecting-range:not(.react-datepicker__day--range-start) { background: #fff3e8; color: #c2410c; border-radius: 0; }
                .lmr-datepicker .react-datepicker__day--disabled { color: #e5e7eb !important; cursor: not-allowed; }
                .lmr-datepicker .react-datepicker__day--disabled:hover { background: transparent !important; transform: none !important; }
                .lmr-datepicker .react-datepicker__navigation { top: 10px; }
                .lmr-datepicker .react-datepicker__navigation-icon::before { border-color: #9ca3af; border-width: 2px 2px 0 0; width: 8px; height: 8px; }
                .lmr-datepicker .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before { border-color: #E5550F; }
              `}</style>
              <DatePicker
                selectsRange
                startDate={rentalDates.from}
                endDate={rentalDates.to}
                onChange={handleDateChange}
                inline
                minDate={new Date()}
              />
            </div>

            {/* ── Footer ──────────────────────────────────── */}
            <div className="bg-white px-4 pb-4 pt-2 flex gap-2.5 border-t border-gray-100">
              <button
                onClick={() => setRentalDates({ from: null, to: null })}
                className="px-4 py-2.5 rounded-xl text-[13px] font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => setShowDatePicker(false)}
                disabled={!rentalDates.from || !rentalDates.to}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                  rentalDates.from && rentalDates.to
                    ? 'bg-[#E5550F] text-white hover:bg-[#c2410c] shadow-[0_4px_14px_rgba(229,85,15,0.4)]'
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                }`}
              >
                {rentalDates.from && rentalDates.to
                  ? `Confirm — ${rentalDays} ${rentalDays === 1 ? 'day' : 'days'}`
                  : 'Select both dates'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Search overlay ─────────────────────────────────── */}
      {showSearch && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center pt-[80px] px-4"
          onClick={closeSearch}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
          <form
            onSubmit={handleSearch}
            onClick={e => e.stopPropagation()}
            className="relative z-10 w-full max-w-[560px]"
          >
            <div className="flex items-center bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden">
              <HiOutlineSearch className="text-gray-400 text-[20px] ml-4 shrink-0" />
              <input
                id="header-search-input"
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search cameras, lenses, accessories..."
                className="flex-1 py-4 px-3 text-[15px] text-gray-900 placeholder-gray-400 outline-none bg-transparent"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="p-2 mr-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <HiX className="text-[18px]" />
                </button>
              )}
              <button
                type="submit"
                className="m-1.5 px-5 py-2.5 bg-[#E5550F] text-white text-[13px] font-bold rounded-xl hover:bg-[#c2410c] transition-colors shrink-0"
              >
                Search
              </button>
            </div>
            <p className="text-white/50 text-[12px] mt-2.5 ml-1">Press Enter to search · Esc to close</p>
          </form>
        </div>
      )}

      {children}
      {isPublic && <Footer />}
    </div>
  )
}

export default Layout
