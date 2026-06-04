import { useGlobal } from '../../context/GlobalContext'
import { Link } from 'react-router-dom'
import { HiCheck, HiTrash, HiBell, HiCheckCircle, HiShoppingBag } from 'react-icons/hi'

const NAVY  = '#1e1b4b'
const BRAND = '#E5550F'

const TYPE_META = {
  booking_new:   { icon: '🛍️', bg: '#eef2ff' },
  status_update: { icon: '📋', bg: '#f0fdf4' },
  cancelled:     { icon: '❌', bg: '#fef2f2' },
  kyc:           { icon: '🪪', bg: '#fffbeb' },
  default:       { icon: '🔔', bg: '#f9fafb' },
}

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000)
  if (diff < 60)    return 'Just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const DashboardNotifications = () => {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    clearAllNotifications,
  } = useGlobal()

  const unread = notifications.filter(n => !n.read).length

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 6 }}>
          My Account
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: NAVY, margin: 0, letterSpacing: '-0.02em' }}>
            Notifications
            {unread > 0 && (
              <span style={{
                marginLeft: 10, fontSize: 13, fontWeight: 700,
                background: BRAND, color: '#fff',
                padding: '2px 10px', borderRadius: 20, verticalAlign: 'middle',
              }}>
                {unread} new
              </span>
            )}
          </h1>
          <div style={{ display: 'flex', gap: 8 }}>
            {unread > 0 && (
              <button
                onClick={markAllNotificationsRead}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 10, border: '1px solid #e5e7eb',
                  background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <HiCheck style={{ fontSize: 14 }} /> Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 10, border: '1px solid #fecaca',
                  background: '#fff', color: '#ef4444', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <HiTrash style={{ fontSize: 13 }} /> Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Empty */}
      {notifications.length === 0 ? (
        <div style={{
          background: '#fff', borderRadius: 16, border: '1px solid #eef0f3',
          padding: '80px 24px', textAlign: 'center',
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: '#f1f5f9', margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <HiBell style={{ fontSize: 26, color: '#cbd5e1' }} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#334155', marginBottom: 6 }}>No notifications yet</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
            You'll be notified when your rental is approved, ready, or has status updates.
          </div>
          <Link to="/" style={{
            background: NAVY, color: '#fff', padding: '10px 22px',
            borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            <HiShoppingBag /> Browse Equipment
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map(n => {
            const meta = TYPE_META[n.type] || TYPE_META.default
            return (
              <div
                key={n._id}
                onClick={() => !n.read && markNotificationRead(n._id)}
                style={{
                  background: '#fff',
                  borderRadius: 14,
                  border: `1px solid ${n.read ? '#eef0f3' : '#dbeafe'}`,
                  borderLeft: `4px solid ${n.read ? '#e5e7eb' : NAVY}`,
                  padding: '16px 18px',
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  cursor: n.read ? 'default' : 'pointer',
                  transition: 'box-shadow 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >
                {/* Icon */}
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: meta.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 19,
                }}>
                  {meta.icon}
                </div>

                {/* Body */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: n.read ? 500 : 700, color: '#0f172a' }}>
                      {n.title}
                    </span>
                    {!n.read && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '2px 7px',
                        borderRadius: 6, background: '#eff6ff', color: '#3b82f6',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                      }}>
                        New
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{n.message}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 5, fontWeight: 500 }}>{timeAgo(n.createdAt)}</div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {!n.read && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markNotificationRead(n._id) }}
                      title="Mark as read"
                      style={{
                        width: 30, height: 30, borderRadius: 8,
                        border: '1px solid #e5e7eb', background: '#fff',
                        cursor: 'pointer', color: '#9ca3af',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.color = '#10b981'; e.currentTarget.style.borderColor = '#bbf7d0' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.borderColor = '#e5e7eb' }}
                    >
                      <HiCheckCircle style={{ fontSize: 15 }} />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotification(n._id) }}
                    title="Delete"
                    style={{
                      width: 30, height: 30, borderRadius: 8,
                      border: '1px solid #e5e7eb', background: '#fff',
                      cursor: 'pointer', color: '#9ca3af',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fecaca' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.borderColor = '#e5e7eb' }}
                  >
                    <HiTrash style={{ fontSize: 14 }} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default DashboardNotifications
