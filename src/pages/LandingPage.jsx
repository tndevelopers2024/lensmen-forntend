import { useState, useMemo, useEffect, useRef } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import {
  HiOutlineHeart, HiHeart, HiChevronDown,
  HiOutlineLocationMarker, HiOutlineTruck, HiOutlineShieldCheck, HiOutlineLightningBolt,
} from 'react-icons/hi'
import { MdCameraAlt } from 'react-icons/md'
import { differenceInDays } from 'date-fns'
import { useGlobal, getImageUrl } from '../context/GlobalContext'
import LogoLoader from '../components/LogoLoader'

// show the branded loader at least once per visit so it never just flashes
let splashSeen = false

const resolveItemUrl = (item) => {
  if (!item) return '/'
  if (item.type === 'all') return '/'
  if (item.type === 'category' && item.categoryName) return `/?category=${encodeURIComponent(item.categoryName)}`
  if (item.type === 'product' && item.productId) return `/product/${item.productId}`
  if (item.type === 'url' && item.url) return item.url
  return '/'
}

const OFFER_COLORS = ['#E5550F', '#c94a0d', '#a83b0b', '#7c2d12', '#92400e']
const offerLabel = (o) =>
  o.discountType === 'percentage' ? `${o.discountValue}% OFF` : `₹${o.discountValue} OFF`


const USPS = [
  { icon: HiOutlineLocationMarker, title: '2 Pickup Points',      sub: 'Velachery & Saligramam' },
  { icon: HiOutlineTruck,          title: 'Delivery in Chennai',  sub: 'Right to your shoot location' },
  { icon: HiOutlineShieldCheck,    title: 'Every Item Inspected', sub: 'Checked before each rental' },
  { icon: HiOutlineLightningBolt,  title: 'Fast Approvals',       sub: 'Verified accounts in 1–2 hrs' },
]

