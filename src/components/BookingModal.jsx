import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import { differenceInDays, addDays } from 'date-fns'
import { useGlobal, getImageUrl } from '../context/GlobalContext'
import { getAdminSettings } from '../pages/admin/Settings'
import {
  HiCalendar, HiClock, HiCheckCircle, HiClock as HiClockSolid,
  HiX, HiTag, HiExclamationCircle, HiOutlineBell,
} from 'react-icons/hi'

const BookingModal = ({ product, onClose, setAuthMode }) => {
  const { user, setUser, fetchProducts, setCart, cart, API_URL, rentalDates, rentalQty, fetchUserOrders, refreshUser } = useGlobal()
  const navigate = useNavigate()

  const isBulk      = Array.isArray(product)
  const products    = isBulk ? product : [product]
  const qty         = isBulk ? 1 : Math.max(1, rentalQty || 1)
  const maxRentalDays = getAdminSettings().maxRentalDays || 10

  const [bookingData, setBookingData] = useState({
    startDate: rentalDates.from || new Date(),
    endDate:   rentalDates.to   || addDays(new Date(), 1),
    fullName:  user?.fullName || '',
    email:     user?.email    || '',
    address:   user?.address  || '',
    mobile:    user?.mobile   || '',
    password:  '',
    notes:     '',
  })

  const [offerCode,          setOfferCode]          = useState('')
  const [appliedOffer,       setAppliedOffer]        = useState(null)
  const [offerLoading,       setOfferLoading]        = useState(false)
  const [offerError,         setOfferError]          = useState('')
  const [submitting,         setSubmitting]          = useState(false)
  const [kycReminderSent,    setKycReminderSent]     = useState(false)
  const [kycReminderLoading, setKycReminderLoading]  = useState(false)

  // Refresh user on open so KYC status reflects latest admin changes
  useEffect(() => { refreshUser() }, [])

  const totalPerDay = products.reduce((s, p) => s + (p.pricePerDay || 0), 0) * qty
  const duration    = bookingData.startDate && bookingData.endDate
    ? Math.max(1, Math.ceil(differenceInDays(bookingData.endDate, bookingData.startDate)))
    : 0
  const subtotal   = duration * totalPerDay
  const discount   = appliedOffer?.discount || 0
  const finalTotal = Math.max(0, subtotal - discount)

  const handleApplyOffer = async () => {
    if (!offerCode.trim()) return
    setOfferLoading(true); setOfferError('')
    try {
      const res  = await fetch(`${API_URL}/offers/validate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: offerCode.trim(), orderAmount: subtotal }),
      })
      const data = await res.json()
      if (res.ok) { setAppliedOffer(data); toast.success(data.message) }
      else { setOfferError(data.message); setAppliedOffer(null) }
    } catch { setOfferError('Could not validate offer.') }
    finally { setOfferLoading(false) }
  }

  const handleRemoveOffer = () => { setAppliedOffer(null); setOfferCode(''); setOfferError('') }

  const sendKycReminder = async () => {
    setKycReminderLoading(true)
    try {
      const res = await fetch(`${API_URL}/user/kyc-reminder`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      })
      if (res.ok) { setKycReminderSent(true); toast.success('Reminder sent to admin!') }
      else toast.error('Could not send reminder')
    } catch { toast.error('Could not send reminder') }
    finally { setKycReminderLoading(false) }
  }

  const handleBooking = async (e) => {
    e.preventDefault()
    if (differenceInDays(bookingData.endDate, bookingData.startDate) > maxRentalDays) {
      toast.error(`Rental period cannot exceed ${maxRentalDays} days`); return
    }

    let currentUser = user
    setSubmitting(true)

    if (!currentUser) {
      if (!bookingData.password) { toast.error('Please choose a password'); setSubmitting(false); return }
      try {
        const r = await fetch(`${API_URL}/auth/register`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: bookingData.fullName, email: bookingData.email,
            password: bookingData.password, mobile: bookingData.mobile,
            address: bookingData.address, accountType: 'Private',
          }),
        })
        const d = await r.json()
        if (r.ok) { currentUser = d.user; setUser(d.user) }
        else { toast.error(d.message || 'Registration failed'); setSubmitting(false); return }
      } catch { toast.error('Registration error'); setSubmitting(false); return }
    }

    try {
      const res = await fetch(`${API_URL}/bookings`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId:   isBulk ? undefined : product._id,
          products:    isBulk ? products  : undefined,
          userName:    bookingData.fullName,
          userEmail:   bookingData.email,
          userAddress: bookingData.address,
          userMobile:  bookingData.mobile,
          accountType: currentUser?.accountType || 'Private',
          startDate:   bookingData.startDate,
          endDate:     bookingData.endDate,
          quantity:    qty,
          notes:       bookingData.notes || undefined,
          offerCode:   appliedOffer?.code || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        onClose(); fetchProducts(); fetchUserOrders()
        toast.success('Rental request submitted!')
        if (isBulk) setCart([])
        else setCart(cart.filter(i => i._id !== product._id))
        navigate('/dashboard/orders', { state: { autoOpenOrderId: data._id } })
      } else { toast.error(data.message) }
    } catch { toast.error('Booking failed') }
    finally { setSubmitting(false) }
  }

  // ── KYC status block (status display only — no upload) ────────────────
  const KycBlock = () => {
    if (!user) return null

    if (user.kycStatus === 'Approved') {
      return (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <HiCheckCircle className="text-emerald-500 text-xl shrink-0" />
          <div>
            <p className="text-[12px] font-bold text-emerald-700">KYC Verified</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Your identity is verified and on file.</p>
          </div>
        </div>
      )
    }

    if (user.kycStatus === 'Pending') {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-3">
          <div className="flex items-center gap-3">
            <HiClockSolid className="text-amber-500 text-xl shrink-0 animate-pulse" />
            <div>
              <p className="text-[12px] font-bold text-amber-700">KYC Under Review</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Documents submitted — awaiting admin verification.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={sendKycReminder}
            disabled={kycReminderSent || kycReminderLoading}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold transition-all ${
              kycReminderSent
                ? 'bg-green-100 text-green-600 border border-green-200 cursor-default'
                : 'bg-amber-500 hover:bg-amber-600 text-white'
            }`}
          >
            <HiOutlineBell className="text-base" />
            {kycReminderSent ? 'Reminder Sent ✓' : kycReminderLoading ? 'Sending…' : 'Request KYC Approval'}
          </button>
        </div>
      )
    }

    // Not Uploaded or Rejected
    return (
      <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
        <HiExclamationCircle className="text-red-500 text-xl shrink-0 mt-0.5" />
        <div>
          <p className="text-[12px] font-bold text-red-600">
            {user.kycStatus === 'Rejected' ? 'KYC Rejected' : 'KYC Not Approved'}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {user.kycStatus === 'Rejected' && user.kycRejectionReason
              ? `Reason: "${user.kycRejectionReason}". Please re-upload via your dashboard.`
              : 'Please upload your ID documents via your dashboard to get verified.'}
          </p>
        </div>
      </div>
    )
  }

  const inputCls = "w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-white outline-none focus:border-white/40 placeholder:text-white/30 transition-colors"

  return (
    <div
      className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <form
        onSubmit={handleBooking}
        className="bg-white rounded-2xl w-full max-w-[900px] relative shadow-2xl overflow-hidden flex flex-col md:flex-row"
        style={{ maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ══ LEFT: dark panel ══════════════════════════════════════════ */}
        <div className="bg-[#1a1a2e] md:w-[340px] shrink-0 flex flex-col p-6 overflow-y-auto">

          {/* Product header */}
          <div className="flex items-start gap-3 mb-6">
            <div className="w-14 h-14 rounded-xl bg-white/10 overflow-hidden flex items-center justify-center shrink-0">
              <img src={getImageUrl(products[0]?.imageUrl)} alt="" className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mb-0.5">
                {isBulk ? `${products.length} Items` : 'Rental Request'}
              </p>
              <h2 className="text-white font-bold text-[15px] leading-snug line-clamp-2">
                {isBulk ? products.map(p => p.name).join(', ') : product.name}
              </h2>
            </div>
            <button type="button" onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/50 hover:text-white flex items-center justify-center transition-all shrink-0">
              <HiX className="text-sm" />
            </button>
          </div>

          {/* Rental dates */}
          <div className="mb-4">
            <label className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] flex items-center gap-1.5 mb-2">
              <HiCalendar className="text-[#E5550F]" /> Rental Dates
            </label>
            <DatePicker
              selectsRange startDate={bookingData.startDate} endDate={bookingData.endDate}
              onChange={([s, e]) => setBookingData(p => ({ ...p, startDate: s || p.startDate, endDate: e }))}
              dateFormat="dd MMM yyyy" minDate={new Date()}
              maxDate={bookingData.startDate ? addDays(bookingData.startDate, maxRentalDays) : null}
              isClearable className={inputCls} wrapperClassName="w-full"
              popperProps={{ strategy: 'fixed' }}
            />
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div>
              <label className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] flex items-center gap-1.5 mb-2">
                <HiClock className="text-[#E5550F]" /> Pickup Time
              </label>
              <DatePicker
                selected={bookingData.startDate}
                onChange={t => { const d = new Date(bookingData.startDate); d.setHours(t.getHours(), t.getMinutes()); setBookingData(p => ({ ...p, startDate: d })) }}
                showTimeSelect showTimeSelectOnly timeIntervals={30} timeCaption="Time" dateFormat="h:mm aa"
                minTime={new Date(new Date().setHours(0,0,0,0))} maxTime={new Date(new Date().setHours(23,30,0,0))}
                className={inputCls} wrapperClassName="w-full" popperProps={{ strategy: 'fixed' }}
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] flex items-center gap-1.5 mb-2">
                <HiClock className="text-[#E5550F]" /> Return Time
              </label>
              <DatePicker
                selected={bookingData.endDate}
                onChange={t => { const d = new Date(bookingData.endDate || bookingData.startDate); d.setHours(t.getHours(), t.getMinutes()); setBookingData(p => ({ ...p, endDate: d })) }}
                showTimeSelect showTimeSelectOnly timeIntervals={30} timeCaption="Time" dateFormat="h:mm aa"
                minTime={new Date(new Date().setHours(0,0,0,0))} maxTime={new Date(new Date().setHours(23,30,0,0))}
                className={inputCls} wrapperClassName="w-full" popperProps={{ strategy: 'fixed' }}
              />
            </div>
          </div>

          {/* Pricing summary */}
          <div className="mt-auto rounded-2xl bg-white/8 border border-white/10 px-5 py-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-white/50 text-[12px]">
                {qty > 1 ? `${qty} units · ` : ''}{duration} day{duration !== 1 ? 's' : ''} rental
              </p>
              <p className="text-white/70 text-[13px]">₹{subtotal.toLocaleString()}</p>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-green-400 text-[12px]">Offer ({appliedOffer.code})</p>
                <p className="text-green-400 text-[13px]">−₹{discount.toLocaleString()}</p>
              </div>
            )}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <p className="text-white/50 text-[11px] font-bold uppercase tracking-wider">Estimated Total</p>
              <div className="text-right">
                {discount > 0 && (
                  <p className="text-[11px] text-white/25 line-through">₹{subtotal.toLocaleString()}</p>
                )}
                <p className="text-[32px] font-black text-[#E5550F] leading-none">₹{finalTotal.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ══ RIGHT: white form panel ═══════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* User info */}
          {user ? (
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-[#1a1a2e] flex items-center justify-center text-white font-bold text-[15px] shrink-0">
                {user.fullName?.charAt(0)?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-gray-900">{user.fullName}</p>
                <p className="text-[12px] text-gray-400">{user.email}</p>
                {user.mobile && <p className="text-[12px] text-gray-400">{user.mobile}</p>}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Full Name', key: 'fullName', type: 'text' },
                  { label: 'Email',     key: 'email',    type: 'email' },
                  { label: 'Mobile',    key: 'mobile',   type: 'tel' },
                  { label: 'Address',   key: 'address',  type: 'text' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">{f.label}</label>
                    <input type={f.type} required value={bookingData[f.key]}
                      onChange={e => setBookingData({ ...bookingData, [f.key]: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] font-medium text-gray-800 outline-none focus:border-[#E5550F] transition-colors" />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                  Password <span className="text-gray-300 font-normal normal-case tracking-normal">(creates your account)</span>
                </label>
                <input type="password" required value={bookingData.password}
                  onChange={e => setBookingData({ ...bookingData, password: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] font-medium text-gray-800 outline-none focus:border-[#E5550F] transition-colors" />
                <p className="text-[10px] text-gray-400 mt-1">
                  Have an account?{' '}
                  <button type="button" onClick={() => { setAuthMode('login'); onClose() }} className="text-[#E5550F] font-bold underline">Sign in</button>
                </p>
              </div>
            </div>
          )}

          {/* KYC status (logged-in only, no upload) */}
          {user && <KycBlock />}

          {/* Notes */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
              Notes <span className="text-gray-300 font-normal normal-case tracking-normal">(optional)</span>
            </label>
            <textarea rows={3} placeholder="Any special instructions or requirements…"
              value={bookingData.notes} onChange={e => setBookingData(p => ({ ...p, notes: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] text-gray-700 outline-none focus:border-[#E5550F] transition-colors resize-none bg-gray-50" />
          </div>

          {/* Offer code */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 flex items-center gap-1.5">
              <HiTag className="text-[#E5550F]" /> Offer / Promo Code
            </label>
            {appliedOffer ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <div>
                  <p className="text-[13px] font-bold text-green-700">{appliedOffer.code} applied</p>
                  <p className="text-[11px] text-green-600">You save ₹{appliedOffer.discount.toLocaleString()}</p>
                </div>
                <button type="button" onClick={handleRemoveOffer} className="text-[11px] text-red-400 hover:text-red-600 font-semibold">Remove</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input type="text" value={offerCode}
                  onChange={e => { setOfferCode(e.target.value.toUpperCase()); setOfferError('') }}
                  placeholder="Enter offer code"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] font-medium text-gray-800 outline-none focus:border-[#E5550F] transition-colors uppercase placeholder:normal-case placeholder:font-normal" />
                <button type="button" onClick={handleApplyOffer}
                  disabled={offerLoading || !offerCode.trim()}
                  className="bg-gray-900 text-white px-5 py-2 rounded-xl text-[12px] font-semibold hover:bg-[#E5550F] transition-colors disabled:opacity-40 shrink-0">
                  {offerLoading ? '…' : 'Apply'}
                </button>
              </div>
            )}
            {offerError && <p className="text-[11px] text-red-500 mt-1.5">{offerError}</p>}
          </div>

          {/* Submit */}
          <button type="submit" disabled={submitting}
            className="w-full bg-[#E5550F] hover:bg-[#c2410c] text-white py-4 rounded-xl font-bold text-[14px] uppercase tracking-widest transition-all disabled:opacity-50 shadow-[0_4px_20px_rgba(229,85,15,0.35)]">
            {submitting ? 'Processing…' : 'Submit Rental Request'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default BookingModal
