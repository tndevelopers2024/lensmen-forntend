import { useState } from 'react'
import { Switch, Button, TimePicker } from 'antd'
import {
  BellOutlined, ClockCircleOutlined, SaveOutlined, FileProtectOutlined,
  EnvironmentOutlined, PlusOutlined, DeleteOutlined,
} from '@ant-design/icons'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import PageHeader from '../../components/PageHeader'

const NAVY  = '#1e1b4b'
const BRAND = '#E5550F'

export const SETTINGS_KEY = 'lensmen_admin_settings'

export const getAdminSettings = () => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS
  } catch { return DEFAULTS }
}

const DEFAULTS = {
  maxRentalDays:     10,
  openTime:          '09:00',
  closeTime:         '18:00',
  closedDays:        ['Sunday'],
  notifyNewBooking:  true,
  notifyKyc:         true,
  notifyReturn:      true,
  notifyPayment:     false,
  pickupLocations: [
    { id: 'velachery', label: 'Velachery Studio',  address: '15 Film City Road, Velachery, Chennai – 600042' },
    { id: 'tnagar',    label: 'T. Nagar Office',   address: '45 Usman Road, T. Nagar, Chennai – 600017' },
  ],
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const Section = ({ icon, title, subtitle, children }) => (
  <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
    <div style={{ padding: '18px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ color: NAVY, fontSize: 16 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>{subtitle}</div>}
      </div>
    </div>
    <div style={{ padding: '20px 24px' }}>{children}</div>
  </div>
)

const ToggleRow = ({ label, desc, checked, onChange, last }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 0', borderBottom: last ? 'none' : '1px solid #f9fafb',
  }}>
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{label}</div>
      {desc && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{desc}</div>}
    </div>
    <Switch checked={checked} onChange={onChange} style={{ background: checked ? BRAND : undefined }} />
  </div>
)

const AdminSettings = () => {
  const [settings, setSettings] = useState(() => getAdminSettings())
  const [saving, setSaving] = useState(false)

  const set = (key, value) => setSettings(s => ({ ...s, [key]: value }))

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 300))
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
      toast.success('Settings saved')
    } catch {
      toast.error('Failed to save settings')
    }
    setSaving(false)
  }

  const toggleDay = (day) => {
    set('closedDays', settings.closedDays.includes(day)
      ? settings.closedDays.filter(d => d !== day)
      : [...settings.closedDays, day])
  }

  return (
    <div>
      <PageHeader
        eyebrow="Admin Panel"
        title="Settings"
        subtitle="Booking rules, business hours, and notification preferences"
        actions={
          <Button
            type="primary" icon={<SaveOutlined />} size="large"
            loading={saving} onClick={handleSave}
            style={{ background: NAVY, borderColor: NAVY }}
          >
            Save Changes
          </Button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Rental Policy */}
          <Section
            icon={<FileProtectOutlined />}
            title="Rental Policy"
            subtitle="Applied when customers create bookings"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Maximum Rental Duration
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="number" min={1} max={365}
                    value={settings.maxRentalDays}
                    onChange={e => set('maxRentalDays', Math.max(1, parseInt(e.target.value) || 10))}
                    style={{
                      width: 80, padding: '8px 12px',
                      border: '1px solid #d1d5db', borderRadius: 8,
                      fontSize: 15, fontWeight: 700, color: NAVY,
                      outline: 'none', textAlign: 'center',
                    }}
                  />
                  <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>days per booking</span>
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
                  Customers cannot select a rental period longer than this.
                </div>
              </div>
            </div>
          </Section>

          {/* Pickup Locations */}
          <Section
            icon={<EnvironmentOutlined />}
            title="Pickup Locations"
            subtitle="Office addresses shown to customers when their order is approved"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {settings.pickupLocations.map((loc, idx) => (
                <div key={loc.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr 1.6fr auto',
                  gap: 8, alignItems: 'center',
                  background: '#f8fafc', borderRadius: 10, padding: '10px 12px',
                  border: '1px solid #eef0f3',
                }}>
                  <input
                    placeholder="Office name"
                    value={loc.label}
                    onChange={e => {
                      const locs = [...settings.pickupLocations]
                      locs[idx] = { ...locs[idx], label: e.target.value }
                      set('pickupLocations', locs)
                    }}
                    style={{
                      padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 8,
                      fontSize: 13, fontWeight: 600, color: NAVY, outline: 'none', background: '#fff',
                    }}
                  />
                  <input
                    placeholder="Full address"
                    value={loc.address}
                    onChange={e => {
                      const locs = [...settings.pickupLocations]
                      locs[idx] = { ...locs[idx], address: e.target.value }
                      set('pickupLocations', locs)
                    }}
                    style={{
                      padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 8,
                      fontSize: 12, color: '#374151', outline: 'none', background: '#fff',
                    }}
                  />
                  <button
                    onClick={() => set('pickupLocations', settings.pickupLocations.filter((_, i) => i !== idx))}
                    style={{
                      width: 32, height: 32, borderRadius: 8, border: 'none',
                      background: '#fef2f2', color: '#ef4444',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, flexShrink: 0,
                    }}
                  >
                    <DeleteOutlined />
                  </button>
                </div>
              ))}
              <button
                onClick={() => set('pickupLocations', [
                  ...settings.pickupLocations,
                  { id: `loc_${Date.now()}`, label: '', address: '' },
                ])}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', border: `1.5px dashed ${NAVY}`, borderRadius: 10,
                  background: 'transparent', color: NAVY, fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', alignSelf: 'flex-start', marginTop: 2,
                }}
              >
                <PlusOutlined style={{ fontSize: 12 }} />
                Add Location
              </button>
            </div>
          </Section>

          {/* Notifications */}
          <Section
            icon={<BellOutlined />}
            title="Notifications"
            subtitle="Which events trigger alerts in the admin panel"
          >
            <ToggleRow
              label="New Booking Request"
              desc="When a customer submits a rental request"
              checked={settings.notifyNewBooking}
              onChange={v => set('notifyNewBooking', v)}
            />
            <ToggleRow
              label="KYC Submission"
              desc="When a customer uploads KYC documents"
              checked={settings.notifyKyc}
              onChange={v => set('notifyKyc', v)}
            />
            <ToggleRow
              label="Return Due"
              desc="24 hours before a rental return date"
              checked={settings.notifyReturn}
              onChange={v => set('notifyReturn', v)}
            />
            <ToggleRow
              label="Payment Recorded"
              desc="When a payment is logged on an order"
              checked={settings.notifyPayment}
              onChange={v => set('notifyPayment', v)}
              last
            />
          </Section>
        </div>

        {/* Right */}
        <Section
          icon={<ClockCircleOutlined />}
          title="Business Hours"
          subtitle="When your store is open"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Opens at',  key: 'openTime',  def: '09:00' },
              { label: 'Closes at', key: 'closeTime', def: '18:00' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {f.label}
                </label>
                <TimePicker
                  size="large" format="HH:mm" style={{ width: '100%' }}
                  value={dayjs(settings[f.key], 'HH:mm')}
                  onChange={(_, str) => set(f.key, str || f.def)}
                  minuteStep={30}
                />
              </div>
            ))}
          </div>

          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Closed On
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {DAYS.map(day => {
              const closed = settings.closedDays.includes(day)
              return (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  style={{
                    padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                    background: closed ? NAVY : '#f1f5f9',
                    color: closed ? '#fff' : '#475569',
                  }}
                >
                  {day.slice(0, 3)}
                </button>
              )
            })}
          </div>
          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 10 }}>
            Highlighted days are marked as closed.
          </p>
        </Section>

      </div>
    </div>
  )
}

export default AdminSettings