const FAQS = [
  {
    q: 'How do I place a rental request?',
    a: 'Set your rental dates in the top bar, then browse the inventory. Click "+ Add to Cart" to add items or "Book" to book a single item directly. You\'ll be guided through the booking form.',
  },
  {
    q: 'What is KYC and why do I need it?',
    a: 'KYC (Know Your Customer) is a one-time identity verification step. Upload photos of your Aadhaar (front & back) and PAN (front & back) from your dashboard. Verified accounts get faster approvals — usually within 1–2 hours. Customers must bring a copy of their valid driving licence at the time of pickup.',
  },
  {
    q: 'Where do I pick up my equipment?',
    a: 'We have two offices in Chennai — Velachery Studio and Saligramam Office. Once your order is approved, you will be notified with the exact pickup location and address.',
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
    a: 'Charges are based on the number of rental days × daily rate per item. A minimum of 1 day is always charged. GST is excluded in the displayed price.',
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

const Thumb = ({ src, label, size = 40, round = true }) => (
  <span
    className={`shrink-0 bg-gray-100 flex items-center justify-center overflow-hidden ${round ? 'rounded-full' : 'rounded-xl'}`}
    style={{ width: size, height: size }}
  >
    {src
      ? <img src={src} alt="" className="w-full h-full object-cover" />
      : <span className="text-[10px] font-black text-gray-400">{(label || '').slice(0, 2).toUpperCase()}</span>}
  </span>
)


const LandingPage = ({ setShowBookingModal }) => {
  const { products, cart, user, addToCart, removeFromCart, updateCartQty, rentalDates, categoriesData, mainMenu, setAuthMode, offers, catalogLoading } = useGlobal()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [wishlist, setWishlist] = useState(new Set())
  const [navH, setNavH] = useState(120)
  const [isMd, setIsMd] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches)
  const [spy, setSpy] = useState('')
  const [minDone, setMinDone] = useState(splashSeen)
  useEffect(() => {
    if (minDone) return
    const t = setTimeout(() => { splashSeen = true; setMinDone(true) }, 1400)
    return () => clearTimeout(t)
  }, [minDone])
  const uspRef = useRef(null)
  const [uspIdx, setUspIdx] = useState(0)

  const onUspScroll = (e) => {
    const el = e.currentTarget
    const card = el.children[0]
    if (card) setUspIdx(Math.min(USPS.length - 1, Math.round(el.scrollLeft / (card.offsetWidth + 8))))
  }

  const selectedGroup    = searchParams.get('group') || ''
  const selectedCategory = searchParams.get('category') || ''
  const selectedSub      = searchParams.get('sub') || ''
  const searchQuery      = (searchParams.get('q') || '').toLowerCase().trim()

  // sticky offset = height of whatever stays pinned: the full header on desktop, only the menu row on mobile
  useEffect(() => {
    const els = [document.querySelector('nav.sticky'), document.getElementById('menu-row')].filter(Boolean)
    const update = () => {
      const el = window.matchMedia('(min-width: 768px)').matches ? document.querySelector('nav.sticky') : document.getElementById('menu-row')
      if (el) setNavH(el.offsetHeight)
    }
    update()
    const ro = new ResizeObserver(update); els.forEach(e => ro.observe(e))
    window.addEventListener('resize', update)
    return () => { ro.disconnect(); window.removeEventListener('resize', update) }
  }, [])
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const h = () => setIsMd(mq.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])

  // ── Taxonomy: Group (Cameras) → Sections (Canon, Sony…) → Products ───────
  const groups = useMemo(() => {
    const firstImg = (list) => { const p = list.find(x => x.imageUrl); return p ? getImageUrl(p.imageUrl) : '' }
    const used = new Set()
    const mk = (cat, label, imageUrl) => {
      const list = products.filter(p => p.category === cat)
      if (!list.length || used.has(cat)) return null
      used.add(cat)
      return { key: cat, cat, label, items: list, image: imageUrl ? getImageUrl(imageUrl) : firstImg(list) }
    }
    const menuItems = (mainMenu?.items || []).filter(i => i.type !== 'all')
    let gs = menuItems.map(item => {
      const sections = (item.children || []).map(c => mk(c.categoryName || c.label, c.label, c.imageUrl)).filter(Boolean)
      const own = item.categoryName ? mk(item.categoryName, sections.length ? `Other ${item.label}` : item.label, '') : null
      if (own) sections.push(own)
      const items = sections.flatMap(s => s.items)
      return { key: item.label, label: item.label, sections, items, image: item.imageUrl ? getImageUrl(item.imageUrl) : firstImg(items) }
    }).filter(g => g.items.length)

    // categories that are in no menu group
    const names = categoriesData.map(c => c.name)
    const rest = [...new Set([...names, ...products.map(p => p.category)])].filter(Boolean)
      .map(cat => mk(cat, cat, categoriesData.find(c => c.name === cat)?.imageUrl)).filter(Boolean)
    if (!gs.length) {
      gs = rest.map(s => ({ key: s.label, label: s.label, sections: [s], items: s.items, image: s.image }))
    } else if (rest.length) {
      gs.push({ key: 'More Gear', label: 'More Gear', sections: rest, items: rest.flatMap(s => s.items), image: rest[0].image })
    }
    return gs
  }, [mainMenu, categoriesData, products])

  const activeGroup = useMemo(() => {
    if (selectedGroup) return groups.find(g => g.key === selectedGroup) || null
    if (selectedCategory) return groups.find(g => g.sections.some(s => s.cat === selectedCategory)) || null
    return null
  }, [groups, selectedGroup, selectedCategory])

  const mode = searchQuery ? 'search' : selectedCategory ? 'category' : selectedGroup && activeGroup ? 'group' : 'home'

  // mobile USP carousel: auto-advance every 3.5s (paused while the user is touching it)
  useEffect(() => {
    const el = uspRef.current
    if (!el) return
    let paused = false
    const stop = () => { paused = true }
    const go   = () => { paused = false }
    el.addEventListener('touchstart', stop, { passive: true })
    el.addEventListener('touchend', go, { passive: true })
    const t = setInterval(() => {
      if (paused || window.innerWidth >= 1024) return
      const card = el.children[0]
      if (!card) return
      const step = card.offsetWidth + 8
      const next = (Math.round(el.scrollLeft / step) + 1) % USPS.length
      el.scrollTo({ left: next * step, behavior: 'smooth' })
    }, 3500)
    return () => { clearInterval(t); el.removeEventListener('touchstart', stop); el.removeEventListener('touchend', go) }
  }, [groups.length, mode])

  const rentalDays = useMemo(() => {
    if (!rentalDates.from || !rentalDates.to) return 1
    return Math.max(1, differenceInDays(rentalDates.to, rentalDates.from))
  }, [rentalDates])

  const filteredProducts = products.filter(p => {
    const matchesCategory = !selectedCategory || p.category === selectedCategory
    const matchesSub = !selectedSub || (p.name || '').toLowerCase().includes(selectedSub.toLowerCase())
    const matchesSearch = !searchQuery || (p.name || '').toLowerCase().includes(searchQuery)
    return matchesCategory && matchesSub && matchesSearch
  })

  // ── navigation helpers ──────────────────────────────────────────────────
  const scrollMt = navH + (isMd ? 16 : 104)
  const jump = (id) => setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  const goHome  = () => { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const openGroup = (g) => { navigate(`/?group=${encodeURIComponent(g.key)}`); jump('inventory') }
  const openSection = (s) => { navigate(`/?category=${encodeURIComponent(s.cat)}`); jump('inventory') }
  // inside a group view clicking a section scrolls; elsewhere it opens that section
  const pickSection = (s) => (mode === 'group' ? document.getElementById(`sec-${s.cat}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) : openSection(s))

  // scroll-spy
  useEffect(() => {
    const els = [...document.querySelectorAll('[data-spy]')]
    if (!els.length) return
    const io = new IntersectionObserver(entries => {
      const vis = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (vis[0]) setSpy(vis[0].target.dataset.spy)
    }, { rootMargin: `-${scrollMt + 8}px 0px -65% 0px` })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [mode, groups, scrollMt, selectedGroup])

  const expandedGroup = mode === 'home' ? groups.find(g => g.key === spy) : activeGroup

  const toggleWishlist = (id) => {
    setWishlist(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const renderCard = (product) => {
                const soldOut     = !product.isAvailable || (product.availableQuantity ?? 0) <= 0
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
  }


  const showLoader = catalogLoading || !minDone

  const renderUsp = (cls = '') => (
    <div className={`rounded-2xl bg-gradient-to-r from-[#1a1a2e] via-[#241c45] to-[#2f2260] p-2.5 md:p-4 shadow-sm ${cls}`}>
      <div
        ref={uspRef}
        onScroll={onUspScroll}
        className="flex lg:grid lg:grid-cols-4 gap-2 md:gap-3 overflow-x-auto lg:overflow-visible snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none' }}
      >
        {USPS.map(u => (
          <div key={u.title} className="snap-start shrink-0 w-[78%] sm:w-[46%] lg:w-auto flex items-center gap-3 rounded-xl bg-white/[0.06] border border-white/10 px-3 md:px-4 py-2.5 md:py-3">
            <span className="w-9 h-9 md:w-12 md:h-12 shrink-0 rounded-xl bg-gradient-to-br from-[#E5550F] to-[#ff8a4c] flex items-center justify-center shadow-lg shadow-orange-900/30">
              <u.icon className="text-white text-[18px] md:text-[24px]" />
            </span>
            <div className="min-w-0">
              <p className="text-white text-[13px] md:text-[15px] font-bold leading-tight">{u.title}</p>
              <p className="text-white/60 text-[11px] md:text-[12px] leading-snug mt-0.5">{u.sub}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="lg:hidden flex justify-center gap-1.5 mt-2">
        {USPS.map((u, i) => (
          <span key={u.title} className={`h-1 rounded-full transition-all ${i === uspIdx ? 'w-5 bg-[#ff8a4c]' : 'w-1.5 bg-white/25'}`} />
        ))}
      </div>
    </div>
  )

  const renderGrid = (items) => (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">{items.map(renderCard)}</div>
  )

  const renderCrumbs = () => (
    <div className="flex items-center flex-wrap gap-1.5 text-[13px] mb-2">
      <button onClick={goHome} className="text-gray-400 hover:text-[#E5550F] font-medium">All gear</button>
      {activeGroup && (<>
        <span className="text-gray-300">/</span>
        <button onClick={() => openGroup(activeGroup)} className={`font-medium ${mode === 'group' ? 'text-gray-900' : 'text-gray-400 hover:text-[#E5550F]'}`}>{activeGroup.label}</button>
      </>)}
      {mode === 'category' && (<><span className="text-gray-300">/</span><span className="font-semibold text-gray-900">{selectedCategory}</span></>)}
    </div>
  )

  if (showLoader) return <LogoLoader />

  return (
    <div>
      {/* ── Mobile: only the subcategory chips (top menu is the one main menu) ── */}
      {activeGroup && activeGroup.sections.length > 1 && (
        <div className="md:hidden sticky z-30 bg-white/95 backdrop-blur border-b border-gray-200" style={{ top: navH }}>
          <div className="flex gap-2 overflow-x-auto px-3 py-2.5" style={{ scrollbarWidth: 'none' }}>
            <button onClick={() => openGroup(activeGroup)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-bold border ${mode === 'group' ? 'bg-[#1a1a2e] text-white border-[#1a1a2e]' : 'bg-white text-gray-600 border-gray-200'}`}>
              All {activeGroup.label}
            </button>
            {activeGroup.sections.map(s => {
              const on = selectedCategory === s.cat || (mode === 'group' && spy === s.cat)
              return (
                <button key={s.key} onClick={() => pickSection(s)}
                  className={`shrink-0 flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full text-[12px] font-semibold border ${on ? 'bg-[#E5550F] text-white border-[#E5550F]' : 'bg-white text-gray-600 border-gray-200'}`}>
                  <Thumb src={s.image} label={s.label} size={22} />
                  {s.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex max-w-[1440px] mx-auto">

        {/* ── Desktop sidebar: grouped, always visible ─────────── */}
        <aside
          className="hidden md:block w-[270px] shrink-0 sticky self-start overflow-y-auto bg-white border-r border-gray-100 py-4 px-3"
          style={{ top: navH, maxHeight: `calc(100vh - ${navH}px)`, scrollbarWidth: 'thin' }}
        >
          <button onClick={goHome}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-bold mb-1 transition-colors ${mode === 'home' ? 'bg-[#1a1a2e] text-white' : 'text-gray-700 hover:bg-gray-50'}`}>
            <span className="w-10 h-10 rounded-full bg-[#E5550F]/10 text-[#E5550F] flex items-center justify-center text-lg">◫</span>
            All gear
            <span className={`ml-auto text-[11px] font-semibold ${mode === 'home' ? 'text-white/60' : 'text-gray-400'}`}>{products.length}</span>
          </button>

          <p className="px-3 pt-4 pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Browse by type</p>

          {groups.map(g => {
            const open = expandedGroup?.key === g.key
            const groupOn = open && mode !== 'category'
            return (
              <div key={g.key} className="mb-1">
                <button onClick={() => openGroup(g)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-left ${groupOn ? 'bg-orange-50' : 'hover:bg-gray-50'}`}>
                  <Thumb src={g.image} label={g.label} size={40} />
                  <span className={`text-[14px] font-bold ${open ? 'text-[#E5550F]' : 'text-gray-800'}`}>{g.label}</span>
                  <span className="ml-auto text-[11px] text-gray-400 font-semibold">{g.items.length}</span>
                  <HiChevronDown className={`text-gray-400 text-[14px] transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && g.sections.length > 0 && (
                  <div className="ml-[26px] pl-4 border-l-2 border-orange-100 my-1 space-y-0.5">
                    {g.sections.map(s => {
                      const on = selectedCategory === s.cat || (mode === 'group' && spy === s.cat)
                      return (
                        <button key={s.key} onClick={() => pickSection(s)}
                          className={`w-full flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-lg text-left transition-colors ${on ? 'bg-[#E5550F] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                          <Thumb src={s.image} label={s.label} size={26} />
                          <span className="text-[13px] font-semibold leading-tight">{s.label}</span>
                          <span className={`ml-auto text-[11px] ${on ? 'text-white/70' : 'text-gray-400'}`}>{s.items.length}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </aside>

        {/* ── Main ─────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 pb-16">

          {/* Mobile banner: compact, text and imagery in separate columns (no overlap) */}
          {mode === 'home' && (
            <div className="md:hidden mx-3 mt-3 rounded-2xl overflow-hidden bg-gradient-to-r from-[#1a1a2e] to-[#2f2260] flex items-stretch">
              <div className="flex-1 min-w-0 px-4 py-3.5 flex flex-col justify-center">
                <p className="text-[10px] font-bold text-[#ff8a4c] uppercase tracking-[0.18em]">Chennai · Gear Rentals</p>
                <h2 className="text-[19px] font-black text-white leading-tight mt-1">
                  Rent. Create. <span className="text-[#ff8a4c]">Inspire.</span>
                </h2>
                <p className="text-[11.5px] text-white/60 mt-1 leading-snug">Pro cameras, lenses &amp; lights, ready to shoot.</p>
              </div>
              <div className="shrink-0 w-[132px] bg-white/[0.07] flex items-center justify-center pl-3 pr-2">
                <div className="flex -space-x-4">
                  {groups.slice(0, 3).map(g => (
                    g.image && <img key={g.key} src={g.image} alt="" className="w-[48px] h-[48px] rounded-full object-cover bg-white ring-2 ring-[#2a2050] shadow-md" />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* USP band: desktop sits up top; mobile shows it between the first and second group */}
          <div className="hidden md:block mx-6 mt-5">{renderUsp()}</div>

          {/* Offers */}
          {offers.length > 0 && (
            <div className="mx-3 md:mx-6 mt-3 md:mt-4">
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 md:p-5">
                <h3 className="font-bold text-[15px] md:text-[17px] text-gray-800 mb-3">
                  Available Offers ({offers.length} Offer{offers.length !== 1 ? 's' : ''})
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  {offers.map((offer, i) => (
                    <div key={offer._id} className="flex-shrink-0 bg-white rounded-xl overflow-hidden border border-orange-100 flex" style={{ minWidth: 220, maxWidth: 260 }}>
                      <div className="w-9 shrink-0 flex items-center justify-center" style={{ background: OFFER_COLORS[i % OFFER_COLORS.length], writingMode: 'vertical-rl' }}>
                        <span className="text-white text-[9px] font-black py-2 leading-none" style={{ transform: 'rotate(180deg)' }}>{offerLabel(offer)}</span>
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

          {/* ── Content by mode ─────────────────────────────────── */}
          <div id="inventory" style={{ scrollMarginTop: scrollMt }} className="mx-3 md:mx-6 mt-6 md:mt-8">

            {mode === 'home' && (
              <div className="space-y-12 md:space-y-16">
                {groups.map((g, i) => (
                  <section key={g.key} id={`grp-${g.key}`} data-spy={g.key} style={{ scrollMarginTop: scrollMt }}>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <Thumb src={g.image} label={g.label} size={48} />
                        <div className="min-w-0">
                          <h2 className="text-[22px] md:text-[28px] font-black text-gray-900 leading-none truncate">{g.label}</h2>
                          <p className="text-[12px] text-gray-400 mt-1">{g.items.length} items · {g.sections.length} {g.sections.length === 1 ? 'type' : 'types'}</p>
                        </div>
                      </div>
                      <button onClick={() => openGroup(g)} className="shrink-0 text-[13px] font-bold text-[#E5550F] hover:underline">View all →</button>
                    </div>

                    {g.sections.length > 1 && (
                      <div className="flex gap-2.5 overflow-x-auto pb-3 mb-3" style={{ scrollbarWidth: 'none' }}>
                        {g.sections.map(s => (
                          <button key={s.key} onClick={() => openSection(s)}
                            className="group shrink-0 flex items-center gap-2.5 pr-4 pl-1.5 py-1.5 rounded-full bg-white border border-gray-200 hover:border-[#E5550F] hover:shadow-sm transition-all">
                            <Thumb src={s.image} label={s.label} size={34} />
                            <span className="text-[13px] font-semibold text-gray-700 group-hover:text-[#E5550F]">{s.label}</span>
                            <span className="text-[11px] text-gray-400">{s.items.length}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {renderGrid(g.items.slice(0, 4))}
                    {g.items.length > 4 && (
                      <div className="mt-4 text-center">
                        <button onClick={() => openGroup(g)}
                          className="px-6 py-2 rounded-full border border-gray-300 text-[13px] font-semibold text-gray-700 hover:border-[#E5550F] hover:text-[#E5550F] transition-colors">
                          See all {g.items.length} in {g.label}
                        </button>
                      </div>
                    )}
                    {i === 0 && <div className="md:hidden mt-10 -mb-2">{renderUsp()}</div>}
                  </section>
                ))}
              </div>
            )}

            {mode === 'group' && activeGroup && (
              <div>
                {renderCrumbs()}
                <div className="flex items-center gap-3 mb-8">
                  <Thumb src={activeGroup.image} label={activeGroup.label} size={56} />
                  <div>
                    <h1 className="text-[26px] md:text-[34px] font-black text-gray-900 leading-none">{activeGroup.label}</h1>
                    <p className="text-[13px] text-gray-400 mt-1.5">{activeGroup.items.length} items across {activeGroup.sections.length} {activeGroup.sections.length === 1 ? 'type' : 'types'}</p>
                  </div>
                </div>
                <div className="space-y-12">
                  {activeGroup.sections.map(s => (
                    <section key={s.key} id={`sec-${s.cat}`} data-spy={s.cat} style={{ scrollMarginTop: scrollMt }}>
                      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
                        <Thumb src={s.image} label={s.label} size={36} />
                        <h2 className="text-[18px] md:text-[22px] font-black text-gray-900">{s.label}</h2>
                        <span className="text-[12px] text-gray-400 font-semibold bg-gray-100 rounded-full px-2.5 py-0.5">{s.items.length}</span>
                        <button onClick={() => openSection(s)} className="ml-auto text-[12px] font-bold text-[#E5550F] hover:underline">Open →</button>
                      </div>
                      {renderGrid(s.items)}
                    </section>
                  ))}
                </div>
              </div>
            )}

            {(mode === 'category' || mode === 'search') && (
              <div>
                {mode === 'category' && renderCrumbs()}
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <h1 className="text-[22px] md:text-[30px] font-black text-gray-900 truncate">
                    {mode === 'search'
                      ? <>Results for “<span className="text-[#E5550F]">{searchParams.get('q')}</span>”</>
                      : selectedSub ? <>{selectedSub} <span className="text-gray-400 font-medium">in {selectedCategory}</span></> : selectedCategory}
                  </h1>
                  <span className="text-[12px] md:text-[14px] text-gray-400 shrink-0">
                    <span className="font-semibold text-gray-600">{filteredProducts.length}</span> items
                  </span>
                </div>
                <div className="h-px bg-gray-200 mb-5" />
                {filteredProducts.length > 0 ? renderGrid(filteredProducts) : (
                  <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                    <MdCameraAlt className="text-5xl text-gray-200 mb-3" />
                    <p className="font-semibold text-gray-400 text-[15px]">{mode === 'search' ? `No results for "${searchParams.get('q')}"` : 'No gear here yet'}</p>
                    <button onClick={goHome} className="mt-2 text-[14px] text-[#E5550F] font-medium hover:underline">Show all gear</button>
                  </div>
                )}
              </div>
            )}
          </div>

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
                    href="mailto:lensmen@live.com"
                    className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#E5550F] hover:underline"
                  >
                    lensmen@live.com
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
