import { useState } from 'react'
import toast from 'react-hot-toast'
import { useGlobal } from '../context/GlobalContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlinePhone, HiOutlineLocationMarker, HiX } from 'react-icons/hi'

const AuthModal = ({ mode, setMode }) => {
  const { setUser, API_URL } = useGlobal()
  const navigate = useNavigate()
  const location = useLocation()
  const [authData, setAuthData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobile: '',
    address: '',
    accountType: 'Private',
    agreeTerms: false
  })

  const handleAuth = async (e) => {
    e.preventDefault()
    const endpoint = mode === 'signup' ? '/auth/register' : '/auth/login'
    if (mode === 'signup' && authData.password !== authData.confirmPassword) {
      toast.error("Passwords don't match")
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
        setUser(data.user)
        setMode('none')
        toast.success(mode === 'signup' ? 'Account created successfully' : 'Welcome back to Lensmen')
        if (data.user.role === 'admin' && location.pathname === '/') navigate('/admin')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('Authentication failed')
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className={`bg-white rounded-3xl overflow-hidden ${mode === 'signup' ? 'max-w-2xl' : 'max-w-md'} w-full relative shadow-[0_20px_50px_rgba(8,112,184,0.7)] my-8 animate-in zoom-in-95 duration-300`}>
        
        {/* Top Accent Bar */}
        <div className="h-2 bg-gradient-to-r from-[#03045e] via-[#5e60ce] to-[#00b4d8]"></div>
        
        <button onClick={() => setMode('none')} className="absolute right-6 top-6 text-slate-400 hover:text-red-500 transition-all p-2 rounded-full hover:bg-slate-50">
          <HiX className="text-xl" />
        </button>

        <div className="p-8 md:p-12">
          <div className="text-center mb-10">
            <p className="text-[#5e60ce] font-black uppercase tracking-[0.4em] text-[10px] mb-2">Lensmen Rentals</p>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-3">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              {mode === 'login' ? "Don't have an account?" : "Already part of the crew?"}{' '}
              <button 
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} 
                className="text-[#03045e] font-black hover:text-[#5e60ce] transition-colors underline decoration-2 underline-offset-4"
              >
                {mode === 'login' ? 'Register Now' : 'Sign In'}
              </button>
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className={`grid gap-6 ${mode === 'signup' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
              
              {mode === 'signup' && (
                <div className="space-y-1 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-[#5e60ce] transition-colors">Full Name</label>
                  <div className="relative">
                    <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-[#5e60ce]" />
                    <input
                      type="text"
                      required
                      placeholder="Enter Your Name"
                      value={authData.fullName}
                      onChange={e => setAuthData({ ...authData, fullName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 pl-10 font-bold uppercase text-[12px] focus:bg-white focus:border-[#5e60ce] focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1 group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-[#5e60ce] transition-colors">Email Address</label>
                <div className="relative">
                  <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-[#5e60ce]" />
                  <input
                    type="email"
                    required
                    placeholder="Enter Your Email"
                    value={authData.email}
                    onChange={e => setAuthData({ ...authData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 pl-10 font-bold text-[12px] focus:bg-white focus:border-[#5e60ce] focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all"
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <>
                  <div className="space-y-1 group">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-[#5e60ce] transition-colors">Mobile Number</label>
                    <div className="relative">
                      <HiOutlinePhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-[#5e60ce]" />
                      <input
                        type="tel"
                        required
                        placeholder="Enter Your Mobile Number"
                        value={authData.mobile}
                        onChange={e => setAuthData({ ...authData, mobile: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 pl-10 font-bold text-[12px] focus:bg-white focus:border-[#5e60ce] focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1 group">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-[#5e60ce] transition-colors">Location/Address</label>
                    <div className="relative">
                      <HiOutlineLocationMarker className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-[#5e60ce]" />
                      <input
                        type="text"
                        required
                        placeholder="CITY, STATE"
                        value={authData.address}
                        onChange={e => setAuthData({ ...authData, address: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 pl-10 font-bold text-[12px] focus:bg-white focus:border-[#5e60ce] focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1 group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-[#5e60ce] transition-colors">Password</label>
                <div className="relative">
                  <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-[#5e60ce]" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authData.password}
                    onChange={e => setAuthData({ ...authData, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 pl-10 font-bold text-[12px] focus:bg-white focus:border-[#5e60ce] focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all"
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <div className="space-y-1 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-[#5e60ce] transition-colors">Confirm Password</label>
                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-[#5e60ce]" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={authData.confirmPassword}
                      onChange={e => setAuthData({ ...authData, confirmPassword: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 pl-10 font-bold text-[12px] focus:bg-white focus:border-[#5e60ce] focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            {mode === 'signup' && (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Account Type</p>
                <div className="flex space-x-8">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="type"
                      value="Private"
                      checked={authData.accountType === 'Private'}
                      onChange={e => setAuthData({ ...authData, accountType: e.target.value })}
                      className="accent-[#5e60ce] w-4 h-4 scale-125"
                    />
                    <span className="font-bold uppercase text-[11px] tracking-widest text-slate-600 group-hover:text-[#5e60ce] transition-colors">Individual / Private</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="type"
                      value="Company"
                      checked={authData.accountType === 'Company'}
                      onChange={e => setAuthData({ ...authData, accountType: e.target.value })}
                      className="accent-[#5e60ce] w-4 h-4 scale-125"
                    />
                    <span className="font-bold uppercase text-[11px] tracking-widest text-slate-600 group-hover:text-[#5e60ce] transition-colors">Production / Company</span>
                  </label>
                </div>
              </div>
            )}
            
            <button type="submit" className="w-full bg-[#03045e] text-white p-5 rounded-2xl font-black text-[14px] uppercase tracking-[0.2em] hover:bg-[#5e60ce] hover:shadow-[0_10px_30px_rgba(94,96,206,0.3)] transform hover:-translate-y-0.5 active:scale-95 transition-all mt-4">
              {mode === 'login' ? 'Login' : 'Register'}
            </button>
          </form>
        </div>

        {/* Bottom Bar */}
        <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
           <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Lensmen Rentals © 2026 | Professional Gear Access</p>
        </div>
      </div>
    </div>
  )
}

export default AuthModal
