import { useState } from 'react'
import toast from 'react-hot-toast'
import { useGlobal } from '../context/GlobalContext'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  HiOutlineMail, HiOutlineLockClosed, HiOutlineUser,
  HiOutlinePhone, HiOutlineLocationMarker, HiX,
  HiOutlineEye, HiOutlineEyeOff, HiUpload, HiCheckCircle,
} from 'react-icons/hi'

const KYC_DOCS = [
  { key: 'aadhaarFront', label: 'Aadhaar Front' },
  { key: 'aadhaarBack',  label: 'Aadhaar Back'  },
  { key: 'panFront',     label: 'PAN Front'      },
  { key: 'panBack',      label: 'PAN Back'       },
]

const LEFT = {
  login:  { tag: 'Welcome Back',       title: 'Sign in to\nyour account.',   sub: 'Access your bookings, rental history, and manage your gear.' },
  signup: { tag: 'New Here?',           title: 'Join the\nLensmen crew.',     sub: 'Create your account and start renting pro cinema gear today.' },
  verify: { tag: 'One Last Step',       title: 'Check your\nemail inbox.',    sub: 'Enter the 6-digit code we sent to confirm your identity.' },
  forgot: { tag: 'Password Recovery',   title: 'Forgot your\npassword?',      sub: 'No worries — enter your email and we\'ll send a reset code.' },
  reset:  { tag: 'Almost Done',         title: 'Set a new\npassword.',         sub: 'Choose a strong password to keep your account secure.' },
}

