import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import { differenceInDays, addDays, format } from 'date-fns'
import { useGlobal } from '../context/GlobalContext'
import {
  HiCalendar, HiClock, HiCheckCircle, HiClock as HiClockSolid,
  HiExclamationCircle, HiUpload, HiOutlineUser, HiX,
} from 'react-icons/hi'

const BookingModal = ({ product, onClose, setAuthMode }) => {
  const { user, setUser, fetchProducts, setCart, cart, API_URL, rentalDates, rentalQty, fetchUserOrders } = useGlobal()
  const navigate = useNavigate()

  const isBulk    = Array.isArray(product)
  const products  = isBulk ? product : [product]
  const qty       = isBulk ? 1 : Math.max(1, rentalQty || 1)

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

  const [aadhaarFront,      setAadhaarFront]      = useState(null)
  const [aadhaarBack,       setAadhaarBack]        = useState(null)
  const [panFront,          setPanFront]           = useState(null)
  const [panBack,           setPanBack]            = useState(null)
  const [uploadingKyc,      setUploadingKyc]       = useState(false)
  const [showKycFormOverride, setShowKycFormOverride] = useState(false)

  const totalPerDay = products.reduce((s, p) => s + (p.pricePerDay || 0), 0) * qty
  const duration    = bookingData.startDate && bookingData.endDate
    ? Math.max(1, Math.ceil(differenceInDays(bookingData.endDate, bookingData.startDate)))
    : 0

  const handleBooking = async (e) => {
    e.preventDefault()
    if (differenceInDays(bookingData.endDate, bookingData.startDate) > 10) {
      toast.error('Rental period cannot exceed 10 days'); return
    }

    let currentUser = user

    if (!currentUser) {
      if (!bookingData.password) { toast.error('Please choose a password'); return }
      if (!aadhaarFront || !aadhaarBack || !panFront || !panBack) { toast.error('Please upload all 4 KYC documents'); return }
      setUploadingKyc(true)
      try {
        const r = await fetch(`${API_URL}/auth/register`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName: bookingData.fullName, email: bookingData.email, password: bookingData.password, mobile: bookingData.mobile, address: bookingData.address, accountType: 'Private' }),
        })
        const d = await r.json()
        if (r.ok) { currentUser = d.user; setUser(d.user) }
        else { toast.error(d.message || 'Registration failed'); setUploadingKyc(false); return }
      } catch { toast.error('Registration error'); setUploadingKyc(false); return }
    }

    const needsKyc = showKycFormOverride || currentUser.kycStatus === 'Not Uploaded' || currentUser.kycStatus === 'Rejected'
    if (needsKyc && (!aadhaarFront || !aadhaarBack || !panFront || !panBack)) {
      toast.error('Please upload all 4 KYC documents'); return
    }
    setUploadingKyc(true)

    if (needsKyc) {
      try {
        const form = new FormData()
        form.append('email', currentUser.email)
        form.append('aadhaarFront', aadhaarFront); form.append('aadhaarBack', aadhaarBack)
        form.append('panFront', panFront);         form.append('panBack', panBack)
        const r = await fetch(`${API_URL}/user/kyc`, { method: 'POST', body: form })
        const d = await r.json()
        if (r.ok) setUser(d)
        else { toast.error(d.message || 'KYC upload failed'); setUploadingKyc(false); return }
      } catch { toast.error('KYC upload error'); setUploadingKyc(false); return }
    }

    try {
      const res = await fetch(`${API_URL}/bookings`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: isBulk ? undefined : product._id,
          products:  isBulk ? products : undefined,
          userName:    bookingData.fullName,
          userEmail:   bookingData.email,
          userAddress: bookingData.address,
          userMobile:  bookingData.mobile,
          accountType: currentUser?.accountType || 'Private',
          startDate:   bookingData.startDate,
          endDate:     bookingData.endDate,
          quantity:    qty,
          notes:       bookingData.notes || undefined,
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
    finally { setUploadingKyc(false) }
  }

  // ── KYC block (shared for logged-in users) ────────────────────────────
  const KycBlock = () => {
    if (!user) return null
    if (!showKycFormOverride && user.kycStatus === 'Approved') {
      return (
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2.5">
            <HiCheckCircle className="text-emerald-500 text-lg flex-shrink-0" />
            <div>
              <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">KYC Verified</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Your identity is verified and on file.</p>
            </div>
          </div>
          <button type="button" onClick={() => setShowKycFormOverride(true)}
            className="text-[10px] font-bold text-slate-400 hover:text-slate-700 border border-slate-200 bg-white px-2.5 py-1 rounded-lg transition-all">
            Update
          </button>
        </div>
      )
    }
    if (!showKycFormOverride && user.kycStatus === 'Pending') {
      return (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2.5">
            <HiClockSolid className="text-amber-500 text-lg flex-shrink-0 animate-pulse" />
            <div>
              <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">KYC Pending Review</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Admin will verify your documents before approval.</p>
            </div>
          </div>
          <button type="button" onClick={() => setShowKycFormOverride(true)}
            className="text-[10px] font-bold text-slate-400 hover:text-slate-700 border border-slate-200 bg-white px-2.5 py-1 rounded-lg transition-all">
            Update
          </button>
        </div>
      )
    }
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HiUpload className="text-primary text-base" />
            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Upload KYC Documents</p>
          </div>
          {(user.kycStatus === 'Approved' || user.kycStatus === 'Pending') && (
            <button type="button" onClick={() => setShowKycFormOverride(false)}
              className="text-[10px] text-slate-400 hover:text-slate-600 font-bold">Cancel</button>
          )}
        </div>
        {user.kycStatus === 'Rejected' && user.kycRejectionReason && (
          <p className="text-[10px] text-red-500 font-semibold">Rejection reason: "{user.kycRejectionReason}"</p>
        )}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Aadhaar Front', set: setAadhaarFront },
            { label: 'Aadhaar Back',  set: setAadhaarBack },
            { label: 'PAN Front',     set: setPanFront },
            { label: 'PAN Back',      set: setPanBack },
          ].map(d => (
            <div key={d.label}>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{d.label}</label>
              <input type="file" accept="image/*" required onChange={e => d.set(e.target.files[0])}
                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px]" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-md relative shadow-2xl my-8 overflow-hidden">

        {/* Top accent */}
        <div className="h-1 bg-primary" />

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div>
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.25em] mb-1">
              {isBulk ? `Booking ${products.length} Items` : 'Rental Confirmation'}
            </p>
            <h2 className="text-[16px] font-bold text-[#1a1a2e] leading-tight">
              {isBulk ? (
                <span>{products.map(p => p.name).join(', ')}</span>
              ) : product.name}
            </h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-400 flex items-center justify-center transition-all flex-shrink-0 mt-0.5">
            <HiX className="text-sm" />
          </button>
        </div>

        <form onSubmit={handleBooking} className="px-6 py-5 space-y-4">

          {/* ── Logged-in: user info card (read-only) ── */}
          {user && (
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
              <div className="w-9 h-9 rounded-full bg-[#1a1a2e] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {user.fullName?.charAt(0)?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[#1a1a2e] truncate">{user.fullName}</p>
                <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                {user.mobile && <p className="text-[11px] text-slate-400">{user.mobile}</p>}
              </div>
            </div>
          )}

          {/* ── Not logged-in: full registration form ── */}
          {!user && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Full Name',    key: 'fullName', type: 'text' },
                  { label: 'Email',        key: 'email',    type: 'email' },
                  { label: 'Mobile',       key: 'mobile',   type: 'tel' },
                  { label: 'Address',      key: 'address',  type: 'text' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{f.label}</label>
                    <input type={f.type} required value={bookingData[f.key]}
                      onChange={e => setBookingData({ ...bookingData, [f.key]: e.target.value })}
                      className="w-full border-b border-slate-200 pb-1.5 text-[13px] font-medium text-slate-800 outline-none focus:border-primary transition-colors" />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  Choose Password <span className="text-slate-300 font-normal normal-case tracking-normal">(creates your account)</span>
                </label>
                <input type="password" required value={bookingData.password}
                  onChange={e => setBookingData({ ...bookingData, password: e.target.value })}
                  className="w-full border-b border-slate-200 pb-1.5 text-[13px] font-medium text-slate-800 outline-none focus:border-primary transition-colors" />
                <p className="text-[10px] text-slate-400 mt-1">
                  Have an account?{' '}
                  <button type="button" onClick={() => { setAuthMode('login'); onClose() }} className="text-primary font-bold underline">Sign in</button>
                </p>
              </div>
            </div>
          )}

          {/* ── Dates + times ── */}
          <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-3">
            {/* Date range */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 flex items-center gap-1.5">
                <HiCalendar className="text-primary" /> Rental Dates
              </label>
              <DatePicker
                selectsRange startDate={bookingData.startDate} endDate={bookingData.endDate}
                onChange={([s, e]) => setBookingData(p => ({ ...p, startDate: s || p.startDate, endDate: e }))}
                dateFormat="dd MMM yyyy"
                minDate={new Date()}
                maxDate={bookingData.startDate ? addDays(bookingData.startDate, 10) : null}
                isClearable
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13px] font-semibold text-slate-700 outline-none focus:border-primary"
                wrapperClassName="w-full"
                popperProps={{ strategy: 'fixed' }}
              />
            </div>

            {/* Times */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 flex items-center gap-1.5">
                  <HiClock className="text-primary" /> Pickup Time
                </label>
                <DatePicker
                  selected={bookingData.startDate}
                  onChange={t => { const d = new Date(bookingData.startDate); d.setHours(t.getHours(), t.getMinutes()); setBookingData(p => ({ ...p, startDate: d })) }}
                  showTimeSelect showTimeSelectOnly timeIntervals={30} timeCaption="Time" dateFormat="h:mm aa"
                  minTime={new Date(new Date().setHours(0,0,0,0))} maxTime={new Date(new Date().setHours(23,30,0,0))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13px] font-semibold text-slate-700 outline-none focus:border-primary"
                  wrapperClassName="w-full"
                  popperProps={{ strategy: 'fixed' }}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 flex items-center gap-1.5">
                  <HiClock className="text-primary" /> Return Time
                </label>
                <DatePicker
                  selected={bookingData.endDate}
                  onChange={t => { const d = new Date(bookingData.endDate || bookingData.startDate); d.setHours(t.getHours(), t.getMinutes()); setBookingData(p => ({ ...p, endDate: d })) }}
                  showTimeSelect showTimeSelectOnly timeIntervals={30} timeCaption="Time" dateFormat="h:mm aa"
                  minTime={new Date(new Date().setHours(0,0,0,0))} maxTime={new Date(new Date().setHours(23,30,0,0))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13px] font-semibold text-slate-700 outline-none focus:border-primary"
                  wrapperClassName="w-full"
                  popperProps={{ strategy: 'fixed' }}
                />
              </div>
            </div>
          </div>

          {/* ── KYC ── */}
          {user ? <KycBlock /> : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <HiUpload className="text-primary text-base" />
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">KYC Documents Required</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Aadhaar Front', set: setAadhaarFront },
                  { label: 'Aadhaar Back',  set: setAadhaarBack },
                  { label: 'PAN Front',     set: setPanFront },
                  { label: 'PAN Back',      set: setPanBack },
                ].map(d => (
                  <div key={d.label}>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{d.label}</label>
                    <input type="file" accept="image/*" required onChange={e => d.set(e.target.files[0])}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px]" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Notes ── */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
              Notes <span className="text-slate-300 font-normal normal-case tracking-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Any special instructions or requirements…"
              value={bookingData.notes}
              onChange={e => setBookingData(p => ({ ...p, notes: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] text-slate-700 outline-none focus:border-primary transition-colors resize-none bg-slate-50"
            />
          </div>

          {/* ── Summary ── */}
          <div className="flex items-center justify-between bg-[#1a1a2e] rounded-xl px-5 py-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {qty > 1 ? `${qty} units · Duration` : 'Duration'}
              </p>
              <p className="text-[15px] font-bold text-white">
                {duration} day{duration !== 1 ? 's' : ''}
                {qty > 1 && <span className="text-slate-400 font-medium text-[12px]"> × {qty}</span>}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated Total</p>
              <p className="text-[22px] font-bold text-primary">₹{(duration * totalPerDay).toLocaleString()}</p>
            </div>
          </div>

          {/* ── Submit ── */}
          <button type="submit" disabled={uploadingKyc}
            className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-bold text-[14px] uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg shadow-orange-100">
            {uploadingKyc ? 'Processing…' : 'Submit Rental Request'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default BookingModal
