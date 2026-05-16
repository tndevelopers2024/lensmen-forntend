import { useState } from 'react'
import { useGlobal } from '../context/GlobalContext'
import toast from 'react-hot-toast'
import { HiOutlineUser, HiOutlinePhone, HiOutlineLocationMarker, HiCheckCircle } from 'react-icons/hi'

const ProfilePage = () => {
  const { user, updateProfile } = useGlobal()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    mobile: user?.mobile || '',
    address: user?.address || ''
  })

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

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {/* Header Section */}
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

        <div className="p-6 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              {/* Left Column */}
              <div className="space-y-6">
                <div className="space-y-1 group">
                  <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Full Name</label>
                  <div className="relative">
                    <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl group-focus-within:text-primary" />
                    <input
                      type="text" required
                      value={formData.fullName}
                      onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 pl-12 font-bold uppercase text-xs focus:bg-white focus:border-primary focus:ring-4 focus:ring-orange-50 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1 group">
                  <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Mobile Number</label>
                  <div className="relative">
                    <HiOutlinePhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl group-focus-within:text-primary" />
                    <input
                      type="tel" required
                      value={formData.mobile}
                      onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 pl-12 font-bold text-xs focus:bg-white focus:border-primary focus:ring-4 focus:ring-orange-50 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Registered Email</p>
                  <p className="text-brand-navy font-black text-xs">{user?.email}</p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="space-y-1 group">
                  <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Delivery Address</label>
                  <div className="relative">
                    <HiOutlineLocationMarker className="absolute left-4 top-4 text-slate-400 text-xl group-focus-within:text-primary" />
                    <textarea
                      required rows="3"
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 pl-12 font-bold text-xs focus:bg-white focus:border-primary focus:ring-4 focus:ring-orange-50 outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit" disabled={loading}
                className="bg-brand-navy text-white px-8 py-3 rounded-xl font-black uppercase tracking-[0.1em] text-[12px] hover:bg-primary transition-all disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
