import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useGlobal, getImageUrl } from '../../context/GlobalContext'
import { getAdminSettings } from '../admin/Settings'
import toast from 'react-hot-toast'
import useWindowWidth from '../../utils/useWindowWidth'
import {
  HiX, HiArrowRight, HiCheckCircle, HiExclamationCircle,
  HiCalendar, HiUser, HiPhone, HiMail, HiLocationMarker,
  HiChevronRight, HiOutlineShoppingBag,
} from 'react-icons/hi'

const NAVY  = '#1e1b4b'
const SOFT  = '#eef2ff'

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
      fontSize: 10, fontWeight: 700, padding: '3px 9px',
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
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Please check your email or submit a new request.</div>
      </div>
    </div>
  )

  const activeIndex = MILESTONES.findIndex(m => m.statuses.includes(status))
  return (
    <div style={{ padding: '8px 0 4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 20, right: 20, top: 16, height: 2, background: '#e5e7eb', borderRadius: 2, zIndex: 0 }} />
        <div style={{
          position: 'absolute', left: 20, top: 16, height: 2,
          background: '#10b981', borderRadius: 2, zIndex: 1,
          width: activeIndex >= 0 ? `${(activeIndex / (MILESTONES.length - 1)) * (100 - (40 / MILESTONES.length))}%` : '0%',
          transition: 'width 0.5s ease',
        }} />
        {MILESTONES.map((m, i) => {
          const done   = i < activeIndex
          const active = i === activeIndex
          return (
            <div key={m.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: done ? '#10b981' : active ? NAVY : '#fff',
                border: done || active ? 'none' : '2px solid #e5e7eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: done || active ? '#fff' : '#cbd5e1',
                boxShadow: active ? `0 0 0 4px ${NAVY}1a` : 'none',
                transition: 'all 0.3s',
              }}>
                {done ? <HiCheckCircle style={{ fontSize: 16 }} /> : i + 1}
              </div>
              <span style={{
                fontSize: 9, fontWeight: active ? 700 : 500,
                color: done ? '#10b981' : active ? NAVY : '#9ca3af',
                marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
              }}>
                {m.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const DashboardOrders = () => {
  const { userOrders, fetchUserOrders, fetchProducts, API_URL } = useGlobal()
  const [selected,   setSelected]   = useState(null)
  const [confirming, setConfirming] = useState(null)
  const [filter,     setFilter]     = useState('all')
  const location = useLocation()
  const width    = useWindowWidth()
  const isMobile = width < 640

  useEffect(() => { fetchUserOrders() }, [])

  useEffect(() => {
    if (location.state?.autoOpenOrderId && userOrders.length > 0) {
      const order = userOrders.find(o => o._id === location.state.autoOpenOrderId)
      if (order) { setSelected(order); window.history.replaceState({}, document.title) }
    }
  }, [location.state, userOrders])

  const cancelOrder = async (id) => {
    try {
      const res = await fetch(`${API_URL}/bookings/${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Order cancelled'); fetchUserOrders(); fetchProducts() }
      else toast.error('Failed to cancel')
    } catch { toast.error('Error cancelling order') }
  }

  const ACTIVE = ['Picked Up', 'During Rental', 'Return Pending', 'Active', 'Approved', 'Ready for Pickup', 'KYC Approved', 'KYC Pending', 'Request Submitted']

  const filtered = userOrders.filter(o => {
    if (filter === 'active')   return ACTIVE.includes(o.status)
    if (filter === 'returned') return ['Returned', 'Closed'].includes(o.status)
    return true
  })

  const tabs = [
    { id: 'all',      label: 'All',       count: userOrders.length },
    { id: 'active',   label: 'Active',    count: userOrders.filter(o => ACTIVE.includes(o.status)).length },
    { id: 'returned', label: 'Completed', count: userOrders.filter(o => ['Returned', 'Closed'].includes(o.status)).length },
  ]

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 6 }}>
          Rental History
        </div>
        <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: NAVY, margin: 0, letterSpacing: '-0.02em' }}>My Orders</h1>
      </div>

      {/* Filter tabs — scrollable on mobile */}
      <div style={{ overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }}>
        <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: 4, borderRadius: 12, width: 'fit-content', minWidth: isMobile ? '100%' : 'auto' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setFilter(t.id)}
              style={{
                flex: isMobile ? 1 : 'none',
                padding: '8px 14px', borderRadius: 9, border: 'none',
                background: filter === t.id ? '#fff' : 'transparent',
                color: filter === t.id ? NAVY : '#64748b',
                fontSize: 13, fontWeight: filter === t.id ? 600 : 500,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: filter === t.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
            >
              {t.label}
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 10,
                background: filter === t.id ? SOFT : '#e2e8f0',
                color: filter === t.id ? NAVY : '#94a3b8',
              }}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, padding: '56px 24px', textAlign: 'center', border: '1px solid #eef0f3' }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <HiOutlineShoppingBag style={{ fontSize: 24, color: '#94a3b8' }} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#334155', marginBottom: 4 }}>No orders yet</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 18 }}>Your rentals will appear here.</div>
          <Link to="/" style={{ background: NAVY, color: '#fff', padding: '10px 22px', borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            Browse Equipment
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(order => {
            const items = order.items?.length ? order.items : [order.productId]
            const sc = STATUS_COLOR[order.status] || { bg: '#f9fafb', color: '#6b7280' }
            return (
              <div key={order._id}
                style={{
                  background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0',
                  padding: isMobile ? '14px' : '16px 20px',
                  display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16,
                  cursor: 'pointer', transition: 'box-shadow 0.15s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}
                onClick={() => setSelected(order)}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'}
              >
                <div style={{ display: 'flex', flexShrink: 0 }}>
                  {items.slice(0, isMobile ? 1 : 3).map((item, i) => (
                    <img key={i}
                      src={getImageUrl(item?.productId?.imageUrl || item?.imageUrl)} alt=""
                      style={{
                        width: isMobile ? 44 : 52, height: isMobile ? 44 : 52,
                        borderRadius: 10, objectFit: 'cover', border: '2px solid #fff',
                        marginLeft: i > 0 ? -16 : 0, background: '#f3f4f6',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                      }}
                    />
                  ))}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: NAVY, fontSize: isMobile ? 13 : 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                    {items.length > 1 ? `${items.length} Items` : (items[0]?.name || 'Order')}
                  </div>
                  {isMobile ? (
                    <StatusBadge status={order.status} />
                  ) : (
                    <div style={{ fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <HiCalendar style={{ fontSize: 12 }} />
                      {new Date(order.startDate).toLocaleDateString('en-GB')}
                      <HiArrowRight style={{ fontSize: 10 }} />
                      {new Date(order.endDate).toLocaleDateString('en-GB')}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 12, flexShrink: 0 }}>
                  {!isMobile && <div style={{ textAlign: 'right' }}>
                    <StatusBadge status={order.status} />
                  </div>}
                  <div style={{ fontWeight: 700, color: NAVY, fontSize: isMobile ? 13 : 16 }}>
                    ₹{order.totalPrice?.toLocaleString()}
                  </div>
                  <HiChevronRight style={{ color: '#cbd5e1', fontSize: 17 }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      {selected && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          padding: isMobile ? '0' : '24px 16px',
          zIndex: 100, overflowY: 'auto',
        }}>
          <div style={{
            background: '#fff',
            maxWidth: isMobile ? '100%' : 680,
            width: '100%',
            borderRadius: isMobile ? '20px 20px 0 0' : 18,
            position: isMobile ? 'fixed' : 'relative',
            bottom: isMobile ? 0 : 'auto',
            left: 0, right: 0,
            boxShadow: '0 24px 64px rgba(0,0,0,0.28)',
            overflow: 'hidden',
            maxHeight: isMobile ? '92vh' : 'auto',
            overflowY: 'auto',
          }}>
            <button onClick={() => setSelected(null)}
              style={{
                position: 'absolute', right: 16, top: 16,
                background: '#f1f5f9', border: 'none', borderRadius: 8,
                width: 32, height: 32, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', zIndex: 10,
              }}>
              <HiX style={{ fontSize: 16 }} />
            </button>

            {/* Handle bar on mobile */}
            {isMobile && (
              <div style={{ padding: '12px 0 4px', display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e5e7eb' }} />
              </div>
            )}

            <div style={{ padding: isMobile ? '16px 18px 0' : '28px 28px 0' }}>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 6 }}>
                  Rental Request
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <h2 style={{ fontSize: isMobile ? 17 : 20, fontWeight: 700, color: NAVY, margin: 0 }}>Order Details</h2>
                  <StatusBadge status={selected.status} />
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 5, fontFamily: 'monospace' }}>#{selected._id?.slice(-8).toUpperCase()}</div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #eef0f3', borderRadius: 14, padding: isMobile ? '14px 10px' : '18px 12px', marginBottom: 20 }}>
                <Stepper status={selected.status} />
              </div>

              {selected.status === 'Rejected' && selected.rejectionReason && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '14px 16px', marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#991b1b', marginBottom: 4, textTransform: 'uppercase' }}>Rejection Reason</div>
                  <div style={{ fontSize: 13, color: '#7f1d1d', fontStyle: 'italic' }}>"{selected.rejectionReason}"</div>
                </div>
              )}

              {/* Equipment + Dates — stack on mobile */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Equipment</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(selected.items?.length ? selected.items : [selected.productId]).map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, background: '#f8fafc', borderRadius: 12, padding: '10px 12px', border: '1px solid #eef0f3' }}>
                        <img src={getImageUrl(item?.productId?.imageUrl || item?.imageUrl)} alt=""
                          style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'contain', background: '#fff', border: '1px solid #eef0f3', flexShrink: 0, padding: 2 }} />
                        <div>
                          <div style={{ fontWeight: 600, color: NAVY, fontSize: 12 }}>
                            {item?.name || 'Unknown Item'}
                            {item?.quantity > 1 && (
                              <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, color: NAVY, background: SOFT, padding: '1px 6px', borderRadius: 4 }}>×{item.quantity}</span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginTop: 2 }}>₹{item?.pricePerDay}/day</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Rental Window</div>
                    <div style={{ background: '#f8fafc', borderRadius: 12, padding: '12px', border: '1px solid #eef0f3' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Start</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{new Date(selected.startDate).toLocaleDateString('en-GB')}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{new Date(selected.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                        <HiArrowRight style={{ color: '#cbd5e1', alignSelf: 'center' }} />
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Return</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{new Date(selected.endDate).toLocaleDateString('en-GB')}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{new Date(selected.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </div>
                      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: '#94a3b8' }}>Duration</span>
                        <span style={{ color: NAVY, fontWeight: 700 }}>{selected.totalDays || 1} day{(selected.totalDays || 1) !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Pickup Location</div>
                    <div style={{ background: '#f8fafc', border: '1px solid #eef0f3', borderRadius: 12, padding: '12px 14px', borderLeft: `3px solid ${NAVY}` }}>
                      {selected.pickupLocation ? (() => {
                        const locs = getAdminSettings().pickupLocations || []
                        const loc  = locs.find(l => l.id === selected.pickupLocation)
                        return (
                          <>
                            <div style={{ fontWeight: 600, color: NAVY, fontSize: 13, marginBottom: 4 }}>{loc?.label || selected.pickupLocation}</div>
                            {loc?.address && <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.6 }}>{loc.address}</div>}
                          </>
                        )
                      })() : (
                        <div style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>To be confirmed after approval</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: NAVY, borderRadius: 14, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Total Amount</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>₹{selected.totalPrice?.toLocaleString()}</div>
                </div>
                <StatusBadge status={selected.status} />
              </div>
            </div>

            <div style={{ padding: isMobile ? '0 18px 24px' : '0 28px 24px' }}>
              {['Request Submitted', 'KYC Pending', 'KYC Approved'].includes(selected.status) && (
                <button onClick={() => setConfirming(selected._id)}
                  style={{
                    width: '100%', padding: '12px',
                    border: '1px solid #fecaca', borderRadius: 10,
                    background: '#fff', color: '#dc2626',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  Cancel this rental
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirm */}
      {confirming && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 18, padding: 28, maxWidth: 340, width: '100%', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.28)' }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 22 }}>
              <HiExclamationCircle />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: NAVY, margin: '0 0 8px' }}>Cancel this order?</h3>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 22, lineHeight: 1.6 }}>
              This cannot be undone. Items will be released back to inventory.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={() => setConfirming(null)} style={{ padding: '11px', background: '#f1f5f9', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#475569' }}>Keep it</button>
              <button onClick={() => { cancelOrder(confirming); setConfirming(null); setSelected(null) }}
                style={{ padding: '11px', background: '#ef4444', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#fff' }}>
                Yes, cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardOrders
