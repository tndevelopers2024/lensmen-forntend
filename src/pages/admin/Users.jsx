import { useEffect, useState } from 'react'
import {
  Table, Input, Tag, Button, Modal, Drawer, Select, Space, Typography, Avatar, Image, Divider,
} from 'antd'
import {
  SearchOutlined, EyeOutlined, UserOutlined, CheckCircleOutlined,
  CloseCircleOutlined, PlusOutlined, MailOutlined, PhoneOutlined,
  EnvironmentOutlined, CalendarOutlined, IdcardOutlined, DeleteOutlined,
} from '@ant-design/icons'
import { HiCheckCircle, HiUpload } from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useGlobal } from '../../context/GlobalContext'
import PageHeader from '../../components/PageHeader'

const { Text } = Typography
const { TextArea } = Input

const KYC_DOCS = [
  { key: 'aadhaarFront', label: 'Aadhaar Front' },
  { key: 'aadhaarBack',  label: 'Aadhaar Back'  },
  { key: 'panFront',     label: 'PAN Front'      },
  { key: 'panBack',      label: 'PAN Back'       },
]

const KYC_TAG = {
  Approved:       { color: 'success', icon: <CheckCircleOutlined /> },
  Pending:        { color: 'warning', icon: null },
  Rejected:       { color: 'error',   icon: <CloseCircleOutlined /> },
  'Not Uploaded': { color: 'default', icon: null },
}

const CLASS_COLORS = {
  New: 'default', Regular: 'blue', Frequent: 'cyan',
  VIP: 'gold', Celebrity: 'purple', Corporate: 'geekblue',
}

const CLASSES = ['New', 'Regular', 'Frequent', 'VIP', 'Celebrity', 'Corporate']

const EMPTY_FORM = { fullName: '', email: '', mobile: '', address: '', password: '', accountType: 'Private' }
const EMPTY_KYC  = { aadhaarFront: null, aadhaarBack: null, panFront: null, panBack: null }

const divStyle = {
  fontSize: 11, color: '#9ca3af', fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 0,
}

