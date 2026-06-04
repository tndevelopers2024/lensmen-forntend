import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import {
  HiOutlineShoppingCart, HiOutlineCalendar, HiOutlineLogout,
  HiOutlineChartBar, HiOutlineUser,
} from 'react-icons/hi'
import { useGlobal } from '../context/GlobalContext'
import Footer from './Footer'

const Layout = ({ children }) => {
  const { user, cart, logout, setAuthMode, setCartOpen, categories } = useGlobal()
  const navigate = useNavigate()
  const location = useLocation()

  const isPublic = !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/dashboard')

  const goToCategory = (cat) => {
    navigate(cat === 'All' ? '/' : `/?category=${encodeURIComponent(cat)}`)
    setTimeout(() => document.getElementById('inventory')?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Toaster
        position="top-center"
        toastOptions={{
          className: 'font-medium shadow-lg',
          duration: 4000,
          style: { borderRadius: '12px', border: '1px solid #ededf1' }
        }}
      />
      {isPublic && (
        <nav className="bg-white/90 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto grid grid-cols-3 items-center px-6 h-16">

            {/* Left — Logo */}
            <Link to="/" className="flex items-center gap-2.5 group w-fit">
              <img src="/logo.jpg" alt="Logo" className="w-9 h-9 rounded-lg object-cover border border-slate-100" />
              <h1 className="text-[16px] font-bold text-[#1a1a2e] tracking-tight">Lensmen <span className="text-primary">Rentals</span></h1>
            </Link>

            {/* Center — Nav links */}
            <div className="hidden lg:flex items-center justify-center gap-0.5">
              <button
                onClick={() => goToCategory('All')}
                className="px-3 h-9 flex items-center text-[14px] font-medium text-slate-600 hover:text-primary rounded-lg hover:bg-slate-50 transition-all"
              >
                Home
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => goToCategory(cat)}
                  className="px-3 h-9 flex items-center text-[14px] font-medium text-slate-600 hover:text-primary rounded-lg hover:bg-slate-50 transition-all whitespace-nowrap"
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Right — Actions */}
            <div className="flex items-center justify-end gap-2">
              {(!user || user.role !== 'admin') && (
                <button
                  onClick={() => user ? setCartOpen(true) : setAuthMode('login')}
                  className="relative w-10 h-10 flex items-center justify-center text-[#1a1a2e] hover:bg-slate-50 rounded-xl transition-all"
                >
                  <HiOutlineShoppingCart className="text-xl" />
                  {cart.length > 0 && (
                    <span className="absolute top-1 right-1 bg-primary text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                      {cart.length}
                    </span>
                  )}
                </button>
              )}

              {user ? (
                <>
                  {user.role === 'admin' ? (
                    <Link to="/admin" className="bg-[#1a1a2e] text-white px-4 h-10 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-primary transition-all">
                      <HiOutlineChartBar className="text-lg" />
                      <span className="hidden md:inline">Dashboard</span>
                    </Link>
                  ) : (
                    <Link to="/dashboard/orders" className="text-[#1a1a2e] px-4 h-10 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-slate-50 transition-all">
                      <HiOutlineCalendar className="text-lg" />
                      <span className="hidden md:inline">My Orders</span>
                    </Link>
                  )}
                  <Link to="/dashboard" title="My Dashboard" className="w-10 h-10 rounded-xl bg-slate-50 text-[#1a1a2e] hover:text-primary hover:bg-orange-50 transition-all flex items-center justify-center">
                    <HiOutlineUser className="text-xl" />
                  </Link>
                  <div className="h-6 w-px bg-slate-200 hidden sm:block" />
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Welcome</p>
                    <p className="text-[13px] font-semibold text-[#1a1a2e]">{user.fullName}</p>
                  </div>
                  <button
                    onClick={logout}
                    title="Sign out"
                    className="w-9 h-9 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center"
                  >
                    <HiOutlineLogout className="text-lg" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setAuthMode('login')}
                  className="flex items-center gap-2 bg-[#1a1a2e] hover:bg-primary text-white text-[13px] font-semibold px-4 h-10 rounded-xl transition-all"
                >
                  <HiOutlineUser className="text-base" />
                  Sign In
                </button>
              )}
            </div>

          </div>
        </nav>
      )}
      {children}
      {isPublic && <Footer />}
    </div>
  )
}

export default Layout
