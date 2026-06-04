import { useGlobal } from '../../context/GlobalContext'
import PageHeader from '../../components/PageHeader'
import { HiCheck, HiTrash, HiBell, HiCheckCircle } from 'react-icons/hi'

const NAVY  = '#1e1b4b'
const BRAND = '#E5550F'

const TYPE_META = {
  booking_new:   { icon: '🛍️', color: '#6366f1', bg: '#eef2ff' },
  status_update: { icon: '📋', color: '#10b981', bg: '#f0fdf4' },
  cancelled:     { icon: '❌', color: '#ef4444', bg: '#fef2f2' },
  kyc:           { icon: '🪪', color: '#f59e0b', bg: '#fffbeb' },
  default:       { icon: '🔔', color: '#6b7280', bg: '#f9fafb' },
}

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000)
  if (diff < 60)    return 'Just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const AdminNotifications = () => {
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
      <PageHeader
        eyebrow="Admin Panel"
        title="Notifications"
        subtitle="Stay updated on bookings, KYC submissions, and order activity"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            {unread > 0 && (
              <button
                onClick={markAllNotificationsRead}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 10, border: '1px solid #e5e7eb',
                  background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = NAVY}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
              >
                <HiCheck style={{ fontSize: 15 }} /> Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 10, border: '1px solid #fecaca',
                  background: '#fff', color: '#ef4444', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                <HiTrash style={{ fontSize: 14 }} /> Clear all
              </button>
            )}
          </div>
        }
      />

      {/* Stats row */}
      {notifications.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total',  value: notifications.length,                                        color: NAVY  },
            { label: 'Unread', value: unread,                                                      color: BRAND },
            { label: 'Read',   value: notifications.filter(n => n.read).length,                   color: '#10b981' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#fff', borderRadius: 12, padding: '14px 20px',
              border: '1px solid #f0f0f0', minWidth: 100,
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {notifications.length === 0 ? (
        <div style={{
          background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0',
          padding: '80px 24px', textAlign: 'center',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: '#f1f5f9', margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <HiBell style={{ fontSize: 28, color: '#cbd5e1' }} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#374151', marginBottom: 6 }}>All caught up!</div>
          <div style={{ fontSize: 13, color: '#9ca3af' }}>New bookings, KYC events, and order updates will appear here.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map(n => {
            const meta = TYPE_META[n.type] || TYPE_META.default
            return (
              <div
                key={n._id}
                style={{
                  background: '#fff',
                  borderRadius: 14,
                  border: `1px solid ${n.read ? '#f0f0f0' : '#e0e7ff'}`,
                  borderLeft: `4px solid ${n.read ? '#e5e7eb' : NAVY}`,
                  padding: '16px 20px',
                  display: 'flex', alignItems: 'flex-start', gap: 16,
                  transition: 'box-shadow 0.15s',
                  cursor: n.read ? 'default' : 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                onClick={() => !n.read && markNotificationRead(n._id)}
              >
                {/* Icon */}
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: meta.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                }}>
                  {meta.icon}
                </div>

                {/* Body */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: n.read ? 500 : 700, color: '#111827' }}>
                      {n.title}
                    </span>
                    {!n.read && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px',
                        borderRadius: 8, background: '#eff6ff', color: '#3b82f6',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                      }}>
                        New
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>{n.message}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6, fontWeight: 500 }}>{timeAgo(n.createdAt)}</div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {!n.read && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markNotificationRead(n._id) }}
                      title="Mark as read"
                      style={{
                        width: 32, height: 32, borderRadius: 8,
                        border: '1px solid #e5e7eb', background: '#fff',
                        cursor: 'pointer', color: '#9ca3af',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.color = '#10b981'; e.currentTarget.style.borderColor = '#bbf7d0' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.borderColor = '#e5e7eb' }}
                    >
                      <HiCheckCircle style={{ fontSize: 16 }} />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotification(n._id) }}
                    title="Delete"
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      border: '1px solid #e5e7eb', background: '#fff',
                      cursor: 'pointer', color: '#9ca3af',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fecaca' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.borderColor = '#e5e7eb' }}
                  >
                    <HiTrash style={{ fontSize: 15 }} />
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

export default AdminNotifications
