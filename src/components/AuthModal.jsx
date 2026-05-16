import { useState } from 'react'
import toast from 'react-hot-toast'
import { useGlobal } from '../context/GlobalContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlinePhone, HiOutlineLocationMarker, HiX, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi'

const AuthModal = ({ mode, setMode }) => {
  const { setUser, API_URL } = useGlobal()
  const navigate = useNavigate()
  const location = useLocation()
  
  // flow states: 'login' | 'signup' | 'verify' | 'forgot' | 'reset'
  const [view, setView] = useState(mode) 
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [otp, setOtp] = useState('')
  const [authData, setAuthData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobile: '',
    address: '',
    accountType: 'Private'
  })
  const [resetData, setResetData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmNewPassword: ''
  })

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    const endpoint = view === 'signup' ? '/auth/register' : '/auth/login'
    
    if (view === 'signup' && authData.password !== authData.confirmPassword) {
      toast.error("Passwords don't match")
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authData)
      })
      const data = await res.json()
      
      if (res.ok) {
        if (view === 'signup') {
          if (data.user) {
            // Already verified user, log them in directly
            setUser(data.user)
            setMode('none')
            toast.success('Welcome back to Lensmen')
            if (data.user.role === 'admin' && location.pathname === '/') navigate('/admin')
          } else {
            // New user, move to verification
            setView('verify')
            toast.success('Verification code sent to your email')
          }
        } else {
          // Login success
          setUser(data.user)
          setMode('none')
          toast.success('Welcome back to Lensmen')
          if (data.user.role === 'admin' && location.pathname === '/') navigate('/admin')
        }
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authData.email, otp: otp })
      })
      const data = await res.json()
      
      if (res.ok) {
        setUser(data.user)
        setMode('none')
        toast.success('Account verified! Welcome to Lensmen.')
        if (data.user.role === 'admin' && location.pathname === '/') navigate('/admin')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetData.email })
      })
      const data = await res.json()
      if (res.ok) {
        setView('reset')
        toast.success('Reset code sent to your email')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('Request failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (resetData.newPassword !== resetData.confirmNewPassword) {
      toast.error("Passwords don't match")
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: resetData.email, 
          otp: resetData.otp, 
          newPassword: resetData.newPassword 
        })
      })
      const data = await res.json()
      if (res.ok) {
        setView('login')
        toast.success('Password updated successfully')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('Reset failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-start justify-center p-4 z-50 overflow-y-auto">
      <div className={`bg-white rounded-3xl overflow-hidden ${view === 'signup' ? 'max-w-2xl' : 'max-w-md'} w-full relative shadow-[0_20px_50px_rgba(8,112,184,0.7)] my-8 animate-in zoom-in-95 duration-300`}>
        
        <div className="h-2 bg-primary"></div>
        
        <button onClick={() => setMode('none')} className="absolute right-6 top-6 text-slate-400 hover:text-red-500 transition-all p-2 rounded-full hover:bg-slate-50">
          <HiX className="text-xl" />
        </button>

        <div className="p-8 md:p-12">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-slate-50 rounded-2xl p-3 shadow-lg border border-slate-100 animate-in zoom-in-50 duration-500">
                <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain" />
              </div>
            </div>
            <p className="text-primary font-black uppercase tracking-[0.4em] text-[12px] mb-2">Lensmen Rentals</p>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-3">
              {view === 'login' && 'Welcome Back'}
              {view === 'signup' && 'Create Account'}
              {view === 'verify' && 'Verify Email'}
              {view === 'forgot' && 'Reset Password'}
              {view === 'reset' && 'Set New Password'}
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              {(view === 'login' || view === 'verify') && (
                <>Don't have an account? <button onClick={() => setView('signup')} className="text-brand-navy font-black underline underline-offset-4">Register Now</button></>
              )}
              {view === 'signup' && (
                <>Already part of the crew? <button onClick={() => setView('login')} className="text-brand-navy font-black underline underline-offset-4">Sign In</button></>
              )}
              {view === 'forgot' && (
                <>Remembered your password? <button onClick={() => setView('login')} className="text-brand-navy font-black underline underline-offset-4">Sign In</button></>
              )}
            </p>
          </div>

          {/* Login / Signup Forms */}
          {(view === 'login' || view === 'signup') && (
            <form onSubmit={handleAuth} className="space-y-6">
              <div className={`grid gap-6 ${view === 'signup' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                {view === 'signup' && (
                  <div className="space-y-1 group">
                    <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Full Name</label>
                    <div className="relative">
                      <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-primary" />
                      <input
                        type="text" required placeholder="Enter Your Name"
                        value={authData.fullName} onChange={e => setAuthData({ ...authData, fullName: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 pl-10 font-bold uppercase text-[12px] focus:bg-white focus:border-primary focus:ring-4 focus:ring-orange-50/50 outline-none transition-all"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1 group">
                  <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Email Address</label>
                  <div className="relative">
                    <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-primary" />
                    <input
                      type="email" required placeholder="Enter Your Email"
                      value={authData.email} onChange={e => setAuthData({ ...authData, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 pl-10 font-bold text-[12px] focus:bg-white focus:border-primary focus:ring-4 focus:ring-orange-50/50 outline-none transition-all"
                    />
                  </div>
                </div>

                {view === 'signup' && (
                  <>
                    <div className="space-y-1 group">
                      <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Mobile Number</label>
                      <div className="relative">
                        <HiOutlinePhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-primary" />
                        <input
                          type="tel" required placeholder="Enter Your Mobile Number"
                          value={authData.mobile} onChange={e => setAuthData({ ...authData, mobile: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 pl-10 font-bold text-[12px] focus:bg-white focus:border-primary focus:ring-4 focus:ring-orange-50/50 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-1 group">
                      <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Location/Address</label>
                      <div className="relative">
                      <HiOutlineLocationMarker className="absolute left-3 top-4 text-slate-400 text-lg group-focus-within:text-primary" />
                      <textarea
                        required placeholder="FULL ADDRESS / CITY, STATE"
                        rows="3"
                        value={authData.address} onChange={e => setAuthData({ ...authData, address: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 pl-10 font-bold text-[12px] focus:bg-white focus:border-primary focus:ring-4 focus:ring-orange-50/50 outline-none transition-all resize-none"
                      />
                    </div>
                    </div>
                  </>
                )}

                <div className="space-y-1 group">
                  <div className="flex justify-between items-center pr-1">
                    <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Password</label>
                    {view === 'login' && (
                      <button type="button" onClick={() => setView('forgot')} className="text-[10px] font-black text-slate-300 hover:text-primary uppercase tracking-widest transition-colors">Forgot?</button>
                    )}
                  </div>
                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-primary" />
                    <input
                      type={showPassword ? "text" : "password"} required placeholder="••••••••"
                      value={authData.password} onChange={e => setAuthData({ ...authData, password: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 pl-10 pr-10 font-bold text-[12px] focus:bg-white focus:border-primary focus:ring-4 focus:ring-orange-50/50 outline-none transition-all"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                    >
                      {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                    </button>
                  </div>
                </div>

                {view === 'signup' && (
                  <div className="space-y-1 group">
                    <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Confirm Password</label>
                    <div className="relative">
                      <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-primary" />
                      <input
                        type={showPassword ? "text" : "password"} required placeholder="••••••••"
                        value={authData.confirmPassword} onChange={e => setAuthData({ ...authData, confirmPassword: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 pl-10 pr-10 font-bold text-[12px] focus:bg-white focus:border-primary focus:ring-4 focus:ring-orange-50/50 outline-none transition-all"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                      >
                        {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {view === 'signup' && (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
                  <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Account Type</p>
                  <div className="flex space-x-8">
                    {['Private', 'Company'].map(type => (
                      <label key={type} className="flex items-center space-x-3 cursor-pointer group">
                        <input type="radio" value={type} checked={authData.accountType === type} onChange={e => setAuthData({ ...authData, accountType: e.target.value })} className="accent-primary w-4 h-4 scale-125" />
                        <span className="font-bold uppercase text-[12px] tracking-widest text-slate-600 group-hover:text-primary transition-colors">{type === 'Private' ? 'Individual' : 'Company'}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              <button disabled={loading} type="submit" className="w-full bg-brand-navy text-white p-5 rounded-2xl font-black text-[14px] uppercase tracking-[0.2em] hover:bg-primary hover:shadow-[0_10px_30px_rgba(229,85,15,0.3)] transform hover:-translate-y-0.5 transition-all mt-4 disabled:opacity-50">
                {loading ? 'Processing...' : (view === 'login' ? 'Login' : 'Register')}
              </button>
            </form>
          )}

          {/* OTP Verification View */}
          {view === 'verify' && (
            <form onSubmit={handleVerifyOtp} className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="text-center">
                <p className="text-slate-400 text-[12px] font-bold uppercase tracking-widest mb-6">Enter the 6-digit code sent to <br/><span className="text-brand-navy font-black">{authData.email}</span></p>
                <div className="max-w-[240px] mx-auto relative group">
                  <input
                    type="text"
                    maxLength="6"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="000000"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 text-center text-2xl font-black text-brand-navy tracking-[0.5em] focus:border-primary focus:bg-white focus:ring-4 focus:ring-orange-50 outline-none transition-all placeholder:text-slate-200"
                  />
                  <div className="absolute inset-x-0 -bottom-1 h-1 bg-primary/10 rounded-full scale-x-0 group-focus-within:scale-x-100 transition-transform"></div>
                </div>
              </div>
              <button disabled={loading || otp.length < 6} type="submit" className="w-full bg-primary text-white p-5 rounded-2xl font-black text-[14px] uppercase tracking-[0.2em] shadow-lg shadow-orange-100 disabled:opacity-50 transition-all">
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
              <p className="text-center">
                <button type="button" onClick={() => setView('login')} className="text-[11px] font-black text-slate-300 hover:text-brand-navy uppercase tracking-widest transition-colors">Change Email / Go Back</button>
              </p>
            </form>
          )}

          {/* Forgot Password View */}
          {view === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-1 group">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                  <input
                    type="email" required placeholder="Enter Registered Email"
                    value={resetData.email} onChange={e => setResetData({ ...resetData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 pl-10 font-bold text-[12px] outline-none"
                  />
                </div>
              </div>
              <button disabled={loading} type="submit" className="w-full bg-brand-navy text-white p-5 rounded-2xl font-black text-[14px] uppercase tracking-[0.2em] transition-all disabled:opacity-50">
                {loading ? 'Sending Code...' : 'Send Reset Code'}
              </button>
            </form>
          )}

          {/* Reset Password View */}
          {view === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-1 group">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">Verification Code</label>
                <input
                  type="text" required placeholder="6-DIGIT CODE"
                  value={resetData.otp} onChange={e => setResetData({ ...resetData, otp: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 font-black text-center tracking-[0.5em] text-[14px] outline-none"
                />
              </div>
              <div className="space-y-1 group">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"} required placeholder="••••••••"
                    value={resetData.newPassword} onChange={e => setResetData({ ...resetData, newPassword: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 pr-10 font-bold text-[12px] outline-none"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                  >
                    {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                  </button>
                </div>
              </div>
              <div className="space-y-1 group">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"} required placeholder="••••••••"
                    value={resetData.confirmNewPassword} onChange={e => setResetData({ ...resetData, confirmNewPassword: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 pr-10 font-bold text-[12px] outline-none"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                  >
                    {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                  </button>
                </div>
              </div>
              <button disabled={loading} type="submit" className="w-full bg-primary text-white p-5 rounded-2xl font-black text-[14px] uppercase tracking-[0.2em] transition-all disabled:opacity-50">
                {loading ? 'Resetting...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>

        <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
           <p className="text-[12px] text-slate-400 font-black uppercase tracking-widest">Lensmen Rentals © 2026 | Professional Gear Access</p>
        </div>
      </div>
    </div>
  )
}

export default AuthModal
