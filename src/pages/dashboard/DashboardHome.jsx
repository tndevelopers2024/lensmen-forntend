import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useGlobal, getImageUrl } from '../../context/GlobalContext'
import useWindowWidth from '../../utils/useWindowWidth'
import {
  HiOutlineCube, HiOutlineCreditCard, HiOutlineShieldCheck,
  HiOutlineArrowRight, HiOutlineArrowNarrowRight, HiOutlineCamera,
  HiOutlineClipboardList, HiOutlineClock, HiOutlineExclamationCircle,
  HiOutlineCheckCircle, HiOutlineIdentification,
} from 'react-icons/hi'

const ACCENT = '#1e1b4b'
const INK    = '#1a1a2e'
const MUTED  = '#9499a6'
const LINE   = '#ededf1'

const STATUS_DOT = {
  'Request Submitted': '#9499a6',
  'KYC Pending':       '#e0a912',
  'KYC Approved':      '#16a34a',
  'Approved':          '#16a34a',
  'Ready for Pickup':  '#6366f1',
  'During Rental':     '#3b82f6',
  'Picked Up':         '#3b82f6',
  'Active':            '#3b82f6',
  'Return Pending':    '#ea7317',
  'Returned':          '#16a34a',
  'Closed':            '#16a34a',
  'Rejected':          '#dc2626',
}

const ACTIVE_STATUSES = ['Picked Up', 'During Rental', 'Return Pending', 'Active', 'Approved', 'Ready for Pickup', 'KYC Approved', 'KYC Pending', 'Request Submitted']

