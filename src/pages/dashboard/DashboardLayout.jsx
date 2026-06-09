import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useGlobal } from '../../context/GlobalContext'
import { useMemo } from 'react'
import {
  HiOutlineViewGrid, HiOutlineShoppingCart, HiOutlineUser,
  HiOutlineIdentification, HiOutlineLogout, HiOutlineArrowLeft, HiOutlineBell,
  HiOutlineQuestionMarkCircle, HiMenu, HiX,
} from 'react-icons/hi'
import useWindowWidth from '../../utils/useWindowWidth'

const BRAND = '#1e1b4b'
const NAVY  = '#1e1b4b'
const INK   = '#1a1a2e'
const MUTED = '#9499a6'
const LINE  = '#ededf1'
const ACTIVE_BG = '#eef2ff'

const KYC_STATUS = {
  Approved:      { color: '#16a34a', label: 'KYC Verified' },
  Pending:       { color: '#e0a912', label: 'KYC Pending' },
  Rejected:      { color: '#dc2626', label: 'KYC Rejected' },
  'Not Uploaded':{ color: '#9499a6', label: 'Not Submitted' },
}

const navItems = [
  { to: '/dashboard',               icon: <HiOutlineViewGrid />,            label: 'Overview',       exact: true },
  { to: '/dashboard/orders',        icon: <HiOutlineShoppingCart />,        label: 'My Orders' },
  { to: '/dashboard/notifications', icon: <HiOutlineBell />,                label: 'Notifications',  badge: true },
  { to: '/dashboard/account',       icon: <HiOutlineUser />,                label: 'Account' },
  { to: '/dashboard/kyc',           icon: <HiOutlineIdentification />,      label: 'KYC Documents' },
  { to: '/dashboard/help',          icon: <HiOutlineQuestionMarkCircle />,  label: 'Help & Support' },
]

const DashboardLayout = ({ children }) => {
  const { user, logout, notifications } = useGlobal()
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications])
  const location    = useLocation()
  const width       = useWindowWidth()
  const isMobile    = width < 768

  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isActive = (item) => item.exact
    ? location.pathname === item.to
    : location.pathname.startsWith(item.to)

  const kycCfg  = KYC_STATUS[user?.kycStatus || 'Not Uploaded']
  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const closeSidebar = () => setSidebarOpen(false)

  // ── Sidebar content ────────────────────────────────────────────────
  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Brand */}
      <div style={{
        height: 60, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 16px',
        borderBottom: `1px solid ${LINE}`, flexShrink: 0,
      }}>
        <Link to="/" onClick={closeSidebar} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/logo.jpg" alt="Lensmen"
            style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', border: `1px solid ${LINE}` }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: INK, letterSpacing: '-0.01em' }}>
            Lensmen <span style={{ color: BRAND }}>Rentals</span>
          </div>
        </Link>
        {isMobile && (
          <button onClick={closeSidebar}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}>
            <HiX style={{ fontSize: 22 }} />
          </button>
        )}
      </div>

      {/* User card */}
      <div style={{ padding: '20px', borderBottom: `1px solid ${LINE}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: NAVY, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 900, flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, color: NAVY, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.fullName}
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10.5, fontWeight: 600, padding: '3px 9px', borderRadius: 6, border: `1px solid ${LINE}`, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {user?.customerClass || 'New'}
          </span>
          <span style={{ fontSize: 10.5, fontWeight: 600, padding: '3px 9px', borderRadius: 6, border: `1px solid ${LINE}`, color: kycCfg.color, display: 'flex', alignItems: 'center', gap: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: kycCfg.color }} />
            {kycCfg.label}
          </span>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '10px 12px', overflowY: 'auto' }}>
        {navItems.map(item => {
          const active = isActive(item)
          return (
            <Link
              key={item.to} to={item.to}
              onClick={closeSidebar}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10, marginBottom: 3,
                background: active ? ACTIVE_BG : 'transparent',
                color: active ? BRAND : '#4b5563',
                fontWeight: active ? 700 : 500,
                fontSize: 14, textDecoration: 'none',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.color = '#111827' }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4b5563' }}}
            >
              <span style={{ fontSize: 18, lineHeight: 1, color: active ? BRAND : '#9ca3af', position: 'relative', display: 'inline-flex' }}>
                {item.icon}
                {item.badge && unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -6,
                    background: '#E5550F', color: '#fff',
                    fontSize: 8, fontWeight: 800,
                    width: 14, height: 14, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && unreadCount > 0 && (
                <span style={{ background: '#E5550F', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10 }}>
                  {unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom links */}
      <div style={{ padding: '12px', borderTop: '1px solid #f0f0f0', flexShrink: 0 }}>
        <Link
          to="/" onClick={closeSidebar}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, color: '#6b7280', fontSize: 13, fontWeight: 500, textDecoration: 'none', marginBottom: 4 }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.color = '#111827' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280' }}
        >
          <HiOutlineArrowLeft style={{ fontSize: 16, color: '#9ca3af' }} />
          Back to Shop
        </Link>
        <button
          onClick={() => { closeSidebar(); logout() }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 10,
            color: '#6b7280', fontSize: 13, fontWeight: 500,
            background: 'transparent', border: 'none', cursor: 'pointer',
            width: '100%', textAlign: 'left',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280' }}
        >
          <HiOutlineLogout style={{ fontSize: 16, color: '#9ca3af' }} />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f6f8' }}>

      {/* ── Mobile top bar ─────────────────────────────────────── */}
      {isMobile && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 300,
          height: 56, background: '#fff', borderBottom: `1px solid ${LINE}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px',
        }}>
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: NAVY, padding: 4, display: 'flex' }}
          >
            <HiMenu style={{ fontSize: 24 }} />
          </button>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <img src="/logo.jpg" alt="Lensmen"
              style={{ width: 28, height: 28, borderRadius: 7, objectFit: 'cover', border: `1px solid ${LINE}` }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: INK }}>Lensmen <span style={{ color: BRAND }}>Rentals</span></span>
          </Link>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: NAVY, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 900,
          }}>
            {initials}
          </div>
        </div>
      )}

      {/* ── Mobile backdrop ────────────────────────────────────── */}
      {isMobile && sidebarOpen && (
        <div
          onClick={closeSidebar}
          style={{
            position: 'fixed', inset: 0, zIndex: 350,
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside style={{
        width: 260,
        background: '#fff',
        borderRight: `1px solid ${LINE}`,
        flexShrink: 0,
        ...(isMobile ? {
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 400,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
          overflowY: 'auto',
        } : {
          position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
        }),
      }}>
        <SidebarContent />
      </aside>

      {/* ── Content ───────────────────────────────────────────── */}
      <main style={{
        flex: 1, overflowY: 'auto', minWidth: 0,
        padding: isMobile ? '72px 16px 24px' : 32,
      }}>
        {children}
      </main>
    </div>
  )
}

export default DashboardLayout
