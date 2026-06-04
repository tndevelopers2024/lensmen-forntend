import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useGlobal } from '../../context/GlobalContext'
import toast from 'react-hot-toast'
import {
  HiOutlineUser, HiOutlinePhone, HiOutlineLocationMarker, HiOutlineMail,
  HiOutlineShieldCheck, HiOutlineSparkles, HiOutlineArrowNarrowRight,
} from 'react-icons/hi'

const BRAND = '#1e1b4b'
const NAVY  = '#1e1b4b'
const INK   = '#1a1a2e'
const MUTED = '#9499a6'
const LINE  = '#ededf1'

const DashboardAccount = () => {
  const { user, updateProfile } = useGlobal()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    mobile:   user?.mobile   || '',
    address:  user?.address  || '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const res = await updateProfile(formData)
    setLoading(false)
    if (res.success) toast.success('Profile updated!')
    else toast.error(res.message || 'Update failed')
  }

  const Field = ({ label, icon: Icon, children }) => (
    <div style={{ marginBottom: 20 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <Icon style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 18, pointerEvents: 'none' }} />
        {children}
      </div>
    </div>
  )

  const kycMap = {
    Approved:       { color: '#16a34a', label: 'Verified' },
    Pending:        { color: '#e0a912', label: 'Pending' },
    Rejected:       { color: '#dc2626', label: 'Rejected' },
    'Not Uploaded': { color: MUTED,     label: 'Not submitted' },
  }
  const kyc = kycMap[user?.kycStatus || 'Not Uploaded']

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 6 }}>
          Account Settings
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: INK, margin: 0, letterSpacing: '-0.02em' }}>Your Profile</h1>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>

        {/* ── Left: editable form ──────────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${LINE}`, overflow: 'hidden' }}>
          {/* Identity row */}
          <div style={{ padding: '22px 24px', borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: NAVY, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700, flexShrink: 0,
            }}>
              {user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: INK }}>{user?.fullName}</div>
              <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>Manage your profile &amp; preferences</div>
            </div>
          </div>

          <div style={{ padding: 24 }}>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                <Field label="Full Name" icon={HiOutlineUser}>
                  <input type="text" required value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })} style={inputStyle} />
                </Field>
                <Field label="Mobile Number" icon={HiOutlinePhone}>
                  <input type="tel" required value={formData.mobile}
                    onChange={e => setFormData({ ...formData, mobile: e.target.value })} style={inputStyle} />
                </Field>
              </div>

              {/* Email (read-only) */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: 6 }}>
                  Registered Email
                </label>
                <div style={{ background: '#f9fafb', border: '1px solid #f0f0f0', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <HiOutlineMail style={{ color: '#9ca3af', fontSize: 18, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#6b7280' }}>{user?.email}</span>
                </div>
              </div>

              <Field label="Delivery Address" icon={HiOutlineLocationMarker}>
                <textarea required rows={3} value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  style={{ ...inputStyle, paddingTop: 12, paddingBottom: 12, height: 'auto', resize: 'none' }} />
              </Field>

              <button type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '13px', marginTop: 8,
                  background: loading ? '#9ca3af' : NAVY,
                  color: '#fff', border: 'none', borderRadius: 12,
                  fontSize: 13, fontWeight: 800, textTransform: 'uppercase',
                  letterSpacing: '0.1em', cursor: loading ? 'not-allowed' : 'pointer',
                }}>
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>
        </div>

        {/* ── Right: account summary ───────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Status card */}
          <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${LINE}`, padding: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>
              Account Status
            </div>

            <SummaryRow icon={HiOutlineShieldCheck} label="KYC Verification">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: kyc.color }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: kyc.color }} />
                {kyc.label}
              </span>
            </SummaryRow>

            <SummaryRow icon={HiOutlineSparkles} label="Membership">
              <span style={{ fontSize: 13, fontWeight: 600, color: INK }}>{user?.customerClass || 'New'}</span>
            </SummaryRow>

            <SummaryRow icon={HiOutlineUser} label="Account Role" last>
              <span style={{ fontSize: 13, fontWeight: 600, color: INK, textTransform: 'capitalize' }}>{user?.role || 'user'}</span>
            </SummaryRow>
          </div>

          {/* KYC CTA if not approved */}
          {user?.kycStatus !== 'Approved' && (
            <Link to="/dashboard/kyc" style={{
              background: '#fff', borderRadius: 14, border: `1px solid ${LINE}`,
              borderLeft: `3px solid ${BRAND}`, padding: '18px 20px',
              textDecoration: 'none', display: 'block',
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 4 }}>
                Complete verification
              </div>
              <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 12, lineHeight: 1.5 }}>
                Submit your KYC documents to unlock equipment rentals.
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: BRAND, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                Go to KYC <HiOutlineArrowNarrowRight style={{ fontSize: 15 }} />
              </span>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Summary row helper ──────────────────────────────────────────────────
const SummaryRow = ({ icon: Icon, label, children, last }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: last ? 'none' : `1px solid ${LINE}`,
  }}>
    <span style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: MUTED }}>
      <Icon style={{ fontSize: 17 }} />
      {label}
    </span>
    {children}
  </div>
)

const inputStyle = {
  width: '100%', padding: '11px 14px 11px 42px',
  background: '#f9fafb', border: '1px solid #f0f0f0',
  borderRadius: 10, fontSize: 13, color: '#111827',
  outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit',
}

export default DashboardAccount
