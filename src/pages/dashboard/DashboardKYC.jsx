import { useState } from 'react'
import { useGlobal } from '../../context/GlobalContext'
import toast from 'react-hot-toast'
import { HiUpload, HiCheckCircle, HiClock, HiExclamationCircle, HiEye } from 'react-icons/hi'

const BRAND = '#1e1b4b'
const NAVY  = '#1e1b4b'
const INK   = '#1a1a2e'
const MUTED = '#9499a6'
const LINE  = '#ededf1'

const KYC_DOCS = [
  { key: 'aadhaarFront', label: 'Aadhaar Front' },
  { key: 'aadhaarBack',  label: 'Aadhaar Back' },
  { key: 'panFront',     label: 'PAN Front' },
  { key: 'panBack',      label: 'PAN Back' },
]

const DashboardKYC = () => {
  const { user, setUser, API_URL } = useGlobal()
  const [files, setFiles]     = useState({ aadhaarFront: null, aadhaarBack: null, panFront: null, panBack: null })
  const [uploading, setUploading] = useState(false)

  const handleFile = (key, file) => setFiles(prev => ({ ...prev, [key]: file }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const allSelected = KYC_DOCS.every(d => files[d.key])
    if (!allSelected) { toast.error('Please select all 4 documents'); return }

    setUploading(true)
    const form = new FormData()
    form.append('email', user.email)
    KYC_DOCS.forEach(d => form.append(d.key, files[d.key]))

    try {
      const res  = await fetch(`${API_URL}/user/kyc`, { method: 'POST', body: form })
      const data = await res.json()
      if (res.ok) {
        toast.success('KYC documents uploaded!')
        setUser(data)
        setFiles({ aadhaarFront: null, aadhaarBack: null, panFront: null, panBack: null })
      } else {
        toast.error(data.message || 'Upload failed')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setUploading(false)
    }
  }

  // Status banner config
  const STATUS_CFG = {
    Approved: {
      icon: <HiCheckCircle />, color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0',
      title: 'KYC Verified & Approved',
      desc: 'Your identity is fully verified. You can rent equipment without restrictions.',
    },
    Pending: {
      icon: <HiClock />, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a',
      title: 'Pending Verification',
      desc: 'Admin is reviewing your documents. Usually verified within 1-2 hours.',
    },
    Rejected: {
      icon: <HiExclamationCircle />, color: '#ef4444', bg: '#fef2f2', border: '#fecaca',
      title: 'Verification Rejected',
      desc: user?.kycRejectionReason ? `Reason: "${user.kycRejectionReason}"` : 'Please re-upload your documents.',
    },
    'Not Uploaded': {
      icon: <HiUpload />, color: '#9ca3af', bg: '#f9fafb', border: '#f0f0f0',
      title: 'Documents Not Submitted',
      desc: 'Upload your Aadhaar (Front & Back) and PAN (Front & Back) to get verified.',
    },
  }

  const status = user?.kycStatus || 'Not Uploaded'
  const sc = STATUS_CFG[status]

  const hasSubmitted = user?.kycDocuments && Object.values(user.kycDocuments).some(Boolean)
  const twoCol = status !== 'Approved' && hasSubmitted

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 6 }}>
          Identity Verification
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: INK, margin: 0, letterSpacing: '-0.02em' }}>KYC Documents</h1>
      </div>

      {/* Status Banner — left accent, neutral surface */}
      <div style={{
        background: '#fff', border: `1px solid ${LINE}`, borderLeft: `3px solid ${sc.color}`,
        borderRadius: 12, padding: '16px 20px',
        display: 'flex', alignItems: 'flex-start', gap: 14,
      }}>
        <div style={{ fontSize: 22, color: sc.color, flexShrink: 0, marginTop: 1 }}>{sc.icon}</div>
        <div>
          <div style={{ fontWeight: 600, color: INK, fontSize: 14, marginBottom: 3 }}>{sc.title}</div>
          <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>{sc.desc}</div>
        </div>
      </div>

      {/* Upload + Submitted columns */}
      <div style={{ display: 'grid', gridTemplateColumns: twoCol ? 'minmax(0,1fr) minmax(0,1fr)' : '1fr', gap: 20, alignItems: 'start' }}>

      {/* Upload Form — show unless approved */}
      {status !== 'Approved' && (
        <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${LINE}`, padding: '24px' }}>
          <div style={{ fontWeight: 800, color: NAVY, fontSize: 15, marginBottom: 4 }}>
            {status === 'Rejected' ? 'Re-upload Documents' : 'Upload KYC Documents'}
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 20 }}>
            Submit documents to request verification.
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              {KYC_DOCS.map(doc => {
                const file = files[doc.key]
                return (
                  <div key={doc.key}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                      {doc.label}
                    </div>
                    <label style={{ display: 'block', cursor: 'pointer', position: 'relative' }}>
                      <div style={{
                        border: `2px dashed ${file ? BRAND : '#e5e7eb'}`,
                        borderRadius: 12,
                        padding: '20px 12px',
                        textAlign: 'center',
                        background: file ? '#eef2ff' : '#fafafa',
                        transition: 'all 0.15s',
                      }}>
                        {file ? (
                          <>
                            <HiCheckCircle style={{ fontSize: 22, color: '#10b981', margin: '0 auto 6px' }} />
                            <div style={{ fontSize: 10, fontWeight: 600, color: BRAND, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 8px' }}>
                              {file.name}
                            </div>
                          </>
                        ) : (
                          <>
                            <HiUpload style={{ fontSize: 22, color: '#d1d5db', marginBottom: 6 }} />
                            <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>Select Image</div>
                          </>
                        )}
                      </div>
                      <input
                        type="file" accept="image/*"
                        onChange={e => handleFile(doc.key, e.target.files[0])}
                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }}
                      />
                    </label>
                  </div>
                )
              })}
            </div>

            <button
              type="submit" disabled={uploading}
              style={{
                width: '100%', padding: '14px',
                background: uploading ? '#9ca3af' : NAVY,
                color: '#fff', border: 'none', borderRadius: 12,
                fontSize: 13, fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: '0.1em', cursor: uploading ? 'not-allowed' : 'pointer',
              }}
            >
              {uploading ? 'Uploading...' : 'Submit KYC Documents'}
            </button>
          </form>
        </div>
      )}

      {/* Submitted documents preview */}
      {hasSubmitted && (
        <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${LINE}`, padding: '24px' }}>
          <div style={{ fontWeight: 600, color: INK, fontSize: 15, marginBottom: 4 }}>Submitted Documents</div>
          <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 18 }}>Documents currently on file.</div>

          <div style={{ display: 'grid', gridTemplateColumns: twoCol ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 14 }}>
            {KYC_DOCS.map(doc => {
              const url = user?.kycDocuments?.[doc.key]
              if (!url) return null
              return (
                <div key={doc.key} style={{ background: '#f9fafb', borderRadius: 12, padding: '12px', border: `1px solid ${LINE}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                    {doc.label}
                  </div>
                  <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', height: 110, background: '#fff', border: '1px solid #e5e7eb' }}>
                    <img src={url} alt={doc.label} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
                    <a
                      href={url} target="_blank" rel="noopener noreferrer"
                      style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(0,0,0,0)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.2s',
                        textDecoration: 'none',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
                    >
                      <HiEye style={{ color: '#fff', fontSize: 22, opacity: 0, transition: 'opacity 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.opacity = 1}
                      />
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      </div>
    </div>
  )
}

export default DashboardKYC
