import { useState } from 'react'
import { useGlobal } from '../context/GlobalContext'
import toast from 'react-hot-toast'
import * as Icons from 'react-icons/hi'

const ProfilePage = () => {
  const { user, updateProfile, setUser, API_URL } = useGlobal()
  const [loading, setLoading] = useState(false)
  const [uploadingKyc, setUploadingKyc] = useState(false)
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    mobile: user?.mobile || '',
    address: user?.address || ''
  })

  // KYC States
  const [aadhaarFront, setAadhaarFront] = useState(null)
  const [aadhaarBack, setAadhaarBack] = useState(null)
  const [panFront, setPanFront] = useState(null)
  const [panBack, setPanBack] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const res = await updateProfile(formData)
    setLoading(false)
    if (res.success) {
      toast.success('Profile updated successfully!')
    } else {
      toast.error(res.message || 'Update failed')
    }
  }

  const handleKycSubmit = async (e) => {
    e.preventDefault()
    if (!aadhaarFront || !aadhaarBack || !panFront || !panBack) {
      toast.error('Please select all 4 KYC documents')
      return
    }

    setUploadingKyc(true)
    const form = new FormData()
    form.append('email', user.email)
    form.append('aadhaarFront', aadhaarFront)
    form.append('aadhaarBack', aadhaarBack)
    form.append('panFront', panFront)
    form.append('panBack', panBack)

    try {
      const res = await fetch(`${API_URL}/user/kyc`, {
        method: 'POST',
        body: form
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('KYC Documents uploaded successfully!')
        setUser(data)
        // Reset inputs
        setAadhaarFront(null)
        setAadhaarBack(null)
        setPanFront(null)
        setPanBack(null)
      } else {
        toast.error(data.message || 'KYC Upload failed')
      }
    } catch (err) {
      toast.error('Error uploading KYC documents')
    } finally {
      setUploadingKyc(false)
    }
  }

  const getKycBanner = () => {
    const status = user?.kycStatus || 'Not Uploaded'
    switch (status) {
      case 'Approved':
        return (
          <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl flex items-center space-x-4 shadow-sm">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-2xl">
              <Icons.HiCheckCircle />
            </div>
            <div>
              <p className="text-[12px] font-black text-emerald-600 uppercase tracking-widest">KYC Status</p>
              <h3 className="text-[14px] font-black text-brand-navy uppercase tracking-tight">Verified & Approved</h3>
              <p className="text-[11px] text-slate-400 font-bold uppercase mt-0.5">Your profile is fully verified for renting equipment.</p>
            </div>
          </div>
        )
      case 'Pending':
        return (
          <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex items-center space-x-4 shadow-sm animate-pulse-subtle">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-2xl">
              <Icons.HiClock />
            </div>
            <div>
              <p className="text-[12px] font-black text-amber-600 uppercase tracking-widest">KYC Status</p>
              <h3 className="text-[14px] font-black text-brand-navy uppercase tracking-tight">Pending Verification</h3>
              <p className="text-[11px] text-slate-400 font-bold uppercase mt-0.5">Admin is reviewing your documents. Usually verified within 1-2 hours.</p>
            </div>
          </div>
        )
      case 'Rejected':
        return (
          <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl flex flex-col space-y-4 shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 text-2xl">
                <Icons.HiExclamationCircle />
              </div>
              <div>
                <p className="text-[12px] font-black text-rose-600 uppercase tracking-widest">KYC Status</p>
                <h3 className="text-[14px] font-black text-brand-navy uppercase tracking-tight">Verification Rejected</h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase mt-0.5">Please review the reason below and re-upload your documents.</p>
              </div>
            </div>
            {user?.kycRejectionReason && (
              <div className="bg-rose-100/50 p-4 rounded-xl border border-rose-200/50">
                <p className="text-[11px] font-black text-rose-800 uppercase tracking-wider">Reason for Rejection:</p>
                <p className="text-[12px] font-bold text-rose-700 mt-1 uppercase italic">"{user.kycRejectionReason}"</p>
              </div>
            )}
          </div>
        )
      default:
        return (
          <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex items-center space-x-4 shadow-sm">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 text-2xl">
              <Icons.HiUpload />
            </div>
            <div>
              <p className="text-[12px] font-black text-slate-500 uppercase tracking-widest">KYC Status</p>
              <h3 className="text-[14px] font-black text-brand-navy uppercase tracking-tight">Verification Incomplete</h3>
              <p className="text-[11px] text-slate-400 font-bold uppercase mt-0.5">Upload Aadhaar & PAN to unlock product bookings.</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Side: Profile Details */}
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden h-fit">
          <div className="bg-brand-navy p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
               <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[80%] bg-primary rounded-full blur-[120px]"></div>
               <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[80%] bg-orange-400 rounded-full blur-[120px]"></div>
            </div>
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white mb-4 text-2xl font-black shadow-2xl uppercase">
                {user?.fullName?.charAt(0)}
              </div>
              <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-1">Account Settings</h1>
              <p className="text-orange-300 font-black uppercase tracking-[0.2em] text-[10px] opacity-80">Manage your profile & preferences</p>
            </div>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1 group">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Full Name</label>
                <div className="relative">
                  <Icons.HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl group-focus-within:text-primary" />
                  <input
                    type="text" required
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3.5 pl-12 font-bold uppercase text-xs focus:bg-white focus:border-primary focus:ring-4 focus:ring-orange-50 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1 group">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Mobile Number</label>
                <div className="relative">
                  <Icons.HiOutlinePhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl group-focus-within:text-primary" />
                  <input
                    type="tel" required
                    value={formData.mobile}
                    onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3.5 pl-12 font-bold text-xs focus:bg-white focus:border-primary focus:ring-4 focus:ring-orange-50 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Registered Email</p>
                <p className="text-brand-navy font-black text-xs">{user?.email}</p>
              </div>

              <div className="space-y-1 group">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Delivery Address</label>
                <div className="relative">
                  <Icons.HiOutlineLocationMarker className="absolute left-4 top-4 text-slate-400 text-xl group-focus-within:text-primary" />
                  <textarea
                    required rows="3"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3.5 pl-12 font-bold text-xs focus:bg-white focus:border-primary focus:ring-4 focus:ring-orange-50 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit" disabled={loading}
                  className="bg-brand-navy text-white px-8 py-3.5 rounded-xl font-black uppercase tracking-[0.1em] text-[12px] hover:bg-primary transition-all disabled:opacity-50 w-full"
                >
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: KYC Upload and Verification */}
        <div className="space-y-6">
          
          {/* KYC Status banner */}
          {getKycBanner()}

          {/* KYC Document Card */}
          {user?.kycStatus !== 'Approved' && (
            <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-8 space-y-6">
              <div>
                <h2 className="text-[16px] font-black text-brand-navy uppercase tracking-widest">Verify KYC Documents</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-1">Submit documents to request verification.</p>
              </div>

              <form onSubmit={handleKycSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* Aadhaar Front */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Aadhaar Front</label>
                    <div className="relative group border-2 border-dashed border-slate-200 hover:border-primary rounded-2xl p-4 transition-all text-center cursor-pointer bg-slate-50/50">
                      <input 
                        type="file" accept="image/*" required
                        onChange={e => setAadhaarFront(e.target.files[0])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Icons.HiUpload className="mx-auto text-slate-300 group-hover:text-primary transition-colors text-xl mb-1" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block truncate">
                        {aadhaarFront ? aadhaarFront.name : 'Select Image'}
                      </span>
                    </div>
                  </div>

                  {/* Aadhaar Back */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Aadhaar Back</label>
                    <div className="relative group border-2 border-dashed border-slate-200 hover:border-primary rounded-2xl p-4 transition-all text-center cursor-pointer bg-slate-50/50">
                      <input 
                        type="file" accept="image/*" required
                        onChange={e => setAadhaarBack(e.target.files[0])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Icons.HiUpload className="mx-auto text-slate-300 group-hover:text-primary transition-colors text-xl mb-1" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block truncate">
                        {aadhaarBack ? aadhaarBack.name : 'Select Image'}
                      </span>
                    </div>
                  </div>

                  {/* PAN Front */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">PAN Front</label>
                    <div className="relative group border-2 border-dashed border-slate-200 hover:border-primary rounded-2xl p-4 transition-all text-center cursor-pointer bg-slate-50/50">
                      <input 
                        type="file" accept="image/*" required
                        onChange={e => setPanFront(e.target.files[0])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Icons.HiUpload className="mx-auto text-slate-300 group-hover:text-primary transition-colors text-xl mb-1" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block truncate">
                        {panFront ? panFront.name : 'Select Image'}
                      </span>
                    </div>
                  </div>

                  {/* PAN Back */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">PAN Back</label>
                    <div className="relative group border-2 border-dashed border-slate-200 hover:border-primary rounded-2xl p-4 transition-all text-center cursor-pointer bg-slate-50/50">
                      <input 
                        type="file" accept="image/*" required
                        onChange={e => setPanBack(e.target.files[0])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Icons.HiUpload className="mx-auto text-slate-300 group-hover:text-primary transition-colors text-xl mb-1" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block truncate">
                        {panBack ? panBack.name : 'Select Image'}
                      </span>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" disabled={uploadingKyc}
                  className="w-full bg-brand-navy hover:bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[12px] shadow-lg shadow-orange-100 transition-all disabled:opacity-50"
                >
                  {uploadingKyc ? 'Uploading...' : 'Submit KYC Documents'}
                </button>
              </form>
            </div>
          )}

          {/* KYC Document Previews (If uploaded before) */}
          {user?.kycDocuments && Object.values(user.kycDocuments).some(v => !!v) && (
            <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-8 space-y-6">
              <div>
                <h3 className="text-[14px] font-black text-brand-navy uppercase tracking-widest">Submitted Documents</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Review the images currently on file.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'Aadhaar Front', key: 'aadhaarFront' },
                  { name: 'Aadhaar Back', key: 'aadhaarBack' },
                  { name: 'PAN Front', key: 'panFront' },
                  { name: 'PAN Back', key: 'panBack' }
                ].map(doc => {
                  const url = user.kycDocuments[doc.key]
                  if (!url) return null
                  return (
                    <div key={doc.key} className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col items-center relative overflow-hidden group">
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2">{doc.name}</p>
                      <div className="w-full h-24 rounded-lg overflow-hidden border border-slate-200 bg-white relative">
                        <img src={url} alt={doc.name} className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <a href={url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white text-brand-navy rounded-full shadow-lg hover:scale-115 transition-transform text-sm">
                            <Icons.HiEye />
                          </a>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