const AuthModal = ({ mode, setMode }) => {
  const { setUser, API_URL } = useGlobal()
  const navigate = useNavigate()
  const location = useLocation()

  const [view, setView] = useState(mode)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [otp, setOtp] = useState('')
  const [kycFiles, setKycFiles] = useState({ aadhaarFront: null, aadhaarBack: null, panFront: null, panBack: null })
  const [authData, setAuthData] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    mobile: '', secondMobile: '', companyName: '', address: '', accountType: 'Private',
  })
  const [resetData, setResetData] = useState({
    email: '', otp: '', newPassword: '', confirmNewPassword: '',
  })

  const uploadKycFiles = async (email) => {
    const form = new FormData()
    form.append('email', email)
    KYC_DOCS.forEach(d => form.append(d.key, kycFiles[d.key]))
    const res = await fetch(`${API_URL}/user/kyc`, { method: 'POST', body: form })
    if (!res.ok) toast.error('KYC upload failed — you can retry from your dashboard')
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (view === 'signup') {
      if (authData.password !== authData.confirmPassword) {
        toast.error("Passwords don't match"); setLoading(false); return
      }
      // KYC is mandatory — all 4 docs required
      const missingKyc = KYC_DOCS.filter(d => !kycFiles[d.key])
      if (missingKyc.length > 0) {
        toast.error(`Please upload all KYC documents (${missingKyc.map(d => d.label).join(', ')})`)
        setLoading(false); return
      }
    }

    try {
      const res = await fetch(`${API_URL}${view === 'signup' ? '/auth/register' : '/auth/login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authData),
      })
      const data = await res.json()
      if (res.ok) {
        if (data.user) {
          // Admin direct login (no OTP)
          setUser(data.user)
          setMode('none')
          toast.success('Welcome back, Admin!')
          navigate('/admin')
        } else {
          // Regular user: go to OTP verify screen
          setView('verify')
          toast.success('Verification code sent to your email')
        }
      } else { toast.error(data.message) }
    } catch { toast.error('Authentication failed') }
    finally { setLoading(false) }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authData.email, otp }),
      })
      const data = await res.json()
      if (res.ok) {
        // Upload KYC docs that were filled during registration
        if (KYC_DOCS.every(d => kycFiles[d.key])) {
          await uploadKycFiles(authData.email)
        }
        setUser(data.user)
        setMode('none')
        toast.success(data.user.role === 'admin' ? 'Welcome back, Admin!' : 'Account verified! Welcome to Lensmen.')
        if (data.user.role === 'admin') navigate('/admin')
      } else { toast.error(data.message) }
    } catch { toast.error('Verification failed') }
    finally { setLoading(false) }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetData.email }),
      })
      const data = await res.json()
      if (res.ok) { setView('reset'); toast.success('Reset code sent to your email') }
      else { toast.error(data.message) }
    } catch { toast.error('Request failed') }
    finally { setLoading(false) }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (resetData.newPassword !== resetData.confirmNewPassword) { toast.error("Passwords don't match"); return }
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetData.email, otp: resetData.otp, newPassword: resetData.newPassword }),
      })
      const data = await res.json()
      if (res.ok) { setView('login'); toast.success('Password updated successfully') }
      else { toast.error(data.message) }
    } catch { toast.error('Reset failed') }
    finally { setLoading(false) }
  }

  const isSignup = view === 'signup'
  const info = LEFT[view] || LEFT.login

  const field = "w-full bg-[#f5f5f8] border border-transparent rounded-xl py-3 pl-10 pr-4 text-[13px] font-medium text-slate-800 placeholder-slate-400 outline-none transition-all duration-150 focus:bg-white focus:border-orange-400 focus:shadow-[0_0_0_3px_rgba(229,85,15,0.08)]"


  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,700;1,9..144,400&family=DM+Sans:wght@300;400;500;600&display=swap');
        .am-wrap { animation: amIn 0.3s cubic-bezier(0.34,1.4,0.64,1) both; }
        @keyframes amIn { from { opacity:0; transform:scale(0.94) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .am-overlay { animation: bgIn 0.2s ease both; }
        @keyframes bgIn { from { opacity:0; } to { opacity:1; } }
      `}</style>

      <div className="am-overlay fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
        style={{ background: 'rgba(3,3,12,0.88)', backdropFilter: 'blur(20px)' }}>

        <div className={`am-wrap relative flex w-full rounded-2xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.65)] my-4 ${isSignup ? 'max-w-[900px]' : 'max-w-[680px]'}`}>

          {/* ── LEFT DARK PANEL ── */}
          <div
            className="hidden md:flex flex-col justify-between relative overflow-hidden flex-shrink-0"
            style={{
              width: isSignup ? '37%' : '43%',
              background: 'linear-gradient(155deg, #09091b 0%, #0c0c20 55%, #070712 100%)',
            }}
          >
            {/* Aperture rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {[400, 300, 210, 138, 78].map((s, i) => (
                <div key={i} className="absolute rounded-full"
                  style={{
                    width: s, height: s,
                    border: `1px solid rgba(229,85,15,${0.05 + i * 0.055})`,
                    boxShadow: i >= 3 ? `0 0 ${20 + i * 12}px rgba(229,85,15,${0.06 + i * 0.04})` : 'none',
                  }}
                />
              ))}
              <div className="absolute rounded-full"
                style={{ width: 28, height: 28, background: 'rgba(229,85,15,0.45)', boxShadow: '0 0 40px 14px rgba(229,85,15,0.15)' }}
              />
            </div>

            {/* Subtle grid texture */}
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: 'repeating-linear-gradient(0deg,rgba(255,255,255,0.012) 0px,rgba(255,255,255,0.012) 1px,transparent 1px,transparent 48px),repeating-linear-gradient(90deg,rgba(255,255,255,0.012) 0px,rgba(255,255,255,0.012) 1px,transparent 1px,transparent 48px)',
            }} />

            {/* Logo */}
            <div className="relative z-10 p-8 pb-0">
              <div className="flex items-center gap-2.5">
                <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-lg object-cover opacity-80" />
                <span className="text-white/40 text-[10px] font-semibold tracking-[0.25em] uppercase"
                  style={{ fontFamily: 'DM Sans, sans-serif' }}>Lensmen Rentals</span>
              </div>
            </div>

            {/* Headline */}
            <div className="relative z-10 px-8 py-8">
              <div className="w-6 h-0.5 bg-orange-500 mb-5 opacity-70" />
              <p className="text-orange-500/70 text-[10px] font-semibold tracking-[0.3em] uppercase mb-3"
                style={{ fontFamily: 'DM Sans, sans-serif' }}>
                {info.tag}
              </p>
              <h2 className="text-white mb-4"
                style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontSize: isSignup ? '2.35rem' : '2.9rem',
                  fontWeight: 700, lineHeight: 1.1,
                  letterSpacing: '-0.02em', whiteSpace: 'pre-line',
                }}>
                {info.title}
              </h2>
              <p className="text-white/35 text-[12.5px] leading-relaxed"
                style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300 }}>
                {info.sub}
              </p>
            </div>

            {/* Bottom */}
            <div className="relative z-10 p-8 pt-0">
              <p className="text-white/15 text-[9px] uppercase tracking-[0.35em]"
                style={{ fontFamily: 'DM Sans, sans-serif' }}>
                Professional Gear © 2026
              </p>
            </div>
          </div>

          {/* ── RIGHT FORM PANEL ── */}
          <div className="flex-1 bg-white flex flex-col overflow-y-auto" style={{ maxHeight: '92vh' }}>

            {/* Close */}
            <button onClick={() => setMode('none')}
              className="absolute right-4 top-4 z-30 w-8 h-8 rounded-full bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-all">
              <HiX className="text-[15px]" />
            </button>

            <div className="p-8 md:p-10 flex-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>

              {/* Mobile brand */}
              <div className="flex items-center gap-2 mb-7 md:hidden">
                <img src="/logo.jpg" alt="Logo" className="w-7 h-7 rounded-md object-cover" />
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Lensmen Rentals</span>
              </div>

              {/* Title row */}
              <div className="mb-7">
                <p className="text-[10px] font-semibold text-orange-500 uppercase tracking-[0.28em] mb-1.5">{info.tag}</p>
                <h3 className="text-[22px] font-bold text-slate-900 tracking-tight leading-snug">
                  {view === 'login'  && 'Good to see you again'}
                  {view === 'signup' && 'Create your account'}
                  {view === 'verify' && 'Enter your code'}
                  {view === 'forgot' && 'Reset your password'}
                  {view === 'reset'  && 'Set a new password'}
                </h3>
                <p className="text-[13px] text-slate-400 mt-1.5">
                  {(view === 'login' || view === 'verify') && (
                    <>No account?{' '}
                      <button onClick={() => setView('signup')} className="text-orange-500 font-semibold hover:underline underline-offset-2">Register here</button>
                    </>
                  )}
                  {view === 'signup' && (
                    <>Already have one?{' '}
                      <button onClick={() => setView('login')} className="text-orange-500 font-semibold hover:underline underline-offset-2">Sign in</button>
                    </>
                  )}
                  {view === 'forgot' && (
                    <>Remembered it?{' '}
                      <button onClick={() => setView('login')} className="text-orange-500 font-semibold hover:underline underline-offset-2">Sign in</button>
                    </>
                  )}
                </p>
              </div>

              {/* ── LOGIN / SIGNUP ── */}
              {(view === 'login' || view === 'signup') && (
                <form onSubmit={handleAuth} className="space-y-4">
                  <div className={`grid gap-4 ${isSignup ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>

                    {isSignup && (
                      <div className="space-y-1.5">
                        <label className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-widest">Full Name</label>
                        <div className="relative">
                          <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[15px]" />
                          <input type="text" required placeholder="Your full name"
                            value={authData.fullName} onChange={e => setAuthData({ ...authData, fullName: e.target.value })}
                            className={field} />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-widest">Email Address</label>
                      <div className="relative">
                        <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[15px]" />
                        <input type="email" required placeholder="you@example.com"
                          value={authData.email} onChange={e => setAuthData({ ...authData, email: e.target.value })}
                          className={field} />
                      </div>
                    </div>

                    {isSignup && (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-widest">Mobile Number</label>
                          <div className="relative">
                            <HiOutlinePhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[15px]" />
                            <input type="tel" required placeholder="+91 00000 00000"
                              value={authData.mobile} onChange={e => setAuthData({ ...authData, mobile: e.target.value })}
                              className={field} />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-widest">Second Mobile <span className="text-slate-300 normal-case font-normal">(optional)</span></label>
                          <div className="relative">
                            <HiOutlinePhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[15px]" />
                            <input type="tel" placeholder="+91 00000 00000"
                              value={authData.secondMobile || ''} onChange={e => setAuthData({ ...authData, secondMobile: e.target.value })}
                              className={field} />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-widest">Company Name <span className="text-slate-300 normal-case font-normal">(optional)</span></label>
                          <input type="text" placeholder="Your company or studio name"
                            value={authData.companyName || ''} onChange={e => setAuthData({ ...authData, companyName: e.target.value })}
                            className={field} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-widest">Address / City</label>
                          <div className="relative">
                            <HiOutlineLocationMarker className="absolute left-3 top-3 text-slate-400 text-[15px]" />
                            <textarea required placeholder="Full address, city, state" rows="2"
                              value={authData.address} onChange={e => setAuthData({ ...authData, address: e.target.value })}
                              className={field + " resize-none pt-3"} />
                          </div>
                        </div>
                      </>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-widest">Password</label>
                        {view === 'login' && (
                          <button type="button" onClick={() => setView('forgot')}
                            className="text-[11px] text-slate-400 hover:text-orange-500 transition-colors">Forgot?</button>
                        )}
                      </div>
                      <div className="relative">
                        <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[15px]" />
                        <input type={showPassword ? 'text' : 'password'} required placeholder="••••••••"
                          value={authData.password} onChange={e => setAuthData({ ...authData, password: e.target.value })}
                          className={field + " pr-10"} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                          {showPassword ? <HiOutlineEyeOff className="text-[15px]" /> : <HiOutlineEye className="text-[15px]" />}
                        </button>
                      </div>
                    </div>

                    {isSignup && (
                      <div className="space-y-1.5">
                        <label className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-widest">Confirm Password</label>
                        <div className="relative">
                          <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[15px]" />
                          <input type={showPassword ? 'text' : 'password'} required placeholder="••••••••"
                            value={authData.confirmPassword} onChange={e => setAuthData({ ...authData, confirmPassword: e.target.value })}
                            className={field + " pr-10"} />
                          <button type="button" onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                            {showPassword ? <HiOutlineEyeOff className="text-[15px]" /> : <HiOutlineEye className="text-[15px]" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {isSignup && (
                    <div className="bg-[#f5f5f8] rounded-xl p-4 border border-slate-100">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Account Type</p>
                      <div className="flex gap-6">
                        {['Private', 'Company'].map(type => (
                          <label key={type} className="flex items-center gap-2.5 cursor-pointer group">
                            <input type="radio" value={type}
                              checked={authData.accountType === type}
                              onChange={e => setAuthData({ ...authData, accountType: e.target.value })}
                              className="accent-orange-500 w-4 h-4" />
                            <span className="text-[12px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                              {type === 'Private' ? 'Individual' : 'Company'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {isSignup && (
                    <div className="space-y-3">
                      {/* KYC section header */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-slate-100" />
                        <span className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap flex items-center gap-1.5">
                          KYC Documents
                          <span className="text-red-400 text-[13px] leading-none">*</span>
                        </span>
                        <div className="flex-1 h-px bg-slate-100" />
                      </div>

                      {/* Progress dots */}
                      <div className="flex items-center gap-2">
                        {KYC_DOCS.map((doc) => (
                          <div key={doc.key} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            kycFiles[doc.key] ? 'bg-orange-500' : 'bg-slate-200'
                          }`} />
                        ))}
                        <span className="text-[10px] text-slate-400 font-medium ml-1 whitespace-nowrap">
                          {KYC_DOCS.filter(d => kycFiles[d.key]).length}/4
                        </span>
                      </div>

                      {/* 2×2 upload grid */}
                      <div className="grid grid-cols-2 gap-3">
                        {KYC_DOCS.map(doc => {
                          const file = kycFiles[doc.key]
                          return (
                            <div key={doc.key}>
                              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1.5">
                                {doc.label}
                                {!file && <span className="text-red-400 ml-0.5">*</span>}
                              </label>
                              <label className="block cursor-pointer group">
                                <div className={`rounded-xl border-2 border-dashed py-4 px-3 text-center transition-all duration-200 ${
                                  file
                                    ? 'border-orange-400 bg-orange-50/60'
                                    : 'border-slate-200 bg-[#f7f7fb] group-hover:border-orange-200 group-hover:bg-orange-50/30'
                                }`}>
                                  {file ? (
                                    <div className="flex flex-col items-center gap-1">
                                      <HiCheckCircle className="text-xl text-orange-500" />
                                      <p className="text-[10px] font-semibold text-orange-600 truncate w-full text-center px-1 leading-tight">
                                        {file.name.length > 16 ? file.name.slice(0, 13) + '…' : file.name}
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center gap-1">
                                      <HiUpload className="text-lg text-slate-300 group-hover:text-orange-400 transition-colors" />
                                      <p className="text-[10px] font-medium text-slate-400">Click to upload</p>
                                    </div>
                                  )}
                                </div>
                                <input
                                  type="file" accept="image/*" className="hidden"
                                  onChange={e => {
                                    if (e.target.files[0]) setKycFiles(prev => ({ ...prev, [doc.key]: e.target.files[0] }))
                                  }}
                                />
                              </label>
                            </div>
                          )
                        })}
                      </div>

                      {/* Required notice */}
                      <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <span className="text-amber-400">ⓘ</span>
                        Aadhaar &amp; PAN required to complete rental bookings. Securely stored, admin-reviewed only.
                      </p>
                    </div>
                  )}

                  <button disabled={loading} type="submit"
                    className="w-full py-3.5 rounded-xl font-semibold text-[13px] text-white bg-[#1a1a2e] hover:bg-orange-500 active:scale-[0.99] transition-all duration-200 disabled:opacity-50 tracking-wide mt-1">
                    {loading ? 'Processing…' : (view === 'login' ? 'Sign In to Lensmen' : 'Create Account')}
                  </button>
                </form>
              )}

              {/* ── OTP VERIFY ── */}
              {view === 'verify' && (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <p className="text-[13px] text-slate-500 text-center">
                    Code sent to <span className="font-semibold text-slate-800">{authData.email}</span>
                  </p>
                  <div className="flex justify-center">
                    <input type="text" maxLength="6" value={otp}
                      onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="000000"
                      className="w-48 bg-[#f5f5f8] border-2 border-transparent rounded-2xl py-4 text-center text-2xl font-bold text-slate-900 tracking-[0.5em] outline-none focus:border-orange-400 focus:bg-white transition-all placeholder:text-slate-300" />
                  </div>
                  <button disabled={loading || otp.length < 6} type="submit"
                    className="w-full py-3.5 rounded-xl font-semibold text-[13px] text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-40 transition-all">
                    {loading ? 'Verifying…' : 'Verify & Continue'}
                  </button>
                  <p className="text-center">
                    <button type="button" onClick={() => setView('login')}
                      className="text-[12px] text-slate-400 hover:text-slate-700 transition-colors">
                      ← Change email / go back
                    </button>
                  </p>
                </form>
              )}

              {/* ── FORGOT PASSWORD ── */}
              {view === 'forgot' && (
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-widest">Email Address</label>
                    <div className="relative">
                      <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[15px]" />
                      <input type="email" required placeholder="Registered email"
                        value={resetData.email} onChange={e => setResetData({ ...resetData, email: e.target.value })}
                        className={field} />
                    </div>
                  </div>
                  <button disabled={loading} type="submit"
                    className="w-full py-3.5 rounded-xl font-semibold text-[13px] text-white bg-[#1a1a2e] hover:bg-orange-500 disabled:opacity-50 transition-all duration-200">
                    {loading ? 'Sending…' : 'Send Reset Code'}
                  </button>
                </form>
              )}

              {/* ── RESET PASSWORD ── */}
              {view === 'reset' && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-widest">Verification Code</label>
                    <input type="text" required placeholder="6-digit code"
                      value={resetData.otp} onChange={e => setResetData({ ...resetData, otp: e.target.value })}
                      className={field + " text-center tracking-[0.5em] font-bold"} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-widest">New Password</label>
                    <div className="relative">
                      <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[15px]" />
                      <input type={showPassword ? 'text' : 'password'} required placeholder="New password"
                        value={resetData.newPassword} onChange={e => setResetData({ ...resetData, newPassword: e.target.value })}
                        className={field + " pr-10"} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <HiOutlineEyeOff className="text-[15px]" /> : <HiOutlineEye className="text-[15px]" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-widest">Confirm New Password</label>
                    <div className="relative">
                      <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[15px]" />
                      <input type={showPassword ? 'text' : 'password'} required placeholder="Confirm password"
                        value={resetData.confirmNewPassword} onChange={e => setResetData({ ...resetData, confirmNewPassword: e.target.value })}
                        className={field + " pr-10"} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <HiOutlineEyeOff className="text-[15px]" /> : <HiOutlineEye className="text-[15px]" />}
                      </button>
                    </div>
                  </div>
                  <button disabled={loading} type="submit"
                    className="w-full py-3.5 rounded-xl font-semibold text-[13px] text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition-all">
                    {loading ? 'Resetting…' : 'Update Password'}
                  </button>
                </form>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AuthModal
