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
    <footer className="bg-gradient-to-b from-[#16162b] to-[#0b0b17] text-slate-300 mt-20 border-t-4 border-primary">
      {/* Trust strip */}
      <div className="border-b border-white/10">
        <div className="max-w-[1440px] mx-auto px-6 py-7 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: HiOutlineShieldCheck, title: 'Quality Checked', sub: 'Every item is inspected before rental' },
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
      <div className="max-w-[1440px] mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-12 gap-10">

        {/* Brand */}
        <div className="md:col-span-4">
          <Link to="/" className="inline-block mb-5">
            <img src="/logo.jpg" alt="Lens Men – Rent, Create, Inspire" className="h-28 w-auto rounded-xl bg-white px-4 py-2 object-contain shadow-lg" />
          </Link>
          <p className="text-[14px] text-slate-400 leading-relaxed max-w-sm">
            Chennai's trusted destination for professional camera, lighting and cinema equipment rentals. Pro-grade gear, verified and ready to shoot.
          </p>
          <a
            href="https://wa.me/919080086600" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-full bg-primary text-white text-[13px] font-semibold hover:bg-primary-dark transition-colors"
          >
            <HiOutlinePhone className="text-base" /> Chat on WhatsApp
          </a>
        </div>

        {/* Categories */}
        <div className="md:col-span-2">
          <h4 className="text-[12px] font-bold text-white uppercase tracking-widest mb-5">Categories</h4>
          <ul className="space-y-3">
            {(categories.length ? categories : ['Cameras', 'Lenses', 'Lights']).slice(0, 6).map(cat => (
              <li key={cat}>
                <button onClick={() => goToCategory(cat)} className="text-[13px] text-slate-400 hover:text-primary transition-colors">
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick links */}
        <div className="md:col-span-2">
          <h4 className="text-[12px] font-bold text-white uppercase tracking-widest mb-5">Quick Links</h4>
          <ul className="space-y-3">
            {[
              { label: 'Browse Gear', to: '/' },
              { label: 'My Orders',   to: '/dashboard/orders' },
              { label: 'My Account',  to: '/dashboard/account' },
              { label: 'Help & Support', to: '/dashboard/help' },
            ].map(l => (
              <li key={l.label}>
                <Link to={l.to} className="text-[13px] text-slate-400 hover:text-primary transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div className="md:col-span-4">
          <h4 className="text-[12px] font-bold text-white uppercase tracking-widest mb-5">Visit & Contact</h4>
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            {[
              { name: 'Velachery Studio', addr: 'Flat S3, 2nd Floor, Sri Niketan Apartment, Sasi Nagar, Velachery, Chennai – 600042', href: 'https://maps.app.goo.gl/velachery' },
              { name: 'Saligramam Office', addr: 'Saligramam, Chennai – 600093', href: 'https://maps.app.goo.gl/saligramam' },
            ].map(loc => (
              <a key={loc.name} href={loc.href} target="_blank" rel="noopener noreferrer"
                className="group rounded-xl bg-white/5 border border-white/10 p-4 hover:border-primary/60 hover:bg-white/[0.08] transition-colors">
                <div className="flex items-center gap-2 text-white text-[13px] font-semibold mb-1.5">
                  <HiOutlineLocationMarker className="text-primary text-base" /> {loc.name}
                </div>
                <p className="text-[12px] text-slate-400 leading-snug">{loc.addr}</p>
              </a>
            ))}
          </div>
          <ul className="space-y-3">
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
        <div className="max-w-[1440px] mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
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
