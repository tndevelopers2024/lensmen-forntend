import { Link } from 'react-router-dom'
import { HiChartBar, HiCube, HiShoppingCart, HiCollection } from 'react-icons/hi'

const AdminLayout = ({ children, location }) => {
  const menuItems = [
    { to: '/admin', icon: HiChartBar, label: 'Overview' },
    { to: '/admin/all-products', icon: HiCollection, label: 'Inventory' },
    { to: '/admin/products', icon: HiCube, label: 'Add Product' },
    { to: '/admin/orders', icon: HiShoppingCart, label: 'Orders' },
  ]

  return (
    <div className="flex min-h-[calc(100vh-60px)] bg-[#f8fafc] p-4 gap-4">
      <aside className="w-64 bg-gradient-to-b from-[#03045e] to-[#5e60ce] text-white p-6 flex flex-col rounded-[1.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-xl"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-cyan-400/20 rounded-full -ml-10 -mb-10 blur-xl"></div>

        <div className="mb-8 relative z-10">
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-cyan-300 mb-1 opacity-60">Admin Console</p>
          <h2 className="text-[16px] font-black uppercase tracking-widest">Management</h2>
        </div>

        <nav className="flex-1 space-y-2 relative z-10">
          {menuItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center space-x-3 p-3.5 font-black transition-all rounded-xl group ${location.pathname === item.to
                ? 'bg-white text-[#03045e] shadow-lg scale-105'
                : 'hover:bg-white/10 text-white/70 hover:text-white'
                }`}
            >
              <item.icon className={`text-xl ${location.pathname === item.to ? 'text-[#5e60ce]' : 'text-cyan-400 group-hover:text-cyan-300'}`} />
              <span className="uppercase tracking-widest text-[9px]">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 bg-white rounded-[1.5rem] shadow-xl border border-slate-100 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  )
}

export default AdminLayout
