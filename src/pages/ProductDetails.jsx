import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { differenceInDays } from 'date-fns'
import {
  HiOutlineHeart, HiHeart, HiTrendingUp, HiOutlineShieldCheck,
  HiArrowLeft, HiChevronLeft, HiChevronRight, HiChevronDown, HiChevronUp,
  HiOutlineShoppingCart, HiOutlineCheckCircle, HiArrowRight,
} from 'react-icons/hi'
import { useGlobal, getImageUrl } from '../context/GlobalContext'

const OFFER_COLORS = ['#E5550F', '#c94a0d', '#a83b0b', '#7c2d12', '#92400e']
const offerLabel = (o) =>
  o.discountType === 'percentage' ? `${o.discountValue}% OFF` : `₹${o.discountValue} OFF`

const bookedThisMonth = (id = '') => {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0
  return Math.abs(h % 650) + 80
}

const FAQS = [
  { q: 'What documents are needed for KYC?', a: 'A valid government-issued photo ID (Aadhaar, PAN, Passport or Driving License) is required for first-time renters.' },
  { q: 'When does the rental period start?', a: 'You can pick up your gear anytime between 7AM and 11PM. Returns are accepted from 8AM to 8PM on the return date. Each calendar day (12AM–11PM) counts as one rental day.' },
  { q: 'Is there a security deposit?', a: 'No security deposit required.' },
  { q: 'What is the maximum rental duration?', a: 'Standard bookings go up to 10 days. For rentals longer than 10 days, please contact us directly.' },
]

const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 last:border-none">
      <button
        className="w-full flex items-center justify-between py-4 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-[14px] font-medium text-gray-800 pr-4">{q}</span>
        {open
          ? <HiChevronUp className="text-gray-400 shrink-0 text-lg" />
          : <HiChevronDown className="text-gray-400 shrink-0 text-lg" />}
      </button>
      {open && <p className="text-[13px] text-gray-500 pb-4 leading-relaxed">{a}</p>}
    </div>
  )
}

const RelatedProducts = ({ currentId, category, setShowBookingModal }) => {
  const { products, addToCart, user, setAuthMode } = useGlobal()
  const navigate = useNavigate()
  const related = products.filter(p => p._id !== currentId && p.category === category).slice(0, 4)
  if (related.length === 0) return null
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[17px] font-bold text-gray-900">Similar {category} Gear</h3>
        <button onClick={() => navigate(`/?category=${encodeURIComponent(category)}`)} className="text-[12px] font-semibold text-[#E5550F] hover:underline flex items-center gap-0.5">
          View all <HiArrowRight className="text-xs" />
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {related.map(p => {
          const soldOut = !p.isAvailable || (p.availableQuantity ?? 0) <= 0
          return (
            <div
              key={p._id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
              onClick={() => { navigate(`/product/${p._id}`); window.scrollTo(0, 0) }}
            >
              <div className="aspect-square bg-gray-50 overflow-hidden">
                <img src={getImageUrl(p.imageUrl)} alt={p.name} className="w-full h-full object-contain hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-3">
                <p className="text-[12px] font-semibold text-gray-900 line-clamp-2 mb-1">{p.name}</p>
                <p className="text-[#E5550F] font-bold text-[13px]">
                  ₹{p.pricePerDay?.toLocaleString()}<span className="text-gray-400 font-normal text-[10px]">/day</span>
                </p>
                {!soldOut && (
                  <button
                    className="mt-2 w-full bg-[#1a1a2e] text-white text-[11px] font-semibold py-1.5 rounded-lg hover:bg-[#E5550F] transition-colors"
                    onClick={e => { e.stopPropagation(); user ? setShowBookingModal(p) : setAuthMode('login') }}
                  >
                    Book
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────
const ProductDetails = ({ setShowBookingModal }) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { products, offers, cart, addToCart, removeFromCart, updateCartQty, user, setAuthMode, rentalDates } = useGlobal()

  const product = products.find(p => p._id === id)
  const allImages = product
    ? [product.imageUrl, ...(product.galleryImages || [])].filter(Boolean).map(getImageUrl)
    : []
  const [activeImg, setActiveImg]     = useState(0)
  const [wishlisted, setWishlisted]   = useState(false)
  const [descExpanded, setDescExpanded] = useState(false)

  const booked = bookedThisMonth(product?._id || '')

  const rentalDays = useMemo(() => {
    if (!rentalDates.from || !rentalDates.to) return 1
    return Math.max(1, differenceInDays(rentalDates.to, rentalDates.from))
  }, [rentalDates])

  const totalPrice = product ? (product.pricePerDay * rentalDays).toLocaleString('en-IN') : '0'
  const cartItem   = cart.find(i => i._id === product?._id)
  const cartQty    = cartItem?.cartQty || 0
  const soldOut    = !product?.isAvailable || (product?.availableQuantity ?? 0) <= 0

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-gray-400 text-[18px]">Product not found</p>
        <button onClick={() => navigate('/')} className="text-[#E5550F] font-medium hover:underline">← Back to catalog</button>
      </div>
    )
  }

  const prevImg = () => setActiveImg(i => (i - 1 + allImages.length) % allImages.length)
  const nextImg = () => setActiveImg(i => (i + 1) % allImages.length)

  return (
    <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-6">

      {/* Back */}
      <button
        onClick={() => navigate('/')}
        className="mb-5 flex items-center gap-1.5 text-gray-500 hover:text-[#E5550F] text-[13px] font-medium transition-colors"
      >
        <HiArrowLeft /> Back to catalog
      </button>

      {/* ── Main flex layout ───────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ══ LEFT COLUMN ════════════════════════════════════════════ */}
        <div className="flex-1 min-w-0">

          {/* Image gallery */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex gap-3">
              {/* Vertical thumbnail strip */}
              {allImages.length > 1 && (
                <div className="flex flex-col gap-2 w-[68px] shrink-0">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`w-[68px] h-[68px] rounded-xl overflow-hidden border-2 transition-all ${
                        i === activeImg
                          ? 'border-[#E5550F] shadow-sm shadow-orange-100'
                          : 'border-gray-100 hover:border-gray-300 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}

              {/* Main image + arrows */}
              <div className="flex-1 relative flex items-center justify-center min-h-[280px] md:min-h-[400px]">
                <img
                  key={activeImg}
                  src={allImages[activeImg] || getImageUrl(product.imageUrl)}
                  alt={product.name}
                  className="max-w-full max-h-[400px] object-contain"
                  style={{ animation: 'fadeIn 0.2s ease' }}
                />

                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImg}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:border-gray-400 shadow-sm transition-all"
                    >
                      <HiChevronLeft className="text-lg" />
                    </button>
                    <button
                      onClick={nextImg}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:border-gray-400 shadow-sm transition-all"
                    >
                      <HiChevronRight className="text-lg" />
                    </button>
                    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/40 text-white text-[11px] px-3 py-1 rounded-full backdrop-blur-sm font-medium">
                      {activeImg + 1} of {allImages.length} Images
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Key Benefits */}
          <div className="mt-6">
            <h3 className="text-[17px] font-bold text-gray-900 mb-4">Key Benefits of Renting</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { emoji: '🏆', title: 'Premium Quality', desc: 'Professionally maintained & ready to use' },
                { emoji: '💰', title: 'Affordable Rates', desc: 'Save up to 80% compared to buying' },
                { emoji: '🚚', title: 'Store Pickup', desc: 'Collect your order from our store' },
              ].map((b, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                  <div className="text-3xl mb-2">{b.emoji}</div>
                  <p className="text-[13px] font-bold text-gray-800 mb-1">{b.title}</p>
                  <p className="text-[11px] text-gray-400 leading-snug">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 px-5 py-2">
            <h3 className="text-[17px] font-bold text-gray-900 py-4 border-b border-gray-100">
              Frequently Asked Questions
            </h3>
            {FAQS.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
          </div>

          {/* Related products */}
          <RelatedProducts
            currentId={product._id}
            category={product.category}
            setShowBookingModal={setShowBookingModal}
          />
        </div>

        {/* ══ RIGHT STICKY PANEL ═════════════════════════════════════ */}
        <div className="w-full lg:w-[360px] xl:w-[390px] shrink-0 lg:sticky lg:top-[110px] space-y-3">

          {/* ── Main product card ─────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            {/* Name + heart */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <h1 className="text-[20px] font-bold text-gray-900 leading-snug">{product.name}</h1>
              <button onClick={() => setWishlisted(w => !w)} className="p-1 mt-0.5 shrink-0">
                {wishlisted
                  ? <HiHeart className="text-red-500 text-[22px]" />
                  : <HiOutlineHeart className="text-gray-300 text-[22px] hover:text-red-400 transition-colors" />}
              </button>
            </div>

            {/* Short description */}
            {product.description && (
              <p className="text-[13px] text-gray-400 line-clamp-2 leading-snug mb-3">{product.description}</p>
            )}

            {/* Booked count */}
            <div className="flex items-center gap-1.5 mb-4">
              <HiTrendingUp className="text-green-500 text-sm shrink-0" />
              <span className="text-green-600 text-[12px] font-semibold">{booked} booked this month</span>
            </div>

            {/* Duration */}
            <p className="text-[13px] text-gray-500 mb-1">
              Rent for <span className="font-bold text-gray-800">{rentalDays}</span> {rentalDays === 1 ? 'day' : 'days'}
            </p>

            {/* Price */}
            <div className="flex items-baseline gap-1 mb-0.5">
              <span className="text-[34px] font-black text-gray-900 leading-none">₹{totalPrice}</span>
            </div>
            <p className="text-[11px] text-gray-400 mb-4">Price incl. of all taxes</p>

            {/* CTA */}
            {soldOut ? (
              <div className="w-full py-3.5 bg-gray-100 text-gray-400 rounded-xl text-[14px] font-bold text-center">
                Currently Unavailable
              </div>
            ) : cartQty > 0 ? (
              <div>
                <div className="flex items-center justify-between border-2 border-gray-800 rounded-xl overflow-hidden mb-2">
                  <button
                    onClick={() => cartQty === 1 ? removeFromCart(product._id) : updateCartQty(product._id, -1)}
                    className="flex-1 py-3.5 flex items-center justify-center text-gray-800 font-bold text-[20px] hover:bg-gray-100 transition-colors leading-none"
                  >−</button>
                  <span className="text-[16px] font-bold text-gray-900 px-5 select-none">{cartQty}</span>
                  <button
                    onClick={() => updateCartQty(product._id, 1)}
                    className="flex-1 py-3.5 flex items-center justify-center text-gray-800 font-bold text-[20px] hover:bg-gray-100 transition-colors leading-none"
                  >+</button>
                </div>
                <button
                  onClick={() => user ? setShowBookingModal(product) : setAuthMode('login')}
                  className="w-full py-2.5 border-2 border-[#1a1a2e] text-[#1a1a2e] rounded-xl text-[13px] font-bold hover:bg-[#1a1a2e] hover:text-white transition-all"
                >
                  Book Now
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => user ? addToCart(product) : setAuthMode('login')}
                  className="w-full py-3.5 bg-[#E5550F] text-white rounded-xl text-[14px] font-bold hover:bg-[#c2410c] transition-all shadow-[0_4px_14px_rgba(229,85,15,0.3)] flex items-center justify-center gap-2"
                >
                  <HiOutlineShoppingCart className="text-lg" /> Add to Cart
                </button>
                <button
                  onClick={() => user ? setShowBookingModal(product) : setAuthMode('login')}
                  className="w-full py-3 border-2 border-[#1a1a2e] text-[#1a1a2e] rounded-xl text-[13px] font-bold hover:bg-[#1a1a2e] hover:text-white transition-all"
                >
                  Book Now
                </button>
              </div>
            )}
          </div>

          {/* ── Available Offers ──────────────────────────────── */}
          {offers.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-bold text-gray-700">
                  Available Offers ({offers.length} Offer{offers.length !== 1 ? 's' : ''})
                </p>
                <HiChevronRight className="text-gray-400" />
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {offers.map((offer, i) => (
                  <div
                    key={offer._id}
                    className="flex-shrink-0 bg-white rounded-xl border border-orange-100 overflow-hidden flex"
                    style={{ minWidth: 180 }}
                  >
                    <div
                      className="w-8 shrink-0 flex items-center justify-center"
                      style={{ background: OFFER_COLORS[i % OFFER_COLORS.length], writingMode: 'vertical-rl' }}
                    >
                      <span className="text-white text-[8px] font-black py-2 leading-none" style={{ transform: 'rotate(180deg)' }}>
                        {offerLabel(offer)}
                      </span>
                    </div>
                    <div className="p-2.5 flex flex-col gap-0.5">
                      <span className="font-bold text-gray-900 text-[11px]">{offer.code}</span>
                      <p className="text-gray-400 text-[10px] leading-snug">{offer.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Zero Policy ───────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#1a1a2e] flex items-center justify-center shrink-0">
                <span className="text-white text-[10px] font-black leading-none text-center">ZERO<br/>POL</span>
              </div>
              <div>
                <p className="text-[13px] font-bold text-gray-900">Transparent Pricing</p>
                <p className="text-[11px] text-[#E5550F] font-semibold">Zero Surprises</p>
              </div>
            </div>
            {[
              'Zero Security Deposit',
              'Zero Hidden Charges',
             
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5">
                <HiOutlineCheckCircle className="text-[#E5550F] text-sm shrink-0" />
                <span className="text-[12px] text-gray-600">{item}</span>
              </div>
            ))}
          </div>

          {/* ── Product Description ───────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-[13px] font-bold text-gray-900 mb-2">Product Description</p>
            <p className={`text-[12px] text-gray-500 leading-relaxed ${descExpanded ? '' : 'line-clamp-3'}`}>
              {product.description || 'Professional grade rental equipment, well maintained and ready for immediate use.'}
            </p>
            {(product.description?.length ?? 0) > 120 && (
              <button
                onClick={() => setDescExpanded(d => !d)}
                className="text-[12px] font-semibold text-[#E5550F] mt-1.5 hover:underline"
              >
                {descExpanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>

          {/* ── Specs ─────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {[
              { label: 'Category',    value: product.category || '—' },
              { label: 'Condition',   value: 'Excellent / Pro-Grade' },
              { label: 'Max Rental',  value: '10 days per booking' },
            
              
            ].map((s, i) => (
              <div key={i} className="flex justify-between items-center px-4 py-2.5 border-b border-gray-100 last:border-none">
                <span className="text-[12px] text-gray-400">{s.label}</span>
                <span className="text-[12px] font-semibold text-gray-800">{s.value}</span>
              </div>
            ))}
          </div>

          {/* ── Policy buttons ────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-2 pb-6">
            <button className="flex items-center justify-center gap-1.5 py-2.5 bg-white border border-gray-200 rounded-xl text-[12px] font-medium text-gray-600 hover:border-gray-400 transition-colors">
              📋 Rental Policy
            </button>
            <button className="flex items-center justify-center gap-1.5 py-2.5 bg-white border border-gray-200 rounded-xl text-[12px] font-medium text-gray-600 hover:border-gray-400 transition-colors">
              🛡️ Damage Policy
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </div>
  )
}

export default ProductDetails
