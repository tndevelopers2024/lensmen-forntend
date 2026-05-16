import { useEffect, useState } from 'react'
import { useGlobal } from '../../context/GlobalContext'
import { HiOutlineUser, HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker, HiShieldCheck, HiOutlineClock, HiSearch } from 'react-icons/hi'

const UsersPage = () => {
  const { allUsers, fetchAdminData } = useGlobal()
  const [searchTerm, setSearchTerm] = useState('')

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
                <th className="p-6 text-[12px] font-black text-slate-400 uppercase tracking-widest">Account Type & Address</th>
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
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-slate-700 uppercase tracking-tight bg-slate-100 px-2 py-0.5 rounded-md">{u.accountType}</span>
                      </div>
                      {u.address && (
                        <div className="flex items-start space-x-2 text-slate-400">
                          <HiOutlineLocationMarker className="text-sm shrink-0 mt-0.5" />
                          <span className="text-[11px] font-bold uppercase whitespace-pre-wrap">{u.address}</span>
                        </div>
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
    </div>
  )
}

export default UsersPage
