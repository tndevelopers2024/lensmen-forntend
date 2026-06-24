import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useGlobal, API_URL, getImageUrl } from '../context/GlobalContext'
import { getAdminSettings } from './admin/Settings'
import {
  HiArrowLeft, HiArrowRight, HiExclamationCircle,
  HiCheckCircle, HiOutlineShoppingBag,
} from 'react-icons/hi'

const NAVY = '#1e1b4b'
const SOFT = '#eef2ff'

const STATUS_COLOR = {
  'Request Submitted': { bg: '#f8fafc', color: '#6b7280' },
  'KYC Pending':       { bg: '#fffbeb', color: '#f59e0b' },
  'KYC Approved':      { bg: '#f0fdf4', color: '#10b981' },
  'Approved':          { bg: '#f0fdf4', color: '#10b981' },
  'Ready for Pickup':  { bg: '#eef2ff', color: '#6366f1' },
  'During Rental':     { bg: '#eff6ff', color: '#3b82f6' },
  'Picked Up':         { bg: '#eff6ff', color: '#3b82f6' },
  'Active':            { bg: '#eff6ff', color: '#3b82f6' },
  'Return Pending':    { bg: '#fff7ed', color: '#f97316' },
  'Returned':          { bg: '#f0fdf4', color: '#22c55e' },
  'Closed':            { bg: '#f0fdf4', color: '#22c55e' },
  'Rejected':          { bg: '#fef2f2', color: '#ef4444' },
}

const MILESTONES = [
  { label: 'Submitted', statuses: ['Request Submitted', 'KYC Pending'] },
  { label: 'KYC',       statuses: ['KYC Approved'] },
  { label: 'Approved',  statuses: ['Approved'] },
  { label: 'Ready',     statuses: ['Ready for Pickup'] },
  { label: 'Active',    statuses: ['Picked Up', 'During Rental', 'Return Pending', 'Active'] },
  { label: 'Closed',    statuses: ['Returned', 'Closed'] },
]

const StatusBadge = ({ status }) => {
  const sc = STATUS_COLOR[status] || { bg: '#f9fafb', color: '#6b7280' }
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '4px 11px',
      borderRadius: 6, background: sc.bg, color: sc.color,
      textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  )
}

