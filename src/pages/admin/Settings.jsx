import { useState, useEffect } from 'react'
import { Input, Switch, Button, TimePicker, Divider, Select } from 'antd'
import {
  ShopOutlined, BellOutlined, ClockCircleOutlined,
  SaveOutlined, EnvironmentOutlined, PhoneOutlined,
  MailOutlined, GlobalOutlined,
} from '@ant-design/icons'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import PageHeader from '../../components/PageHeader'

const { TextArea } = Input
const NAVY  = '#1e1b4b'
const BRAND = '#E5550F'

const STORAGE_KEY = 'lensmen_admin_settings'

const DEFAULTS = {
  storeName:    'Lensmen Rentals',
  storeEmail:   'contact@lensmenrentals.com',
  storeMobile:  '',
  storeAddress: '',
  storeWebsite: '',
  currency:     'INR',
  maxRentalDays: 10,
  openTime:     '09:00',
  closeTime:    '18:00',
  closedDays:   ['Sunday'],
  notifyNewBooking:  true,
  notifyKyc:         true,
  notifyReturn:      true,
  notifyPayment:     false,
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// ── Section wrapper ───────────────────────────────────────────────────
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

// ── Field row ─────────────────────────────────────────────────────────
const Field = ({ label, hint, children }) => (
  <div style={{ marginBottom: 18 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {label}
    </label>
    {children}
    {hint && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 5 }}>{hint}</div>}
  </div>
)

// ── Toggle row ────────────────────────────────────────────────────────
const ToggleRow = ({ label, desc, checked, onChange }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 0', borderBottom: '1px solid #f9fafb',
  }}>
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{label}</div>
      {desc && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{desc}</div>}
    </div>
    <Switch
      checked={checked}
      onChange={onChange}
      style={{ background: checked ? BRAND : undefined }}
    />
  </div>
)

// ── Main ──────────────────────────────────────────────────────────────
const AdminSettings = () => {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS
    } catch { return DEFAULTS }
  })
  const [saving, setSaving] = useState(false)

  const set = (key, value) => setSettings(s => ({ ...s, [key]: value }))

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 400))
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
      toast.success('Settings saved')
    } catch {
      toast.error('Failed to save settings')
    }
    setSaving(false)
  }

  const toggleDay = (day) => {
    const days = settings.closedDays.includes(day)
      ? settings.closedDays.filter(d => d !== day)
      : [...settings.closedDays, day]
    set('closedDays', days)
  }

  return (
    <div>
      <PageHeader
        eyebrow="Admin Panel"
        title="Settings"
        subtitle="Configure your store details, hours, and preferences"
        actions={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            size="large"
            loading={saving}
            onClick={handleSave}
            style={{ background: NAVY, borderColor: NAVY }}
          >
            Save Changes
          </Button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Store Info */}
          <Section icon={<ShopOutlined />} title="Store Information" subtitle="Public-facing business details">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Store Name">
                <Input
                  size="large" value={settings.storeName}
                  onChange={e => set('storeName', e.target.value)}
                  prefix={<ShopOutlined style={{ color: '#d1d5db' }} />}
                />
              </Field>
              <Field label="Currency">
                <Select
                  size="large" style={{ width: '100%' }} value={settings.currency}
                  onChange={v => set('currency', v)}
                  options={[
                    { value: 'INR', label: '₹ Indian Rupee (INR)' },
                    { value: 'USD', label: '$ US Dollar (USD)' },
                    { value: 'EUR', label: '€ Euro (EUR)' },
                  ]}
                />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Contact Email">
                <Input
                  size="large" type="email" value={settings.storeEmail}
                  onChange={e => set('storeEmail', e.target.value)}
                  prefix={<MailOutlined style={{ color: '#d1d5db' }} />}
                />
              </Field>
              <Field label="Contact Mobile">
                <Input
                  size="large" value={settings.storeMobile}
                  onChange={e => set('storeMobile', e.target.value)}
                  prefix={<PhoneOutlined style={{ color: '#d1d5db' }} />}
                  placeholder="+91 98765 43210"
                />
              </Field>
            </div>
            <Field label="Website">
              <Input
                size="large" value={settings.storeWebsite}
                onChange={e => set('storeWebsite', e.target.value)}
                prefix={<GlobalOutlined style={{ color: '#d1d5db' }} />}
                placeholder="https://lensmenrentals.com"
              />
            </Field>
            <Field label="Address" hint="Shown as pickup location on customer order details">
              <TextArea
                rows={3} value={settings.storeAddress}
                onChange={e => set('storeAddress', e.target.value)}
                placeholder="123 Studio Street, Film City, Chennai - 600001"
              />
            </Field>
          </Section>

          {/* Rental Policy */}
          <Section icon={<ClockCircleOutlined />} title="Rental Policy" subtitle="Rules applied to all bookings">
            <Field label="Maximum Rental Duration (days)" hint="Customers cannot book for longer than this period">
              <Input
                size="large" type="number" min={1} max={365}
                value={settings.maxRentalDays}
                onChange={e => set('maxRentalDays', parseInt(e.target.value) || 10)}
                style={{ width: 160 }}
                suffix="days"
              />
            </Field>
          </Section>

        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Business Hours */}
          <Section icon={<ClockCircleOutlined />} title="Business Hours">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <Field label="Opens at">
                <TimePicker
                  size="large" format="HH:mm" style={{ width: '100%' }}
                  value={dayjs(settings.openTime, 'HH:mm')}
                  onChange={(_, str) => set('openTime', str || '09:00')}
                  minuteStep={30}
                />
              </Field>
              <Field label="Closes at">
                <TimePicker
                  size="large" format="HH:mm" style={{ width: '100%' }}
                  value={dayjs(settings.closeTime, 'HH:mm')}
                  onChange={(_, str) => set('closeTime', str || '18:00')}
                  minuteStep={30}
                />
              </Field>
            </div>

            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Closed on
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
              Selected days are highlighted as closed.
            </p>
          </Section>

          {/* Notifications */}
          <Section icon={<BellOutlined />} title="Notifications" subtitle="Admin alert preferences">
            <ToggleRow
              label="New Booking Request"
              desc="Alert when a customer submits a new rental"
              checked={settings.notifyNewBooking}
              onChange={v => set('notifyNewBooking', v)}
            />
            <ToggleRow
              label="KYC Submission"
              desc="Alert when KYC documents are uploaded"
              checked={settings.notifyKyc}
              onChange={v => set('notifyKyc', v)}
            />
            <ToggleRow
              label="Return Due"
              desc="Alert 24h before an order's return date"
              checked={settings.notifyReturn}
              onChange={v => set('notifyReturn', v)}
            />
            <ToggleRow
              label="Payment Received"
              desc="Alert when a payment is logged"
              checked={settings.notifyPayment}
              onChange={v => set('notifyPayment', v)}
            />
          </Section>

          {/* Danger zone */}
          <div style={{
            background: '#fff', borderRadius: 16,
            border: '1px solid #fee2e2', overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #fee2e2' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#dc2626' }}>Danger Zone</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Irreversible actions</div>
            </div>
            <div style={{ padding: '16px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Reset all settings</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Restore defaults and clear saved config</div>
                </div>
                <Button
                  danger size="small"
                  onClick={() => {
                    setSettings(DEFAULTS)
                    localStorage.removeItem(STORAGE_KEY)
                    toast.success('Settings reset to defaults')
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default AdminSettings