const UsersPage = () => {
  const { allUsers, fetchAdminData, API_URL } = useGlobal()
  const [searchTerm, setSearchTerm]       = useState('')
  const [selectedUser, setSelectedUser]   = useState(null)   // user detail modal
  const [kycReason, setKycReason]         = useState('')
  const [kycLoading, setKycLoading]       = useState(false)
  const [deleteTarget, setDeleteTarget]   = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [addOpen, setAddOpen]             = useState(false)
  const [addForm, setAddForm]             = useState(EMPTY_FORM)
  const [addKyc, setAddKyc]               = useState(EMPTY_KYC)
  const [addLoading, setAddLoading]       = useState(false)

  useEffect(() => { fetchAdminData('/admin/users') }, [])

  const filteredUsers = allUsers.filter(u =>
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.mobile?.includes(searchTerm)
  )

  // sync selectedUser when allUsers refreshes
  useEffect(() => {
    if (selectedUser) {
      const fresh = allUsers.find(u => u._id === selectedUser._id)
      if (fresh) setSelectedUser(fresh)
    }
  }, [allUsers])

  const handleClassChange = async (userId, newClass) => {
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/class`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerClass: newClass }),
      })
      if (res.ok) { toast.success(`Class updated to ${newClass}`); fetchAdminData('/admin/users') }
    } catch { toast.error('Error updating class') }
  }

  const handleKycReview = async (kycStatus, reason) => {
    setKycLoading(true)
    try {
      const res = await fetch(`${API_URL}/admin/users/${selectedUser._id}/kyc`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kycStatus, kycRejectionReason: reason }),
      })
      if (res.ok) {
        toast.success(`KYC ${kycStatus}`)
        setKycReason('')
        fetchAdminData('/admin/users')
      }
    } catch { toast.error('Error updating KYC') }
    finally { setKycLoading(false) }
  }

  const handleDeleteUser = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`${API_URL}/admin/users/${deleteTarget._id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        toast.success(`"${deleteTarget.fullName}" removed`)
        setDeleteTarget(null)
        if (selectedUser?._id === deleteTarget._id) setSelectedUser(null)
        fetchAdminData('/admin/users')
      } else {
        toast.error(data.message || 'Delete failed')
      }
    } catch { toast.error('Server error') }
    finally { setDeleteLoading(false) }
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    if (!addForm.fullName || !addForm.email || !addForm.password) {
      toast.error('Name, email and password are required'); return
    }
    setAddLoading(true)
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.message || 'Registration failed'); return }

      const kycProvided = KYC_DOCS.filter(d => addKyc[d.key])
      if (kycProvided.length > 0) {
        if (kycProvided.length < 4) { toast.error('Upload all 4 KYC documents or none'); setAddLoading(false); return }
        const form = new FormData()
        form.append('email', addForm.email)
        KYC_DOCS.forEach(d => form.append(d.key, addKyc[d.key]))
        const kycRes = await fetch(`${API_URL}/user/kyc`, { method: 'POST', body: form })
        if (!kycRes.ok) { const err = await kycRes.json(); toast.error(`KYC upload failed: ${err.message || ''}`) }
      }

      toast.success(`User "${addForm.fullName}" created`)
      setAddOpen(false); setAddForm(EMPTY_FORM); setAddKyc(EMPTY_KYC)
      fetchAdminData('/admin/users')
    } catch { toast.error('Server error') }
    finally { setAddLoading(false) }
  }

  const fieldCls = "w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-[13px] text-slate-800 placeholder-slate-400 outline-none focus:border-[#1e1b4b] focus:bg-white transition-all"

  const columns = [
    {
      title: 'User', key: 'user',
      render: (_, u) => (
        <div className="flex items-center gap-3">
          <Avatar style={{ backgroundColor: '#1e1b4b', fontWeight: 700 }} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 600, color: '#1e1b4b' }}>{u.fullName}</div>
            <Tag color={u.role === 'admin' ? 'geekblue' : 'default'} style={{ fontSize: 10, marginTop: 2 }}>{u.role}</Tag>
          </div>
        </div>
      ),
    },
    {
      title: 'Contact', key: 'contact',
      render: (_, u) => (
        <div>
          <div style={{ fontSize: 13 }}>{u.email}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{u.mobile || '—'}</div>
        </div>
      ),
    },
    {
      title: 'Type & Class', key: 'typeClass',
      render: (_, u) => (
        <Space direction="vertical" size={4}>
          <Tag>{u.accountType || 'Private'}</Tag>
          <div onClick={e => e.stopPropagation()}>
            <Select
              value={u.customerClass || 'New'} size="small" style={{ width: 110 }}
              onChange={val => handleClassChange(u._id, val)}
              options={CLASSES.map(c => ({ value: c, label: c }))}
            />
          </div>
        </Space>
      ),
    },
    {
      title: 'KYC', key: 'kyc', align: 'center',
      render: (_, u) => {
        const tp = KYC_TAG[u.kycStatus] || KYC_TAG['Not Uploaded']
        return (
          <Space direction="vertical" size={6} align="center">
            <Tag color={tp.color} icon={tp.icon}>{u.kycStatus || 'Not Uploaded'}</Tag>
          </Space>
        )
      },
    },
    {
      title: 'Joined', dataIndex: 'createdAt', key: 'createdAt', align: 'right',
      render: d => <span style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(d).toLocaleDateString('en-GB')}</span>,
    },
    {
      title: '', key: 'actions', width: 48, align: 'center',
      render: (_, u) => u.role === 'admin' ? null : (
        <button
          onClick={e => { e.stopPropagation(); setDeleteTarget(u) }}
          className="w-8 h-8 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
          title="Delete user"
        >
          <DeleteOutlined style={{ fontSize: 14 }} />
        </button>
      ),
    },
  ]

  // ── USER DETAIL MODAL helpers ──────────────────────────────────────
  const kycStatus  = selectedUser?.kycStatus || 'Not Uploaded'
  const kycTagProp = KYC_TAG[kycStatus] || KYC_TAG['Not Uploaded']
  const hasDocs    = selectedUser?.kycDocuments && Object.values(selectedUser.kycDocuments).some(Boolean)

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader
          eyebrow="Community Management"
          title="Registered Users"
          subtitle={`${allUsers.length} total members`}
        />
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 bg-[#1e1b4b] hover:bg-[#E5550F] text-white px-5 py-2.5 rounded-xl font-semibold text-[13px] transition-all duration-200 shadow-sm mt-1 flex-shrink-0"
        >
          <PlusOutlined /> Add User
        </button>
      </div>

      <div className="mb-4">
        <Input
          prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
          placeholder="Search by name, email or mobile..."
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          allowClear size="large" style={{ maxWidth: 400 }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredUsers}
        rowKey="_id"
        onRow={record => ({
          onClick: () => { setSelectedUser(record); setKycReason('') },
          style: { cursor: 'pointer' },
        })}
        rowClassName={() => 'hover:bg-slate-50 transition-colors group'}
        pagination={{
          defaultPageSize: 10, showSizeChanger: true,
          showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total}`,
        }}
        style={{ background: '#fff', borderRadius: 16 }}
      />

      {/* ══ USER DETAIL DRAWER ═════════════════════════════════════════ */}
      <Drawer
        open={!!selectedUser}
        onClose={() => { setSelectedUser(null); setKycReason('') }}
        placement="right"
        width={540}
        destroyOnHidden
        styles={{ body: { padding: 0 }, header: { display: 'none' } }}
      >
        {selectedUser && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

            {/* ── Sticky Header ── */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Avatar
                  size={48}
                  style={{ background: 'linear-gradient(135deg,#1e1b4b,#3730a3)', fontWeight: 800, fontSize: 20, flexShrink: 0 }}
                  icon={<UserOutlined />}
                >
                  {selectedUser.fullName?.charAt(0)}
                </Avatar>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#1e1b4b' }}>{selectedUser.fullName}</span>
                    <Tag color={selectedUser.role === 'admin' ? 'geekblue' : 'default'} style={{ fontSize: 11 }}>{selectedUser.role}</Tag>
                    <Tag color={kycTagProp.color} icon={kycTagProp.icon} style={{ fontSize: 11 }}>{kycStatus}</Tag>
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                    {selectedUser.accountType || 'Private'} · {selectedUser.customerClass || 'New'} · Joined {new Date(selectedUser.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setSelectedUser(null); setKycReason('') }}
                style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: 16, flexShrink: 0 }}
              >
                ×
              </button>
            </div>

            {/* ── Scrollable Body ── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>

              {/* Profile Information */}
              <Divider orientation="left" style={divStyle}>Profile Information</Divider>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', marginBottom: 4 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <MailOutlined /> Email Address
                  </div>
                  <div style={{ fontSize: 13, color: '#1e293b', fontWeight: 500 }}>{selectedUser.email}</div>
                </div>

                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <PhoneOutlined /> Mobile Number
                  </div>
                  <div style={{ fontSize: 13, color: '#1e293b', fontWeight: 500 }}>{selectedUser.mobile || '—'}</div>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <EnvironmentOutlined /> Address
                  </div>
                  <div style={{ fontSize: 13, color: '#1e293b', fontWeight: 500, lineHeight: 1.6 }}>{selectedUser.address || '—'}</div>
                </div>

                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Account Type</div>
                  <Tag style={{ fontSize: 12 }}>{selectedUser.accountType || 'Private'}</Tag>
                </div>

                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Customer Class</div>
                  <Select
                    value={selectedUser.customerClass || 'New'}
                    style={{ width: 150 }}
                    onChange={val => handleClassChange(selectedUser._id, val)}
                    options={CLASSES.map(c => ({ value: c, label: c }))}
                  />
                </div>
              </div>

              {/* KYC Documents */}
              <Divider orientation="left" style={divStyle}>KYC Documents</Divider>

              {/* Status banner */}
              <div style={{
                background: kycStatus === 'Approved' ? '#f0fdf4' : kycStatus === 'Pending' ? '#fffbeb' : kycStatus === 'Rejected' ? '#fef2f2' : '#f9fafb',
                border: `1px solid ${kycStatus === 'Approved' ? '#bbf7d0' : kycStatus === 'Pending' ? '#fde68a' : kycStatus === 'Rejected' ? '#fecaca' : '#e5e7eb'}`,
                borderRadius: 10, padding: '10px 14px', marginBottom: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>
                  {kycStatus === 'Approved'     && '✓ KYC Verified & Approved'}
                  {kycStatus === 'Pending'       && '⏳ Pending Admin Review'}
                  {kycStatus === 'Rejected'      && '✗ Documents Rejected'}
                  {kycStatus === 'Not Uploaded'  && 'No documents submitted yet'}
                </div>
                <Tag color={kycTagProp.color} icon={kycTagProp.icon}>{kycStatus}</Tag>
              </div>
              {kycStatus === 'Rejected' && selectedUser.kycRejectionReason && (
                <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 12, paddingLeft: 4 }}>
                  Rejection reason: {selectedUser.kycRejectionReason}
                </div>
              )}

              {/* Document images 2×2 */}
              {hasDocs ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                  {KYC_DOCS.map(doc => {
                    const url = selectedUser.kycDocuments?.[doc.key]
                    return (
                      <div key={doc.key} style={{ background: '#f9fafb', borderRadius: 10, padding: 12, border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                          {doc.label}
                        </div>
                        {url ? (
                          <Image src={url} alt={doc.label} height={110} width="100%"
                            style={{ objectFit: 'contain', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff' }} />
                        ) : (
                          <div style={{ height: 110, border: '2px dashed #e5e7eb', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Text type="secondary" style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>Not submitted</Text>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '28px 0', background: '#f9fafb', borderRadius: 10, border: '2px dashed #e5e7eb', marginBottom: 20 }}>
                  <IdcardOutlined style={{ fontSize: 28, color: '#d1d5db', display: 'block', marginBottom: 8 }} />
                  <Text type="secondary" style={{ fontSize: 13 }}>No KYC documents have been submitted.</Text>
                </div>
              )}

              {/* Approve / Reject */}
              {kycStatus === 'Pending' && (
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                    Rejection Reason{' '}
                    <span style={{ fontWeight: 400, color: '#94a3b8', textTransform: 'none', letterSpacing: 0 }}>(required only if rejecting)</span>
                  </div>
                  <TextArea
                    rows={3} value={kycReason} onChange={e => setKycReason(e.target.value)}
                    placeholder="Explain why the documents are being rejected..."
                    style={{ marginBottom: 12 }}
                  />
                  <Space>
                    <Button danger loading={kycLoading} disabled={!kycReason.trim()}
                      onClick={() => handleKycReview('Rejected', kycReason)}>
                      Reject
                    </Button>
                    <Button type="primary" loading={kycLoading}
                      style={{ background: '#10b981', borderColor: '#10b981' }}
                      onClick={() => handleKycReview('Approved', '')}>
                      Approve KYC
                    </Button>
                  </Space>
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* ══ DELETE CONFIRMATION ════════════════════════════════════════ */}
      <Modal
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        width={420}
        footer={null}
        destroyOnHidden
        title={null}
        centered
      >
        {deleteTarget && (
          <div className="p-2 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <DeleteOutlined style={{ fontSize: 24, color: '#ef4444' }} />
            </div>
            <h3 className="text-[17px] font-bold text-slate-900 mb-1">Delete User</h3>
            <p className="text-[13px] text-slate-500 mb-1">
              Are you sure you want to remove <span className="font-semibold text-slate-800">{deleteTarget.fullName}</span>?
            </p>
            <p className="text-[12px] text-slate-400 mb-6">
              {deleteTarget.email} · This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-6 py-2.5 rounded-xl text-[13px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleteLoading}
                className="px-6 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-all"
              >
                {deleteLoading ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ══ ADD USER MODAL ══════════════════════════════════════════════ */}
      <Modal
        open={addOpen}
        onCancel={() => { setAddOpen(false); setAddForm(EMPTY_FORM); setAddKyc(EMPTY_KYC) }}
        width={680} footer={null} destroyOnHidden
        title={
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#E5550F', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 4 }}>
              Community Management
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1e1b4b' }}>Register New User</div>
          </div>
        }
      >
        <form onSubmit={handleAddUser} className="pt-2 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-widest">Full Name *</label>
              <input required placeholder="Full name" value={addForm.fullName}
                onChange={e => setAddForm({ ...addForm, fullName: e.target.value })} className={fieldCls} />
            </div>
            <div className="space-y-1">
              <label className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-widest">Email Address *</label>
              <input type="email" required placeholder="user@example.com" value={addForm.email}
                onChange={e => setAddForm({ ...addForm, email: e.target.value })} className={fieldCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-widest">Mobile Number</label>
              <input type="tel" placeholder="+91 00000 00000" value={addForm.mobile}
                onChange={e => setAddForm({ ...addForm, mobile: e.target.value })} className={fieldCls} />
            </div>
            <div className="space-y-1">
              <label className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-widest">Password *</label>
              <input type="password" required placeholder="Set a password" value={addForm.password}
                onChange={e => setAddForm({ ...addForm, password: e.target.value })} className={fieldCls} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-widest">Address / City</label>
            <textarea rows="2" placeholder="Full address, city, state" value={addForm.address}
              onChange={e => setAddForm({ ...addForm, address: e.target.value })}
              className={fieldCls + " resize-none"} />
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Account Type</p>
            <div className="flex gap-6">
              {['Private', 'Company'].map(type => (
                <label key={type} className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="radio" value={type} checked={addForm.accountType === type}
                    onChange={e => setAddForm({ ...addForm, accountType: e.target.value })}
                    className="accent-[#E5550F] w-4 h-4" />
                  <span className="text-[12px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                    {type === 'Private' ? 'Individual' : 'Company'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                KYC Documents <span className="text-slate-300 font-normal normal-case tracking-normal">— optional (all 4 or none)</span>
              </span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            <div className="grid grid-cols-4 gap-3">
              {KYC_DOCS.map(doc => {
                const file = addKyc[doc.key]
                return (
                  <div key={doc.key}>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1.5">{doc.label}</label>
                    <label className="block cursor-pointer group">
                      <div className={`rounded-xl border-2 border-dashed py-4 px-2 text-center transition-all ${
                        file ? 'border-orange-400 bg-orange-50/60' : 'border-slate-200 bg-slate-50 group-hover:border-slate-300'
                      }`}>
                        {file ? (
                          <div className="flex flex-col items-center gap-1">
                            <HiCheckCircle className="text-xl text-orange-500" />
                            <p className="text-[9px] font-semibold text-orange-600 truncate w-full text-center px-1">
                              {file.name.length > 12 ? file.name.slice(0, 10) + '…' : file.name}
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <HiUpload className="text-lg text-slate-300 group-hover:text-slate-400 transition-colors" />
                            <p className="text-[9px] font-medium text-slate-400">Upload</p>
                          </div>
                        )}
                      </div>
                      <input type="file" accept="image/*" className="hidden"
                        onChange={e => { if (e.target.files[0]) setAddKyc(prev => ({ ...prev, [doc.key]: e.target.files[0] })) }} />
                    </label>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button"
              onClick={() => { setAddOpen(false); setAddForm(EMPTY_FORM); setAddKyc(EMPTY_KYC) }}
              className="px-5 py-2.5 rounded-xl text-[13px] font-medium text-slate-500 hover:bg-slate-100 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={addLoading}
              className="px-6 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-[#1e1b4b] hover:bg-[#E5550F] disabled:opacity-50 transition-all duration-200">
              {addLoading ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default UsersPage
