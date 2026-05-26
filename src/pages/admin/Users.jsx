import { useEffect, useState } from 'react'
import { useGlobal } from '../../context/GlobalContext'
import toast from 'react-hot-toast'
import { 
  HiOutlineUser, HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker, 
  HiSearch, HiCheckCircle, HiClock, HiExclamationCircle, HiEye, HiX 
} from 'react-icons/hi'

const UsersPage = () => {
  const { allUsers, fetchAdminData, API_URL } = useGlobal()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUserKyc, setSelectedUserKyc] = useState(null)
  const [kycRejectionReason, setKycRejectionReason] = useState('')

  useEffect(() => {
    fetchAdminData('/admin/users')
  }, [])

  const filteredUsers = allUsers.filter(u => 
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.mobile?.includes(searchTerm)
  )

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB') // DD/MM/YYYY
  }

  const handleClassChange = async (userId, newClass) => {
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/class`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerClass: newClass })
      })
      if (res.ok) {
        toast.success(`Classification updated to ${newClass}`)
        fetchAdminData('/admin/users')
      } else {
        const data = await res.json()
        toast.error(data.message || 'Failed to update classification')
      }
    } catch (err) {
      toast.error('Error updating classification')
    }
  }

  const handleKycReview = async (userId, kycStatus, rejectionReason) => {
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/kyc`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kycStatus, kycRejectionReason: rejectionReason })
      })
      if (res.ok) {
        toast.success(`KYC status updated to ${kycStatus}`)
        setSelectedUserKyc(null)
        setKycRejectionReason('')
        fetchAdminData('/admin/users')
      } else {
        const data = await res.json()
        toast.error(data.message || 'Failed to update KYC')
      }
    } catch (err) {
      toast.error('Error updating KYC status')
    }
  }

  const renderKycStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="flex items-center justify-center space-x-1.5 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-xl border border-emerald-100 font-black text-[9px] uppercase tracking-wider w-fit mx-auto">
            <HiCheckCircle /> <span>Approved</span>
          </span>
        )
      case 'Pending':
        return (
          <span className="flex items-center justify-center space-x-1.5 bg-amber-50 text-amber-600 px-2.5 py-1 rounded-xl border border-amber-100 font-black text-[9px] uppercase tracking-wider w-fit mx-auto animate-pulse">
            <HiClock /> <span>Pending Review</span>
          </span>
        )
      case 'Rejected':
        return (
          <span className="flex items-center justify-center space-x-1.5 bg-rose-50 text-rose-600 px-2.5 py-1 rounded-xl border border-rose-100 font-black text-[9px] uppercase tracking-wider w-fit mx-auto">
            <HiExclamationCircle /> <span>Rejected</span>
          </span>
        )
      default:
        return (
          <span className="flex items-center justify-center space-x-1.5 bg-slate-50 text-slate-400 px-2.5 py-1 rounded-xl border border-slate-100 font-black text-[9px] uppercase tracking-wider w-fit mx-auto">
            <span>Not Uploaded</span>
          </span>
        )
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-primary font-black uppercase tracking-[0.4em] text-[12px] mb-2">Community Management</p>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Registered Users</h1>
        </div>
        <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Members</p>
          <p className="text-2xl font-black text-brand-navy">{allUsers.length}</p>
        </div>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm">
        <div className="relative flex-1 max-w-md group">
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-xl" />
          <input 
            type="text" 
            placeholder="Search by name, email or mobile..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 font-bold text-sm focus:bg-white focus:border-primary focus:ring-4 focus:ring-orange-50 outline-none transition-all"
          />
        </div>
        <div className="flex items-center space-x-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
           <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
           <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Live Search Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-6 text-[12px] font-black text-slate-400 uppercase tracking-widest">User Profile</th>
                <th className="p-6 text-[12px] font-black text-slate-400 uppercase tracking-widest">Contact Info</th>
                <th className="p-6 text-[12px] font-black text-slate-400 uppercase tracking-widest">Account Type & Class</th>
                <th className="p-6 text-[12px] font-black text-slate-400 uppercase tracking-widest text-center">KYC Status & Action</th>
                <th className="p-6 text-[12px] font-black text-slate-400 uppercase tracking-widest text-right">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-brand-navy/5 flex items-center justify-center text-brand-navy group-hover:bg-primary/10 group-hover:text-primary transition-all">
                        <HiOutlineUser className="text-2xl" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 uppercase tracking-tight text-sm">{u.fullName}</p>
                        <div className="flex items-center space-x-2">
                           <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${u.role === 'admin' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                              {u.role}
                           </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-slate-500">
                        <HiOutlineMail className="text-slate-400" />
                        <span className="text-xs font-bold">{u.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-500">
                        <HiOutlinePhone className="text-slate-400" />
                        <span className="text-xs font-bold">{u.mobile}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-slate-700 uppercase tracking-tight bg-slate-100 px-2 py-0.5 rounded-md">{u.accountType}</span>
                      </div>
                      <div className="relative group min-w-[120px]">
                        <select 
                          value={u.customerClass || 'New'}
                          onChange={e => handleClassChange(u._id, e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-lg p-1.5 font-black uppercase text-[9px] tracking-wider focus:border-primary outline-none transition-all cursor-pointer"
                        >
                          {['New', 'Regular', 'Frequent', 'VIP', 'Celebrity', 'Corporate'].map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <div className="flex flex-col items-center space-y-2">
                      {renderKycStatusBadge(u.kycStatus)}
                      {u.kycStatus && u.kycStatus !== 'Not Uploaded' && (
                        <button 
                          onClick={() => setSelectedUserKyc(u)}
                          className="flex items-center space-x-1 px-3 py-1 bg-brand-navy hover:bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all shadow-sm"
                        >
                          <HiEye /> <span>Review Docs</span>
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-tighter">
                      {formatDate(u.createdAt)}
                    </p>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-20 text-center text-slate-400 uppercase font-black tracking-widest opacity-50">
                    No users matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* KYC Review Modal */}
      {selectedUserKyc && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-start justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white max-w-4xl w-full rounded-3xl relative shadow-2xl border-t-8 border-brand-navy my-8 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => {
                setSelectedUserKyc(null)
                setKycRejectionReason('')
              }}
              className="absolute right-6 top-6 text-slate-300 hover:text-red-500 transition-colors p-2 text-2xl font-light"
            >
              <HiX />
            </button>

            <div className="p-8">
              <div className="mb-6 border-b border-slate-50 pb-4">
                <p className="text-primary font-black uppercase tracking-[0.3em] text-[12px] mb-1">Admin KYC Review Panel</p>
                <h2 className="text-[18px] font-black text-brand-navy uppercase tracking-widest">Verify Documents: {selectedUserKyc.fullName}</h2>
                <p className="text-[11px] text-slate-400 font-bold uppercase mt-1">Status: {selectedUserKyc.kycStatus}</p>
              </div>

              {/* Document Previews */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {[
                  { name: 'Aadhaar Front', key: 'aadhaarFront' },
                  { name: 'Aadhaar Back', key: 'aadhaarBack' },
                  { name: 'PAN Front', key: 'panFront' },
                  { name: 'PAN Back', key: 'panBack' }
                ].map(doc => {
                  const url = selectedUserKyc.kycDocuments?.[doc.key]
                  return (
                    <div key={doc.key} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{doc.name}</p>
                      {url ? (
                        <div className="w-full h-48 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm flex items-center justify-center">
                          <img src={url} alt={doc.name} className="w-full h-full object-contain p-2" />
                        </div>
                      ) : (
                        <div className="w-full h-48 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 text-[11px] uppercase font-black">
                          Not Submitted
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Rejection Form Input */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8 space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Rejection Feedback (Required if rejecting KYC)</label>
                <textarea 
                  value={kycRejectionReason}
                  onChange={e => setKycRejectionReason(e.target.value)}
                  placeholder="EXPLAIN WHY THE DOCUMENTS ARE BEING REJECTED (E.G. IMAGE BLURRY, DOCUMENT NAME MISMATCH...)"
                  className="w-full bg-white border border-slate-100 rounded-xl p-4 text-[11px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all resize-none h-24"
                />
              </div>

              <div className="flex space-x-3">
                <button 
                  onClick={() => {
                    setSelectedUserKyc(null)
                    setKycRejectionReason('')
                  }}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleKycReview(selectedUserKyc._id, 'Rejected', kycRejectionReason)}
                  disabled={!kycRejectionReason.trim()}
                  className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-rose-600 disabled:opacity-50 transition-all shadow-lg shadow-rose-100"
                >
                  Reject KYC Documents
                </button>
                <button 
                  onClick={() => handleKycReview(selectedUserKyc._id, 'Approved', '')}
                  className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100"
                >
                  Approve KYC Verified
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersPage
