import { useState, useMemo } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import {
  HiOutlineHeart, HiHeart, HiTrendingUp, HiPlus, HiChevronDown,
} from 'react-icons/hi'
import { MdCameraAlt, MdVideocam, MdFlashOn, MdCategory, MdGridView } from 'react-icons/md'
import { differenceInDays } from 'date-fns'
import { useGlobal, getImageUrl } from '../context/GlobalContext'

const OFFER_COLORS = ['#E5550F', '#c94a0d', '#a83b0b', '#7c2d12', '#92400e']
const offerLabel = (o) =>
  o.discountType === 'percentage' ? `${o.discountValue}% OFF` : `₹${o.discountValue} OFF`

const getCategoryIcon = (cat) => {
  const s = (cat || '').toLowerCase()
  if (s === 'all') return <MdGridView className="text-[22px]" />
  if (s.includes('dslr') || s.includes('camera') || s.includes('canon') || s.includes('nikon') || s.includes('mirrorless'))
    return <MdCameraAlt className="text-[22px]" />
  if (s.includes('lens') || s.includes('video') || s.includes('cinema'))
    return <MdVideocam className="text-[22px]" />
  if (s.includes('light') || s.includes('flash') || s.includes('strobe'))
    return <MdFlashOn className="text-[22px]" />
  return <MdCategory className="text-[22px]" />
}

const bookedThisMonth = (id = '') => {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0
  return Math.abs(h % 650) + 80
}

const FAQS = [
  {
    q: 'How do I place a rental request?',
    a: 'Set your rental dates in the top bar, then browse the inventory. Click "+ Add to Cart" to add items or "Book" to book a single item directly. You\'ll be guided through the booking form.',
  },
  {
    q: 'What is KYC and why do I need it?',
    a: 'KYC (Know Your Customer) is a one-time identity verification step. Upload photos of your Aadhaar (front & back) and PAN (front & back) from your dashboard. Verified accounts get faster approvals — usually within 1–2 hours.',
  },
  {
    q: 'Where do I pick up my equipment?',
    a: 'We have two offices in Chennai — Velachery Studio and T. Nagar Office. Once your order is approved, you will be notified with the exact pickup location and address.',
  },
  {
    q: 'Can I rent multiple items together?',
    a: 'Yes! Add as many items as you need to your cart and check out in a single booking. All items will be on the same rental dates.',
  },
  {
    q: 'What if I need to extend my rental?',
    a: 'Contact us before your return date. Extensions are subject to availability. You can reach us through the Help & Support section in your dashboard.',
  },
  {
    q: 'How are rental charges calculated?',
    a: 'Charges are based on the number of rental days × daily rate per item. A minimum of 1 day is always charged. GST is included in the displayed price.',
  },
  {
    q: 'Can I cancel a booking?',
    a: 'Yes — cancellation is available while your order is in "Request Submitted" or "KYC Pending" stage. Once the order is approved and confirmed, it cannot be cancelled from the app. Please contact us directly.',
  },
  {
    q: 'Do you have promo codes or offers?',
    a: 'Yes! Active offers are displayed on the home screen. Enter the promo code in the booking form to apply the discount. Discounts are applied before final checkout.',
  },
]

const FAQItem = ({ q, a }) => {
  const [open, setOpen] = useState(false)
  return (
    <div
      onClick={() => setOpen(o => !o)}
      className="border-b border-gray-100 cursor-pointer last:border-b-0"
    >
      <div className="flex items-center justify-between gap-4 py-4 px-1">
        <span className={`text-[14px] md:text-[15px] font-semibold leading-snug flex-1 ${open ? 'text-[#E5550F]' : 'text-gray-800'}`}>
          {q}
        </span>
        <HiChevronDown
          className={`shrink-0 text-gray-400 text-[18px] transition-transform duration-200 ${open ? 'rotate-180 text-[#E5550F]' : ''}`}
        />
      </div>
      {open && (
        <div className="pb-4 px-1 text-[13px] md:text-[14px] text-gray-500 leading-relaxed">
          {a}
        </div>
      )}
    </div>
  )
}

const LandingPage = ({ setShowBookingModal }) => {
  const { products, cart, user, addToCart, removeFromCart, updateCartQty, rentalDates, categories, setAuthMode, offers } = useGlobal()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [wishlist, setWishlist] = useState(new Set())

  const selectedCategory = searchParams.get('category') || 'All'
  const searchQuery = (searchParams.get('q') || '').toLowerCase().trim()
  const allCategories = ['All', ...categories]

  const rentalDays = useMemo(() => {
    if (!rentalDates.from || !rentalDates.to) return 1
    return Math.max(1, differenceInDays(rentalDates.to, rentalDates.from))
  }, [rentalDates])

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory
    const matchesSearch = !searchQuery || (p.name || '').toLowerCase().includes(searchQuery)
    return matchesCategory && matchesSearch
  })

  const handleCategoryClick = (cat) => {
    navigate(cat === 'All' ? '/' : `/?category=${encodeURIComponent(cat)}`, { replace: true })
    setTimeout(() => document.getElementById('inventory')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const toggleWishlist = (id) => {
    setWishlist(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div>
      {/* Mobile horizontal category chips */}
      <div
        className="md:hidden flex gap-2 overflow-x-auto bg-white border-b border-gray-100 px-4 py-3"
        style={{ scrollbarWidth: 'none' }}
      >
        {allCategories.map(cat => {
          const active = selectedCategory === cat
          return (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap shrink-0 transition-colors ${
                active ? 'bg-[#E5550F] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Sidebar + main layout */}
      <div className="flex max-w-[1440px] mx-auto">

        {/* Left Sidebar */}
        <aside className="hidden md:block md:w-[72px] lg:w-[100px] shrink-0 bg-white border-r border-gray-100 sticky top-[104px] self-start overflow-y-auto">
          {allCategories.map(cat => {
            const active = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`w-full flex flex-col items-center gap-2 py-4 px-1 transition-all border-b border-gray-50 group ${
                  active
                    ? 'bg-orange-50 border-l-[3px] border-l-[#E5550F]'
                    : 'border-l-[3px] border-l-transparent hover:bg-gray-50'
                }`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                  active
                    ? 'bg-orange-100 text-[#E5550F]'
                    : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-700'
                }`}>
                  {getCategoryIcon(cat)}
                </div>
                <span className={`hidden lg:block text-[10px] font-semibold text-center leading-tight px-0.5 ${
                  active ? 'text-[#E5550F]' : 'text-gray-400 group-hover:text-gray-600'
                }`}>
                  {cat.length > 10 ? cat.slice(0, 9) + '..' : cat}
                </span>
              </button>
            )
          })}
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 pb-16">

          {/* Hero banner */}
          <div
            className="m-3 md:m-5 rounded-2xl overflow-hidden relative"
            style={{ background: 'linear-gradient(135deg, #E5550F 0%, #9a2f05 100%)', minHeight: 170 }}
          >
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)',
                backgroundSize: '24px 24px',
              }}
            />
            <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-white/10 pointer-events-none" />
            <div className="absolute right-24 bottom-0 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />

            <div className="relative z-10 px-6 md:px-10 py-6 md:py-9">
              <h2 className="text-[26px] md:text-[36px] font-black text-white leading-tight mb-2">
                {selectedCategory === 'All' ? 'Camera Gear' : selectedCategory}
              </h2>
              <p className="text-white/75 text-[13px] md:text-[15px] max-w-md leading-relaxed">
                Rent premium photography &amp; videography equipment from{' '}
                <strong className="text-white">Lensmen Rentals</strong>.
                DSLR, Mirrorless, Lenses &amp; Accessories on rent.
              </p>
              <div className="hidden sm:flex flex-wrap gap-5 md:gap-7 mt-4">
                {['Nikon', 'Canon', 'Sony', 'DJI', 'Sigma'].map(b => (
                  <span key={b} className="text-white font-bold text-[13px] md:text-[14px] tracking-wide opacity-90">{b}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Offers */}
          {offers.length > 0 && (
            <div className="mx-3 md:mx-5 mt-3 md:mt-5">
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 md:p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-[15px] md:text-[17px] text-gray-800">
                    Available Offers ({offers.length} Offer{offers.length !== 1 ? 's' : ''})
                  </h3>
                  <div className="flex gap-1.5">
                    <button className="w-8 h-8 rounded-full border border-[#E5550F] text-[#E5550F] flex items-center justify-center text-base hover:bg-[#E5550F] hover:text-white transition-colors">‹</button>
                    <button className="w-8 h-8 rounded-full border border-[#E5550F] text-[#E5550F] flex items-center justify-center text-base hover:bg-[#E5550F] hover:text-white transition-colors">›</button>
                  </div>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  {offers.map((offer, i) => (
                    <div
                      key={offer._id}
                      className="flex-shrink-0 bg-white rounded-xl overflow-hidden border border-orange-100 flex"
                      style={{ minWidth: 220, maxWidth: 260 }}
                    >
                      <div
                        className="w-9 shrink-0 flex items-center justify-center"
                        style={{ background: OFFER_COLORS[i % OFFER_COLORS.length], writingMode: 'vertical-rl' }}
                      >
                        <span
                          className="text-white text-[9px] font-black py-2 leading-none"
                          style={{ transform: 'rotate(180deg)' }}
                        >
                          {offerLabel(offer)}
                        </span>
                      </div>
                      <div className="p-3.5 flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">🪙</span>
                          <span className="font-bold text-gray-900 text-[13px]">{offer.code}</span>
                        </div>
                        <p className="text-gray-500 text-[12px] leading-snug">{offer.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section header */}
          <div id="inventory" className="scroll-mt-[134px] md:scroll-mt-[110px] mx-3 md:mx-5 mt-6 md:mt-8 flex items-baseline justify-between gap-3">
            <h2 className="text-[18px] md:text-[22px] font-black text-gray-900 truncate">
              {searchQuery
                ? <>Results for "<span className="text-[#E5550F]">{searchParams.get('q')}</span>"</>
                : <>{selectedCategory === 'All' ? 'All Gear' : selectedCategory} On Rent</>
              }
            </h2>
            <span className="text-[12px] md:text-[14px] text-gray-400 shrink-0">
              Total:{' '}
              <span className="font-semibold text-gray-600">{filteredProducts.length} items</span>
            </span>
          </div>
          <div className="mx-3 md:mx-5 mt-2 h-px bg-gray-200" />

          {/* Product grid */}
          {filteredProducts.length > 0 ? (
            <div className="mx-3 md:mx-5 mt-4 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
              {filteredProducts.map(product => {
                const soldOut     = !product.isAvailable || (product.availableQuantity ?? 0) <= 0
                const booked      = bookedThisMonth(product._id)
                const isWishlisted = wishlist.has(product._id)
                const isNew       = parseInt((product._id || '').slice(-2), 16) % 3 === 0
                const badge       = isNew
                  ? { label: 'New',      cls: 'border-blue-400 text-blue-600 bg-blue-50' }
                  : { label: 'Trending', cls: 'border-[#E5550F] text-[#E5550F] bg-orange-50' }
                const totalPrice  = (product.pricePerDay * rentalDays).toLocaleString('en-IN')

                return (
                  <div
                    key={product._id}
                    className="bg-white rounded-2xl border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col overflow-hidden"
                  >
                    {/* Image area */}
                    <div className="relative px-4 md:px-5 pt-4 pb-1">
                      <span className={`inline-flex items-center px-2.5 py-[3px] rounded-full text-[10px] md:text-[11px] font-semibold border ${badge.cls}`}>
                        {badge.label}
                      </span>

                      <button
                        onClick={() => toggleWishlist(product._id)}
                        className="absolute top-3 right-3 p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        {isWishlisted
                          ? <HiHeart className="text-red-500 text-[18px]" />
                          : <HiOutlineHeart className="text-[18px]" />
                        }
                      </button>

                      <Link to={`/product/${product._id}`} className="block mt-2">
                        <img
                          src={getImageUrl(product.imageUrl)}
                          alt={product.name}
                          className={`w-full h-32 md:h-44 object-contain transition-transform duration-300 hover:scale-105 ${soldOut ? 'grayscale opacity-60' : ''}`}
                        />
                      </Link>

                      {soldOut && (
                        <div className="absolute inset-x-0 bottom-1 flex justify-center">
                          <span className="bg-red-500 text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                            Unavailable
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card body */}
                    <div className="px-4 md:px-5 pb-4 md:pb-5 flex flex-col flex-1">
                      <Link
                        to={`/product/${product._id}`}
                        className="font-bold text-[13px] md:text-[15px] text-gray-900 hover:text-[#E5550F] transition-colors leading-snug line-clamp-2 mb-1.5 mt-2"
                      >
                        {product.name}
                      </Link>

                      {!soldOut && (
                        <div className="flex items-center gap-1 mb-1.5">
                          <HiTrendingUp className="text-green-500 text-[11px] shrink-0" />
                          <span className="text-green-600 text-[11px] md:text-[12px] font-medium">
                            {booked} booked this month
                          </span>
                        </div>
                      )}

                      <p className="text-gray-500 text-[12px] md:text-[13px]">
                        Rent for{' '}
                        <span className="font-bold text-gray-700">{rentalDays}</span>{' '}
                        {rentalDays === 1 ? 'day' : 'days'}
                      </p>

                      <div className="mt-auto pt-3">
                        {soldOut ? (
                          <p className="text-red-400 text-[12px] font-semibold">Unavailable</p>
                        ) : (
                          (() => {
                            const cartItem = cart.find(i => i._id === product._id)
                            const qty = cartItem?.cartQty || 0
                            return (
                              <div className="flex items-end justify-between gap-2">
                                <div>
                                  <p className="font-black text-[18px] md:text-[22px] text-gray-900 leading-none">
                                    ₹{totalPrice}
                                  </p>
                                  <p className="text-gray-400 text-[10px] md:text-[11px] mt-0.5">Incl. of GST</p>
                                </div>

                                {qty > 0 ? (
                                  <div className="flex items-center rounded-full border-2 border-gray-800 overflow-hidden shrink-0">
                                    <button
                                      onClick={() => qty === 1 ? removeFromCart(product._id) : updateCartQty(product._id, -1)}
                                      className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-gray-800 font-bold text-[18px] hover:bg-gray-100 transition-colors leading-none"
                                    >
                                      −
                                    </button>
                                    <span className="w-6 text-center text-[14px] font-bold text-gray-900 select-none">
                                      {qty}
                                    </span>
                                    <button
                                      onClick={() => updateCartQty(product._id, 1)}
                                      className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-gray-800 font-bold text-[18px] hover:bg-gray-100 transition-colors leading-none"
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      onClick={() => user ? setShowBookingModal(product) : setAuthMode('login')}
                                      className="text-[11px] md:text-[12px] font-semibold text-[#E5550F] hover:underline"
                                    >
                                      Book
                                    </button>
                                    <button
                                      onClick={() => user ? addToCart(product) : setAuthMode('login')}
                                      className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-gray-800 flex items-center justify-center text-gray-800 font-bold text-[18px] hover:bg-gray-100 transition-all"
                                    >
                                      +
                                    </button>
                                  </div>
                                )}
                              </div>
                            )
                          })()
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="mx-3 md:mx-5 mt-6 flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
              <MdCameraAlt className="text-5xl text-gray-200 mb-3" />
              <p className="font-semibold text-gray-400 text-[15px]">
                {searchQuery ? `No results for "${searchParams.get('q')}"` : 'No gear in this category'}
              </p>
              <button
                onClick={() => navigate('/')}
                className="mt-2 text-[14px] text-[#E5550F] font-medium hover:underline"
              >
                Show all
              </button>
            </div>
          )}

          {/* ── FAQ Section ─────────────────────────────────────── */}
          <div className="mx-3 md:mx-5 mt-12 md:mt-16">
            <div className="grid md:grid-cols-[1fr_1.8fr] gap-8 md:gap-12 items-start">

              {/* Left: title block */}
              <div className="md:sticky md:top-[130px]">
                <p className="text-[11px] font-bold text-[#E5550F] uppercase tracking-widest mb-2">Help Center</p>
                <h2 className="text-[26px] md:text-[32px] font-black text-[#1e1b4b] leading-tight mb-4">
                  Frequently Asked<br />Questions
                </h2>
                <p className="text-[14px] text-gray-500 leading-relaxed mb-6">
                  Everything you need to know about renting camera gear with Lensmen Rentals.
                </p>
                <div className="bg-[#1e1b4b] rounded-2xl p-5">
                  <div className="text-[13px] font-bold text-white mb-1">Still have questions?</div>
                  <div className="text-[12px] text-white/50 mb-3">We're happy to help.</div>
                  <a
                    href="mailto:support@lensmenrentals.com"
                    className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#E5550F] hover:underline"
                  >
                    support@lensmenrentals.com
                  </a>
                </div>
              </div>

              {/* Right: FAQ accordion */}
              <div className="bg-white rounded-2xl border border-gray-100 px-6 md:px-8 py-2 shadow-sm">
                {FAQS.map((faq, i) => (
                  <FAQItem key={i} q={faq.q} a={faq.a} />
                ))}
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}

export default LandingPage
