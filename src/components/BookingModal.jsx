import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import { differenceInDays, addDays } from 'date-fns'
import { useGlobal } from '../context/GlobalContext'
import { HiCalendar, HiClock, HiCheckCircle, HiClock as HiClockSolid, HiExclamationCircle, HiUpload } from 'react-icons/hi'

const BookingModal = ({ product, onClose, setAuthMode }) => {
  const { user, setUser, fetchProducts, setCart, cart, API_URL, rentalDates, fetchUserOrders } = useGlobal()
  const navigate = useNavigate()
  
  const isBulk = Array.isArray(product);
  const products = isBulk ? product : [product];

  const [bookingData, setBookingData] = useState({ 
    startDate: rentalDates.from || new Date(), 
    endDate: rentalDates.to || addDays(new Date(), 1),
    fullName: user?.fullName || '',
    email: user?.email || '',
    address: user?.address || '',
    mobile: user?.mobile || '',
    password: ''
  })

  // KYC Upload States during booking
  const [aadhaarFront, setAadhaarFront] = useState(null)
  const [aadhaarBack, setAadhaarBack] = useState(null)
  const [panFront, setPanFront] = useState(null)
  const [panBack, setPanBack] = useState(null)
  const [uploadingKyc, setUploadingKyc] = useState(false)
  const [showKycFormOverride, setShowKycFormOverride] = useState(false)

  const totalPerDay = products.reduce((sum, p) => sum + (p.pricePerDay || 0), 0);
  const duration = bookingData.startDate && bookingData.endDate 
    ? Math.max(1, Math.ceil(differenceInDays(bookingData.endDate, bookingData.startDate))) 
    : 0;

  const handleBooking = async (e) => {
    e.preventDefault()

    if (differenceInDays(bookingData.endDate, bookingData.startDate) > 10) {
      toast.error('Rental period cannot exceed 10 days')
      return
    }

    let currentUser = user;

    // 1. If not logged in, register the user first
    if (!currentUser) {
      if (!bookingData.password) {
        toast.error('Please choose a password to create your account')
        return
      }
      if (!aadhaarFront || !aadhaarBack || !panFront || !panBack) {
        toast.error('Please select all 4 KYC documents')
        return
      }

      setUploadingKyc(true)
      try {
        const regRes = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: bookingData.fullName,
            email: bookingData.email,
            password: bookingData.password,
            mobile: bookingData.mobile,
            address: bookingData.address,
            accountType: 'Private'
          })
        })
        const regData = await regRes.json()
        if (regRes.ok) {
          currentUser = regData.user
          setUser(regData.user)
        } else {
          toast.error(regData.message || 'Registration failed')
          setUploadingKyc(false)
          return
        }
      } catch (err) {
        toast.error('Error during registration')
        setUploadingKyc(false)
        return
      }
    }

    const needsKycUpload = showKycFormOverride || currentUser.kycStatus === 'Not Uploaded' || currentUser.kycStatus === 'Rejected'
    if (needsKycUpload && (!aadhaarFront || !aadhaarBack || !panFront || !panBack)) {
      toast.error('Please select all 4 KYC documents')
      return
    }

    setUploadingKyc(true)

    // 2. Upload KYC if required
    if (needsKycUpload) {
      try {
        const form = new FormData()
        form.append('email', currentUser.email)
        form.append('aadhaarFront', aadhaarFront)
        form.append('aadhaarBack', aadhaarBack)
        form.append('panFront', panFront)
        form.append('panBack', panBack)

        const kycRes = await fetch(`${API_URL}/user/kyc`, {
          method: 'POST',
          body: form
        })
        const kycData = await kycRes.json()
        if (kycRes.ok) {
          setUser(kycData)
        } else {
          toast.error(kycData.message || 'KYC Documents upload failed')
          setUploadingKyc(false)
          return
        }
      } catch (err) {
        toast.error('Error uploading KYC documents')
        setUploadingKyc(false)
        return
      }
    }

    // 3. Submit Booking
    try {
      const res = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: isBulk ? undefined : product._id,
          products: isBulk ? products : undefined,
          userName: bookingData.fullName,
          userEmail: bookingData.email,
          userAddress: bookingData.address,
          userMobile: bookingData.mobile,
          accountType: currentUser?.accountType || 'Private',
          startDate: bookingData.startDate,
          endDate: bookingData.endDate
        })
      })
      const data = await res.json()
      if (res.ok) {
        onClose()
        fetchProducts()
        fetchUserOrders()
        toast.success('Rental request submitted!')
        if (isBulk) {
          setCart([])
        } else {
          setCart(cart.filter(item => item._id !== product._id))
        }
        navigate('/my-orders', { state: { autoOpenOrderId: data._id } })
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('Booking failed')
    } finally {
      setUploadingKyc(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-start justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-none p-8 max-w-2xl w-full relative shadow-2xl border-t-8 border-primary my-8">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-300 hover:text-primary transition-colors p-2 text-2xl font-light">×</button>
        <div className="mb-6">
          <p className="text-primary font-black uppercase tracking-[0.3em] text-[12px] mb-1">Rental Details</p>
          <h2 className="text-[16px] font-black text-slate-900 uppercase tracking-widest leading-tight">
            {isBulk ? `Book ${products.length} Items` : `Book ${product.name}`}
          </h2>
          {isBulk && (
            <div className="mt-4 flex flex-wrap gap-2">
              {products.map(p => (
                <span key={p._id} className="bg-slate-50 text-slate-500 text-[12px] font-black px-2 py-1 rounded border border-slate-100 uppercase tracking-widest">{p.name}</span>
              ))}
            </div>
          )}
        </div>
        <form onSubmit={handleBooking} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
              <input
                type="text"
                required
                value={bookingData.fullName}
                onChange={e => setBookingData({ ...bookingData, fullName: e.target.value })}
                className="w-full border-b border-slate-100 p-2 font-black uppercase text-[12px] focus:border-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <input
                type="email"
                required
                value={bookingData.email}
                onChange={e => setBookingData({ ...bookingData, email: e.target.value })}
                className="w-full border-b border-slate-100 p-2 font-black text-[12px] focus:border-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
              <input
                type="tel"
                required
                placeholder="+91"
                value={bookingData.mobile}
                onChange={e => setBookingData({ ...bookingData, mobile: e.target.value })}
                className="w-full border-b border-slate-100 p-2 font-black text-[12px] focus:border-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">Address</label>
              <input
                type="text"
                required
                value={bookingData.address}
                onChange={e => setBookingData({ ...bookingData, address: e.target.value })}
                className="w-full border-b border-slate-100 p-2 font-black text-[12px] focus:border-primary outline-none transition-all"
              />
            </div>
            {!user && (
              <div className="space-y-1">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">Choose Password</label>
                <input
                  type="password"
                  required
                  placeholder="CREATE ACCOUNT PASSWORD"
                  value={bookingData.password}
                  onChange={e => setBookingData({ ...bookingData, password: e.target.value })}
                  className="w-full border-b border-slate-100 p-2 font-black text-[12px] focus:border-primary outline-none transition-all"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Already have an account? <button type="button" onClick={() => { setAuthMode('login'); onClose(); }} className="text-primary font-black underline">Log in here</button>
                </p>
              </div>
            )}

            {/* Date Range Picker */}
            <div className="md:col-span-2 space-y-1 relative">
              <label className="text-[12px] font-black text-primary uppercase tracking-widest ml-1">Rental Dates (Max 10 Days)</label>
              <div className="relative group">
                <DatePicker
                  selectsRange={true}
                  startDate={bookingData.startDate}
                  endDate={bookingData.endDate}
                  onChange={(dates) => {
                    const [start, end] = dates
                    setBookingData(prev => {
                      const newStart = start || prev.startDate
                      const newEnd = end
                      
                      // If times were already set, preserve them on the new dates
                      if (newStart && prev.startDate) newStart.setHours(prev.startDate.getHours(), prev.startDate.getMinutes())
                      if (newEnd && prev.endDate) newEnd.setHours(prev.endDate.getHours(), prev.endDate.getMinutes())
                      
                      return { ...prev, startDate: newStart, endDate: newEnd }
                    })
                  }}
                  dateFormat="dd/MM/yyyy"
                  minDate={new Date(new Date().setHours(0, 0, 0, 0))}
                  maxDate={bookingData.startDate ? addDays(bookingData.startDate, 10) : null}
                  isClearable={true}
                  className="w-full border-b border-slate-100 p-2 pl-8 font-black uppercase text-[12px] focus:border-primary outline-none transition-all cursor-pointer"
                  wrapperClassName="w-full"
                  popperProps={{ strategy: "fixed" }}
                />
                <HiCalendar className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-primary transition-colors" />
              </div>
            </div>

            {/* Receive Time */}
            <div className="space-y-1 relative">
              <label className="text-[12px] font-black text-primary uppercase tracking-widest ml-1">Receive Time</label>
              <div className="relative group">
                <DatePicker
                  selected={bookingData.startDate}
                  onChange={time => {
                    const updated = new Date(bookingData.startDate)
                    updated.setHours(time.getHours(), time.getMinutes())
                    setBookingData({ ...bookingData, startDate: updated })
                  }}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={30}
                  timeCaption="Time"
                  dateFormat="h:mm aa"
                  minTime={new Date(new Date().setHours(0, 0, 0, 0))}
                  maxTime={new Date(new Date().setHours(23, 30, 0, 0))}
                  className="w-full border-b border-slate-100 p-2 pl-8 font-black uppercase text-[12px] focus:border-primary outline-none transition-all cursor-pointer"
                  wrapperClassName="w-full"
                  popperProps={{ strategy: "fixed" }}
                />
                <HiClock className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-primary transition-colors" />
              </div>
            </div>

            {/* Return Time */}
            <div className="space-y-1 relative">
              <label className="text-[12px] font-black text-primary uppercase tracking-widest ml-1">Return Time</label>
              <div className="relative group">
                <DatePicker
                  selected={bookingData.endDate}
                  onChange={time => {
                    const updated = new Date(bookingData.endDate)
                    updated.setHours(time.getHours(), time.getMinutes())
                    setBookingData({ ...bookingData, endDate: updated })
                  }}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={30}
                  timeCaption="Time"
                  dateFormat="h:mm aa"
                  minTime={new Date(new Date().setHours(0, 0, 0, 0))}
                  maxTime={new Date(new Date().setHours(23, 30, 0, 0))}
                  className="w-full border-b border-slate-100 p-2 pl-8 font-black uppercase text-[12px] focus:border-primary outline-none transition-all cursor-pointer"
                  wrapperClassName="w-full"
                  popperProps={{ strategy: "fixed" }}
                />
                <HiClock className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-primary transition-colors" />
              </div>
            </div>
          </div>

          {/* KYC Status & Inputs */}
          {user ? (
            <div className="mt-4">
              {!showKycFormOverride && user.kycStatus === 'Approved' ? (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center space-x-3">
                    <HiCheckCircle className="text-emerald-600 text-xl shrink-0" />
                    <div>
                      <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">KYC Status: Verified</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Your profile is verified. Request will be submitted for approval.</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setShowKycFormOverride(true)}
                    className="text-[9px] text-brand-navy font-black hover:text-primary uppercase tracking-widest border border-slate-200 bg-white px-2.5 py-1.5 rounded-lg transition-all shrink-0"
                  >
                    Update
                  </button>
                </div>
              ) : !showKycFormOverride && user.kycStatus === 'Pending' ? (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center space-x-3">
                    <HiClockSolid className="text-amber-600 text-xl shrink-0 animate-pulse" />
                    <div>
                      <p className="text-[11px] font-black text-amber-600 uppercase tracking-widest">KYC Status: Pending Verification</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">You can submit this request. Admin will approve it after verifying your uploaded documents.</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setShowKycFormOverride(true)}
                    className="text-[9px] text-brand-navy font-black hover:text-primary uppercase tracking-widest border border-slate-200 bg-white px-2.5 py-1.5 rounded-lg transition-all shrink-0"
                  >
                    Update
                  </button>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-[11px] font-black text-brand-navy uppercase tracking-widest flex items-center">
                        <HiUpload className="mr-2 text-primary" /> KYC Documents Required
                      </h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">Rental requests require Aadhaar & PAN verification. Upload below:</p>
                      {user.kycStatus === 'Rejected' && user.kycRejectionReason && (
                        <p className="text-[9px] text-rose-600 font-black uppercase mt-1">Previous Rejection Reason: "{user.kycRejectionReason}"</p>
                      )}
                    </div>
                    {(user.kycStatus === 'Approved' || user.kycStatus === 'Pending') && (
                      <button 
                        type="button" 
                        onClick={() => setShowKycFormOverride(false)}
                        className="text-[9px] text-slate-400 hover:text-slate-600 font-black uppercase tracking-widest"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Aadhaar Front</label>
                      <input 
                        type="file" accept="image/*" required
                        onChange={e => setAadhaarFront(e.target.files[0])}
                        className="w-full bg-white border border-slate-100 p-1.5 rounded-lg text-[12px] font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Aadhaar Back</label>
                      <input 
                        type="file" accept="image/*" required
                        onChange={e => setAadhaarBack(e.target.files[0])}
                        className="w-full bg-white border border-slate-100 p-1.5 rounded-lg text-[12px] font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">PAN Front</label>
                      <input 
                        type="file" accept="image/*" required
                        onChange={e => setPanFront(e.target.files[0])}
                        className="w-full bg-white border border-slate-100 p-1.5 rounded-lg text-[12px] font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">PAN Back</label>
                      <input 
                        type="file" accept="image/*" required
                        onChange={e => setPanBack(e.target.files[0])}
                        className="w-full bg-white border border-slate-100 p-1.5 rounded-lg text-[12px] font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
              <div>
                <h4 className="text-[11px] font-black text-brand-navy uppercase tracking-widest flex items-center">
                  <HiUpload className="mr-2 text-primary" /> KYC Documents Required
                </h4>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">Rental requests require Aadhaar & PAN verification. Upload below:</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Aadhaar Front</label>
                  <input 
                    type="file" accept="image/*" required
                    onChange={e => setAadhaarFront(e.target.files[0])}
                    className="w-full bg-white border border-slate-100 p-1.5 rounded-lg text-[12px] font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Aadhaar Back</label>
                  <input 
                    type="file" accept="image/*" required
                    onChange={e => setAadhaarBack(e.target.files[0])}
                    className="w-full bg-white border border-slate-100 p-1.5 rounded-lg text-[12px] font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">PAN Front</label>
                  <input 
                    type="file" accept="image/*" required
                    onChange={e => setPanFront(e.target.files[0])}
                    className="w-full bg-white border border-slate-100 p-1.5 rounded-lg text-[12px] font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">PAN Back</label>
                  <input 
                    type="file" accept="image/*" required
                    onChange={e => setPanBack(e.target.files[0])}
                    className="w-full bg-white border border-slate-100 p-1.5 rounded-lg text-[12px] font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center mt-4">
            <div>
              <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">Rental Duration</p>
              <p className="text-[12px] font-black text-brand-navy uppercase">
                {duration} Day(s)
              </p>
            </div>
            <div className="text-right">
              <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">Estimated Total</p>
              <p className="text-[18px] font-black text-primary">
                ₹{(duration * totalPerDay).toLocaleString()}
              </p>
            </div>
          </div>

          <button 
            type="submit" disabled={uploadingKyc}
            className="w-full bg-brand-navy text-white p-5 rounded-xl font-black text-[14px] uppercase tracking-widest hover:bg-primary transition-all shadow-lg shadow-orange-100 mt-4 disabled:opacity-50"
          >
            {uploadingKyc ? 'Uploading KYC & Booking...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default BookingModal
