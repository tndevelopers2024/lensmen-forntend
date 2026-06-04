import { useState, useRef, useEffect } from 'react'
import { HiBell, HiX, HiCheck, HiTrash } from 'react-icons/hi'
import { useGlobal } from '../context/GlobalContext'

const TYPE_ICON = {
  booking_new:   '🛍️',
  status_update: '📋',
  cancelled:     '❌',
  kyc:           '🪪',
  default:       '🔔',
}

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000)
  if (diff < 60)   return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const NotificationBell = ({ isAdmin = false }) => {
  const { notifications, markNotificationRead, markAllNotificationsRead, deleteNotification, clearAllNotifications } = useGlobal()
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)

  const unread = notifications.filter(n => !n.read).length

  // Close panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'relative',
          width: 38, height: 38,
          borderRadius: 10,
          border: 'none',
          background: open ? '#f0f1f7' : 'transparent',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isAdmin ? '#6b7280' : '#1a1a2e',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = '#f9fafb' }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent' }}
      >
        <HiBell style={{ fontSize: 20 }} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            background: '#E5550F', color: '#fff',
            fontSize: 9, fontWeight: 800,
            width: 16, height: 16, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff',
            lineHeight: 1,
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: 360,
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 8px 40px rgba(0,0,0,0.14)',
          border: '1px solid #f0f0f0',
          zIndex: 1000,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: '1px solid #f0f0f0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1e1b4b' }}>Notifications</span>
              {unread > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  background: '#fff7ed', color: '#E5550F',
                  padding: '2px 7px', borderRadius: 10,
                }}>
                  {unread} new
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {unread > 0 && (
                <button
                  onClick={() => markAllNotificationsRead()}
                  title="Mark all read"
                  style={{
                    padding: '4px 8px', borderRadius: 7, border: 'none',
                    background: '#f1f5f9', color: '#64748b',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  <HiCheck style={{ fontSize: 12 }} /> All read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => clearAllNotifications()}
                  title="Clear all"
                  style={{
                    padding: '4px 8px', borderRadius: 7, border: 'none',
                    background: '#fef2f2', color: '#ef4444',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  <HiTrash style={{ fontSize: 12 }} /> Clear
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🔔</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>No notifications yet</div>
                <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4 }}>Updates will appear here</div>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n._id}
                  onClick={() => !n.read && markNotificationRead(n._id)}
                  style={{
                    display: 'flex', gap: 12, padding: '12px 16px',
                    borderBottom: '1px solid #f8fafc',
                    background: n.read ? '#fff' : '#fdfaf7',
                    cursor: n.read ? 'default' : 'pointer',
                    transition: 'background 0.12s',
                    position: 'relative',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb' }}
                  onMouseLeave={e => { e.currentTarget.style.background = n.read ? '#fff' : '#fdfaf7' }}
                >
                  {/* Unread dot */}
                  {!n.read && (
                    <div style={{
                      position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)',
                      width: 6, height: 6, borderRadius: '50%', background: '#E5550F',
                    }} />
                  )}

                  {/* Icon */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: '#f1f5f9', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16,
                  }}>
                    {TYPE_ICON[n.type] || TYPE_ICON.default}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, color: '#111827', marginBottom: 2 }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{n.message}</div>
                    <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4, fontWeight: 500 }}>
                      {timeAgo(n.createdAt)}
                    </div>
                  </div>

                  {/* Delete btn */}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotification(n._id) }}
                    style={{
                      width: 22, height: 22, borderRadius: 6, border: 'none',
                      background: 'transparent', color: '#d1d5db',
                      cursor: 'pointer', flexShrink: 0, alignSelf: 'flex-start', marginTop: 2,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#d1d5db'; e.currentTarget.style.background = 'transparent' }}
                  >
                    <HiX style={{ fontSize: 11 }} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
