import { Link } from 'react-router-dom'
import { HiChartBar, HiCube, HiShoppingCart, HiCollection, HiLogout, HiUsers } from 'react-icons/hi'
import { useGlobal } from '../context/GlobalContext'

const AdminLayout = ({ children, location }) => {
  const { user, logout } = useGlobal()
  const menuItems = [
    { to: '/admin', icon: HiChartBar, label: 'Overview' },
    { to: '/admin/all-products', icon: HiCollection, label: 'Inventory' },
    { to: '/admin/products', icon: HiCube, label: 'Add Product' },
    { to: '/admin/orders', icon: HiShoppingCart, label: 'Orders' },
    { to: '/admin/users', icon: HiUsers, label: 'Users' },
  ]

  return (
    <div className="flex bg-[#f8fafc] p-4 gap-4 min-h-screen">
      <aside className="w-64 bg-brand-navy text-white p-6 flex flex-col rounded-[1.5rem] shadow-2xl relative overflow-hidden h-[calc(100vh-2rem)] sticky top-4">
        <div className="mb-10 relative z-10 flex flex-col items-center border-b border-white/10 pb-6">
          <Link to="/" className="flex flex-col items-center space-y-3 group">
            <div className="w-16 h-16 bg-white rounded-2xl p-2 shadow-xl group-hover:scale-110 transition-transform duration-500">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="text-center">
              <h1 className="text-[14px] font-black uppercase text-white tracking-tighter">Lensmen</h1>
              <h1 className="text-[14px] font-black uppercase text-primary tracking-tighter -mt-1">Rentals</h1>
            </div>
          </Link>
        </div>


        <div className="mb-8 relative z-10">
          <p className="text-[12px] font-black uppercase tracking-[0.3em] text-orange-300 mb-1 opacity-60">Admin Console</p>
          <h2 className="text-[14px] font-black uppercase tracking-widest">Management</h2>
        </div>

        <nav className="flex-1 space-y-2 relative z-10">
          {menuItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center space-x-3 p-3.5 font-black transition-all rounded-xl group ${location.pathname === item.to
                ? 'bg-white text-brand-navy shadow-lg scale-105'
                : 'hover:bg-white/10 text-white/70 hover:text-white'
                }`}
            >
              <item.icon className={`text-xl ${location.pathname === item.to ? 'text-primary' : 'text-orange-400 group-hover:text-orange-300'}`} />
              <span className="uppercase tracking-widest text-[12px]">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User Profile Section at Bottom */}
        <div className="mt-auto pt-6 border-t border-white/10 relative z-10">
          <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl hover:bg-white/10 transition-all group">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-black text-xs uppercase">
                {user?.fullName?.charAt(0)}
              </div>
              <div>
                <p className="text-[10px] font-black text-orange-300 uppercase tracking-widest opacity-60">Session Admin</p>
                <p className="text-[12px] font-black text-white uppercase truncate max-w-[100px]">{user?.fullName}</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="p-2 hover:bg-red-500 rounded-lg transition-all text-white/40 hover:text-white group-hover:text-white/60"
              title="Sign Out"
            >
              <HiLogout className="text-lg" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Admin Top Header */}
        <header className="h-16 flex items-center justify-between px-4 sticky top-0 z-30 bg-[#ffffff] rounded-xl mb-2">
          <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-1.5 h-5 bg-primary rounded-full"></div>
            <h2 className="text-[12px] font-black uppercase text-brand-navy tracking-widest">
              {menuItems.find(item => item.to === location.pathname)?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center space-x-6">
          
            
            <div className="h-8 w-px bg-slate-200"></div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-[12px] font-black text-brand-navy uppercase truncate max-w-[120px]">{user?.fullName}</p>
                <p className="text-[12px] font-black text-primary uppercase tracking-widest">Administrator</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-100 text-brand-navy font-black text-[12px] shadow-md">
                {user?.fullName?.split(' ').map(n => n[0]).join('')}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 bg-white rounded-[1.5rem] shadow-xl border border-slate-100 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
