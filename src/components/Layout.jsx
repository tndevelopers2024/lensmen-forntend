import { Link, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { HiShoppingCart, HiCalendar, HiLogout, HiChartBar, HiUser } from 'react-icons/hi'
import { useGlobal } from '../context/GlobalContext'

const Layout = ({ children, setAuthMode }) => {
  const { user, cart, logout } = useGlobal()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Toaster
        position="top-center"
        toastOptions={{
          className: 'rounded-none font-bold border-2 border-primary shadow-xl',
          duration: 4000,
          style: { borderRadius: '0px' }
        }}
      />
      {!location.pathname.startsWith('/admin') && (
        <nav className="bg-white/80 backdrop-blur-xl text-brand-navy p-3 border-b border-slate-100 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto flex justify-between items-center px-6">
            <Link to="/" className="flex items-center space-x-2 group">
              <div>
                <img src="/logo.jpg" alt="Logo" className="w-[50px] h-full" />
              </div>
              <h1 className="text-[16px] font-black uppercase text-brand-navy">Lensmen <span className="text-primary">Rentals</span></h1>
            </Link>
            <div className="flex items-center space-x-6">
              {(!user || user.role !== 'admin') && (
                <Link to="/cart" className="relative p-2 text-brand-navy hover:bg-slate-50 rounded-xl transition-all">
                  <HiShoppingCart className="text-xl" />
                  {cart.length > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-[12px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-white">
                      {cart.length}
                    </span>
                  )}
                </Link>
              )}
              {user ? (
                <>
                  {user.role === 'admin' ? (
                    <Link to="/admin" className="bg-brand-navy text-white px-4 py-2 rounded-xl font-black flex items-center space-x-2 hover:bg-primary transition-all shadow-md shadow-orange-100">
                      <HiChartBar className="text-lg" />
                      <span className="hidden md:inline uppercase text-[12px] tracking-widest">Dashboard</span>
                    </Link>
                  ) : (
                    <Link to="/my-orders" className="bg-slate-50 text-brand-navy px-4 py-2 rounded-xl font-black flex items-center space-x-2 hover:bg-slate-100 transition-all">
                      <HiCalendar className="text-lg" />
                      <span className="hidden md:inline uppercase text-[12px] tracking-widest">My order</span>
                    </Link>
                  )}
                  
                  <Link to="/profile" title="My Account" className="w-10 h-10 rounded-xl bg-slate-50 text-brand-navy hover:text-primary hover:bg-orange-50 transition-all flex items-center justify-center border border-slate-100 shadow-sm">
                    <HiUser className="text-xl" />
                  </Link>
                  <div className="h-6 w-px bg-slate-100 hidden sm:block"></div>
                  <div className="text-right hidden sm:block">
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Welcome</p>
                    <p className="text-[12px] font-black text-brand-navy uppercase">{user.fullName}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center"
                  >
                    <HiLogout className="text-lg" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setAuthMode('login')}
                  className="bg-primary text-white px-6 py-2 rounded-xl font-black uppercase tracking-widest text-[12px] hover:shadow-lg transition-all"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </nav>
      )}
      {children}
    </div>
  )
}

export default Layout
