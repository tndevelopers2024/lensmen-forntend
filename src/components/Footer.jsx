import { Link, useNavigate } from 'react-router-dom'
import {
  HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker,
  HiOutlineShieldCheck, HiOutlineClock, HiOutlineTruck,
} from 'react-icons/hi'
import { useGlobal } from '../context/GlobalContext'

const Footer = () => {
  const { categories } = useGlobal()
  const navigate = useNavigate()

  const goToCategory = (cat) => {
    navigate(cat === 'All' ? '/' : `/?category=${encodeURIComponent(cat)}`)
    setTimeout(() => document.getElementById('inventory')?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  return (
    <footer className="bg-[#0f0f1e] text-slate-300 mt-20">
      {/* Trust strip */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-7 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: HiOutlineShieldCheck, title: 'Fully Insured Gear', sub: 'Every rental is protected & covered' },
            { icon: HiOutlineClock,       title: '24/7 Support',       sub: 'We are here whenever you need us' },
            { icon: HiOutlineTruck,       title: 'Pickup & Delivery',  sub: 'Flexible logistics across the city' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                <f.icon className="text-xl text-primary" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white">{f.title}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{f.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-12 gap-10">

        {/* Brand */}
        <div className="md:col-span-4">
          <Link to="/" className="flex items-center gap-2.5 mb-4">
            <img src="/logo.jpg" alt="Lensmen" className="w-10 h-10 rounded-lg object-cover" />
            <span className="text-[17px] font-bold text-white">Lensmen <span className="text-primary">Rentals</span></span>
          </Link>
          <p className="text-[13px] text-slate-400 leading-relaxed max-w-xs">
            Chennai's trusted destination for professional camera, lighting and cinema equipment rentals. Pro-grade gear, verified and ready to shoot.
          </p>
        </div>

        {/* Categories */}
        <div className="md:col-span-3">
          <h4 className="text-[12px] font-bold text-white uppercase tracking-widest mb-4">Categories</h4>
          <ul className="space-y-2.5">
            {(categories.length ? categories : ['Cameras', 'Lenses', 'Lights']).slice(0, 6).map(cat => (
              <li key={cat}>
                <button
                  onClick={() => goToCategory(cat)}
                  className="text-[13px] text-slate-400 hover:text-primary transition-colors"
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick links */}
        <div className="md:col-span-2">
          <h4 className="text-[12px] font-bold text-white uppercase tracking-widest mb-4">Company</h4>
          <ul className="space-y-2.5">
            {[
              { label: 'Browse Gear', to: '/' },
              { label: 'My Orders',   to: '/dashboard/orders' },
              { label: 'My Account',  to: '/dashboard/account' },
            ].map(l => (
              <li key={l.label}>
                <Link to={l.to} className="text-[13px] text-slate-400 hover:text-primary transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div className="md:col-span-3">
          <h4 className="text-[12px] font-bold text-white uppercase tracking-widest mb-4">Get in Touch</h4>
          <ul className="space-y-3">
            <li className="flex items-start gap-2.5 text-[13px] text-slate-400">
              <HiOutlineLocationMarker className="text-base text-primary mt-[2px] flex-shrink-0" />
              <div className="flex flex-col gap-1">
                <a
                  href="https://maps.app.goo.gl/velachery"
                  target="_blank" rel="noopener noreferrer"
                  className="hover:text-primary transition-colors leading-snug"
                >
                  flat no S3, 2nd floor, Sri Niketan Apartment,<br />
                  Sasi Nagar, Velachery, Chennai – 600042
                </a>
                <a
                  href="https://maps.app.goo.gl/saligramam"
                  target="_blank" rel="noopener noreferrer"
                  className="hover:text-primary transition-colors leading-snug mt-1"
                >
                  Saligramam, Chennai – 600093
                </a>
              </div>
            </li>
            <li className="flex items-center gap-2.5 text-[13px] text-slate-400">
              <HiOutlinePhone className="text-base text-primary flex-shrink-0" />
              <a href="tel:+919080086600" className="hover:text-primary transition-colors">+91 90800 86600</a>
            </li>
            <li className="flex items-center gap-2.5 text-[13px] text-slate-400">
              <HiOutlineMail className="text-base text-primary flex-shrink-0" />
              <a href="mailto:lensmen@live.com" className="hover:text-primary transition-colors">lensmen@live.com</a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-slate-500">© 2026 Lensmen Rentals. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <span className="text-[12px] text-slate-500 hover:text-slate-300 cursor-pointer transition-colors">Privacy Policy</span>
            <span className="text-[12px] text-slate-500 hover:text-slate-300 cursor-pointer transition-colors">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