const Stepper = ({ status }) => {
  if (status === 'Rejected') return (
    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <HiExclamationCircle style={{ color: '#ef4444', fontSize: 22, flexShrink: 0 }} />
      <div>
        <div style={{ fontWeight: 700, color: '#991b1b', fontSize: 13 }}>Rental Request Rejected</div>
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Please check your email or contact us.</div>
      </div>
    </div>
  )
  const activeIdx = MILESTONES.findIndex(m => m.statuses.includes(status))
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, width: '100%' }}>
      {MILESTONES.map((m, i) => {
        const done   = i < activeIdx
        const active = i === activeIdx
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            {i < MILESTONES.length - 1 && (
              <div style={{
                position: 'absolute', top: 18, left: '50%', width: '100%', height: 3,
                background: done ? NAVY : '#e5e7eb', zIndex: 0,
              }} />
            )}
            <div style={{
              width: 36, height: 36, borderRadius: '50%', zIndex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: done ? '#10b981' : active ? NAVY : '#f3f4f6',
              border: `3px solid ${done ? '#10b981' : active ? NAVY : '#e5e7eb'}`,
              color: done || active ? '#fff' : '#9ca3af',
              fontWeight: 800, fontSize: 14, flexShrink: 0,
            }}>
              {done ? <HiCheckCircle style={{ fontSize: 18 }} /> : i + 1}
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: active ? NAVY : done ? '#10b981' : '#9ca3af', textTransform: 'uppercase', marginTop: 6, textAlign: 'center', letterSpacing: '0.06em' }}>
              {m.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function OrderDetailPage() {
  const { bookingCode: rawCode } = useParams()
  const { user, setAuthMode } = useGlobal()
  const navigate = useNavigate()

  // Strip any unsubstituted WhatsApp template prefix like {{1}} or %7B%7B1%7D%7D
  const bookingCode = (() => {
    const decoded = decodeURIComponent(rawCode || '')
    const after = decoded.indexOf('}}')
    return after !== -1 ? decoded.slice(after + 2) : decoded
  })()

  const [order,   setOrder]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!bookingCode) return
    setLoading(true)
    fetch(`${API_URL}/bookings/code/${encodeURIComponent(bookingCode)}`)
      .then(r => r.json())
      .then(data => {
        if (data._id) setOrder(data)
        else setError(data.message || 'Order not found')
      })
      .catch(() => setError('Could not load order. Please try again.'))
      .finally(() => setLoading(false))
  }, [bookingCode])

  if (loading) return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 40, height: 40, border: '3px solid #eef2ff', borderTopColor: NAVY, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ color: '#9ca3af', fontSize: 14 }}>Loading your order…</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
        <h2 style={{ color: NAVY, fontWeight: 700, marginBottom: 8 }}>Order Not Found</h2>
        <p style={{ color: '#64748b', marginBottom: 24 }}>{error}</p>
        {user ? (
          <Link to="/dashboard/orders" style={{ background: NAVY, color: '#fff', padding: '12px 24px', borderRadius: 10, fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>
            View My Orders
          </Link>
        ) : (
          <button onClick={() => setAuthMode('login')} style={{ background: NAVY, color: '#fff', padding: '12px 24px', borderRadius: 10, fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: 14 }}>
            Sign In to View Orders
          </button>
        )}
      </div>
    </div>
  )

  const locs = getAdminSettings().pickupLocations || []
  const loc  = order.pickupLocation ? locs.find(l => l.id === order.pickupLocation) : null
  const items = order.items?.length ? order.items : []

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBlock: 32, paddingInline: 16 }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Back link */}
        <Link
          to={user ? '/dashboard/orders' : '/'}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 13, fontWeight: 600, textDecoration: 'none', marginBottom: 20 }}
        >
          <HiArrowLeft /> {user ? 'My Orders' : 'Back to Home'}
        </Link>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 8 }}>
              Rental Request
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: NAVY }}>Order Details</h1>
              <StatusBadge status={order.status} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', marginTop: 6, fontFamily: 'monospace', letterSpacing: '0.04em' }}>
              {order.bookingCode}
            </div>
          </div>

          {/* Stepper */}
          <div style={{ padding: '20px 28px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
            <Stepper status={order.status} />
          </div>

          {/* Rejection reason */}
          {order.status === 'Rejected' && order.rejectionReason && (
            <div style={{ margin: '0 28px', marginTop: 20, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#991b1b', marginBottom: 4, textTransform: 'uppercase' }}>Rejection Reason</div>
              <div style={{ fontSize: 13, color: '#7f1d1d', fontStyle: 'italic' }}>"{order.rejectionReason}"</div>
            </div>
          )}

          {/* Equipment + Rental Window */}
          <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>

            {/* Equipment */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                Equipment
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, background: '#f8fafc', borderRadius: 12, padding: '10px 12px', border: '1px solid #eef0f3' }}>
                    <img
                      src={getImageUrl(item?.productId?.imageUrl || item?.imageUrl)}
                      alt=""
                      style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'contain', background: '#fff', border: '1px solid #eef0f3', flexShrink: 0, padding: 3 }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, color: NAVY, fontSize: 13 }}>
                        {item?.name || 'Unknown Item'}
                        {item?.quantity > 1 && (
                          <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: NAVY, background: SOFT, padding: '1px 6px', borderRadius: 4 }}>×{item.quantity}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginTop: 3 }}>₹{(item?.pricePerDay || 0).toLocaleString()}/day</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rental Window + Pickup */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                  Rental Window
                </div>
                <div style={{ background: '#f8fafc', borderRadius: 12, padding: '14px', border: '1px solid #eef0f3' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Start</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{new Date(order.startDate).toLocaleDateString('en-GB')}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{new Date(order.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <HiArrowRight style={{ color: '#cbd5e1', fontSize: 18 }} />
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Return</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{new Date(order.endDate).toLocaleDateString('en-GB')}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{new Date(order.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#94a3b8', fontWeight: 600 }}>Duration</span>
                    <span style={{ color: NAVY, fontWeight: 800 }}>{order.totalDays || 1} day{(order.totalDays || 1) !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                  Pickup Location
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #eef0f3', borderRadius: 12, padding: '12px 14px', borderLeft: `3px solid ${NAVY}` }}>
                  {loc ? (
                    <>
                      <div style={{ fontWeight: 700, color: NAVY, fontSize: 13, marginBottom: 4 }}>{loc.label}</div>
                      {loc.address && <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.6 }}>{loc.address}</div>}
                    </>
                  ) : (
                    <div style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>To be confirmed after approval</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Total footer */}
          <div style={{ margin: '0 28px 28px', background: NAVY, borderRadius: 16, padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Total Amount</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>₹{(order.totalPrice || 0).toLocaleString()}</div>
            </div>
            <StatusBadge status={order.status} />
          </div>

          {/* Sign-in nudge for guests */}
          {!user && (
            <div style={{ margin: '0 28px 28px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 13, color: '#14532d', fontWeight: 600 }}>Sign in to manage this order</div>
              <button
                onClick={() => setAuthMode('login')}
                style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                Sign In
              </button>
            </div>
          )}

          {/* My Orders link for logged-in users */}
          {user && (
            <div style={{ padding: '0 28px 28px' }}>
              <Link
                to="/dashboard/orders"
                style={{ display: 'block', textAlign: 'center', padding: '12px', background: SOFT, borderRadius: 10, color: NAVY, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
              >
                View All My Orders
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