const DashboardHome = () => {
  const { user, userOrders, fetchUserOrders } = useGlobal()
  const width   = useWindowWidth()
  const isMobile = width < 640

  useEffect(() => { fetchUserOrders() }, [])

  const activeRentals = userOrders.filter(o => ACTIVE_STATUSES.includes(o.status))
  const totalSpent    = userOrders.reduce((s, o) => s + (o.totalPrice || 0), 0)
  const recentOrders  = [...userOrders].slice(0, 3)

  const kycConfig = {
    Approved:       { icon: HiOutlineCheckCircle,       accent: '#16a34a', title: 'Identity verified',      desc: 'Your account is fully verified. You can rent equipment.' },
    Pending:        { icon: HiOutlineClock,             accent: '#e0a912', title: 'Under review',           desc: 'Documents submitted. Usually reviewed within 1–2 hours.' },
    Rejected:       { icon: HiOutlineExclamationCircle, accent: '#dc2626', title: 'Verification rejected',  desc: user?.kycRejectionReason || 'Please re-upload your documents.' },
    'Not Uploaded': { icon: HiOutlineIdentification,    accent: MUTED,     title: 'Verification pending',   desc: 'Upload your Aadhaar & PAN to unlock rentals.' },
  }
  const kyc = kycConfig[user?.kycStatus || 'Not Uploaded']
  const KycIcon = kyc.icon
  const kycValue = (user?.kycStatus === 'Not Uploaded' || !user?.kycStatus) ? 'Not submitted' : user.kycStatus

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Greeting */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 6 }}>
          Welcome back
        </div>
        <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: INK, margin: 0, letterSpacing: '-0.02em' }}>
          {user?.fullName?.split(' ')[0]}
        </h1>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 12 }}>
        <StatCard icon={HiOutlineCube}        label="Active Rentals" value={activeRentals.length}                sub="currently ongoing" />
        <StatCard icon={HiOutlineCreditCard}  label="Total Spent"    value={`₹${totalSpent.toLocaleString()}`} sub={`${userOrders.length} order${userOrders.length !== 1 ? 's' : ''}`} />
        <StatCard
          icon={HiOutlineShieldCheck} label="KYC Status"
          value={isMobile ? (user?.kycStatus || 'Not set') : kycValue}
          valueColor={kyc.accent}
          sub={`Class · ${user?.customerClass || 'New'}`}
          dot={kyc.accent}
          style={isMobile ? { gridColumn: '1 / -1' } : {}}
        />
      </div>

      {/* KYC notice */}
      {user?.kycStatus !== 'Approved' && (
        <div style={{
          display: 'flex', alignItems: isMobile ? 'flex-start' : 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 12 : 14,
          background: '#fff', border: `1px solid ${LINE}`,
          borderLeft: `3px solid ${kyc.accent}`,
          borderRadius: 12, padding: '16px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <KycIcon style={{ fontSize: 22, color: kyc.accent, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, color: INK, fontSize: 14 }}>{kyc.title}</div>
              <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>{kyc.desc}</div>
            </div>
          </div>
          {(user?.kycStatus === 'Not Uploaded' || user?.kycStatus === 'Rejected') && (
            <Link to="/dashboard/kyc" style={{
              border: `1px solid ${ACCENT}`, color: ACCENT,
              padding: '8px 18px', borderRadius: 8,
              fontSize: 13, fontWeight: 600, textDecoration: 'none',
              whiteSpace: 'nowrap', alignSelf: isMobile ? 'stretch' : 'auto',
              textAlign: isMobile ? 'center' : 'left',
            }}>
              {user?.kycStatus === 'Rejected' ? 'Re-upload' : 'Upload Documents'}
            </Link>
          )}
        </div>
      )}

      {/* Recent orders */}
      <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '16px 18px', borderBottom: `1px solid ${LINE}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 600, color: INK, fontSize: 15 }}>Recent Orders</div>
          {recentOrders.length > 0 && (
            <Link to="/dashboard/orders" style={{ fontSize: 13, color: ACCENT, fontWeight: 500, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
              View all <HiOutlineArrowNarrowRight style={{ fontSize: 15 }} />
            </Link>
          )}
        </div>

        {recentOrders.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <HiOutlineCamera style={{ fontSize: 36, color: '#d4d7de', marginBottom: 14 }} />
            <div style={{ fontSize: 14, color: MUTED, marginBottom: 18 }}>You haven't placed any orders yet</div>
            <Link to="/" style={{ background: ACCENT, color: '#fff', padding: '10px 22px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              Browse Equipment
            </Link>
          </div>
        ) : (
          recentOrders.map((order, i) => {
            const items = order.items?.length ? order.items : [order.productId]
            const dot = STATUS_DOT[order.status] || MUTED
            return (
              <Link
                to="/dashboard/orders" key={order._id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 18px', textDecoration: 'none',
                  borderBottom: i < recentOrders.length - 1 ? `1px solid ${LINE}` : 'none',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafafb'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', flexShrink: 0 }}>
                  {items.slice(0, 2).map((item, idx) => (
                    <img key={idx}
                      src={getImageUrl(item?.productId?.imageUrl || item?.imageUrl)} alt=""
                      style={{
                        width: 42, height: 42, borderRadius: 9,
                        objectFit: 'cover', border: '2px solid #fff',
                        marginLeft: idx > 0 ? -14 : 0, background: '#f1f2f5',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                      }}
                    />
                  ))}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: INK, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {items.length > 1 ? `${items.length} Items Order` : (items[0]?.name || 'Order')}
                  </div>
                  <div style={{ fontSize: 11.5, color: MUTED, marginTop: 2 }}>
                    {new Date(order.startDate).toLocaleDateString('en-GB')} – {new Date(order.endDate).toLocaleDateString('en-GB')}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, color: INK, fontSize: 13 }}>₹{order.totalPrice?.toLocaleString()}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 2 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot }} />
                    <span style={{ fontSize: 10.5, color: MUTED, fontWeight: 500 }}>{order.status}</span>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
        <ActionTile to="/"                icon={HiOutlineCamera}        title="Browse Gear"  sub="Explore our rental catalog" />
        <ActionTile to="/dashboard/orders" icon={HiOutlineClipboardList} title="My Orders"   sub={`${userOrders.length} total order${userOrders.length !== 1 ? 's' : ''}`} />
      </div>
    </div>
  )
}

const StatCard = ({ icon: Icon, label, value, sub, valueColor, dot, style: extraStyle }) => (
  <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: '18px 20px', ...extraStyle }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: '#f6f7f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon style={{ fontSize: 17, color: MUTED }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {dot && <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flexShrink: 0 }} />}
      <div style={{ fontSize: 22, fontWeight: 700, color: valueColor || INK, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
        {value}
      </div>
    </div>
    {sub && <div style={{ fontSize: 12, color: MUTED, marginTop: 5 }}>{sub}</div>}
  </div>
)

const ActionTile = ({ to, icon: Icon, title, sub }) => (
  <Link
    to={to}
    style={{
      background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14,
      padding: '16px 18px', textDecoration: 'none',
      display: 'flex', alignItems: 'center', gap: 14,
      transition: 'border-color 0.15s, box-shadow 0.15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = '#d9dbe1'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)' }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = LINE; e.currentTarget.style.boxShadow = 'none' }}
  >
    <div style={{ width: 40, height: 40, borderRadius: 11, background: '#f6f7f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon style={{ fontSize: 19, color: INK }} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 600, color: INK, fontSize: 14 }}>{title}</div>
      <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{sub}</div>
    </div>
    <HiOutlineArrowRight style={{ color: '#c4c7d0', fontSize: 17 }} />
  </Link>
)

export default DashboardHome
