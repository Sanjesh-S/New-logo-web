'use client'

import { useState, useEffect } from 'react'
import { type StaffUser, type Showroom, type StaffRole } from '@/lib/firebase/database'
import StaffFormModal from './StaffFormModal'

const ROLE_LABELS: Record<StaffRole, string> = {
  superadmin: 'Super Admin',
  manager: 'Manager',
  pickup_agent: 'Pickup Agent',
  showroom_staff: 'Showroom Staff',
  qc_team: 'QC Team',
}

const ROLE_COLORS: Record<StaffRole, string> = {
  superadmin: 'bg-purple-100 text-purple-700 border-purple-200',
  manager: 'bg-blue-100 text-blue-700 border-blue-200',
  pickup_agent: 'bg-teal-100 text-teal-700 border-teal-200',
  showroom_staff: 'bg-amber-100 text-amber-700 border-amber-200',
  qc_team: 'bg-indigo-100 text-indigo-700 border-indigo-200',
}

export default function StaffManagement() {
  const [staff, setStaff] = useState<StaffUser[]>([])
  const [showrooms, setShowrooms] = useState<Showroom[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null)
  const [roleFilter, setRoleFilter] = useState<string>('All')
  const [searchTerm, setSearchTerm] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [staffRes, showroomRes] = await Promise.all([
        fetch('/api/admin/staff'),
        fetch('/api/admin/showrooms'),
      ])
      const staffJson = await staffRes.json()
      const showroomJson = await showroomRes.json()
      setStaff(staffJson.staff || [])
      setShowrooms(showroomJson.showrooms || [])
    } catch (error) {
      console.error('Error loading staff data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleAdd = () => {
    setEditingStaff(null)
    setIsFormOpen(true)
  }

  const handleEdit = (member: StaffUser) => {
    setEditingStaff(member)
    setIsFormOpen(true)
  }

  const handleToggleActive = async (member: StaffUser) => {
    try {
      if (member.isActive) {
        await fetch(`/api/admin/staff/${member.id}`, { method: 'DELETE' })
      } else {
        await fetch(`/api/admin/staff/${member.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: true }),
        })
      }
      await loadData()
    } catch (error) {
      console.error('Error toggling staff status:', error)
      alert('Failed to update staff status')
    }
  }

  const handleSubmit = async (data: Omit<StaffUser, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingStaff?.id) {
      await fetch(`/api/admin/staff/${editingStaff.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    } else {
      await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    }
    await loadData()
  }

  const filtered = staff.filter(m => {
    const matchesRole = roleFilter === 'All' || m.role === roleFilter
    const q = searchTerm.toLowerCase().trim()
    if (!q) return matchesRole
    const matchesSearch =
      (m.name || '').toLowerCase().includes(q) ||
      (m.phoneNumber || '').includes(q) ||
      (m.email || '').toLowerCase().includes(q)
    return matchesRole && matchesSearch
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-blue-200 border-t-brand-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
            <div className="relative flex-1">
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" placeholder="Search by name or phone..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 outline-none" />
            </div>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 outline-none bg-white">
              <option value="All">All Roles</option>
              {(Object.keys(ROLE_LABELS) as StaffRole[]).map(r => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
          <button onClick={handleAdd} className="inline-flex items-center gap-2 bg-brand-blue-900 text-white px-5 py-2.5 rounded-lg hover:bg-brand-blue-800 font-medium transition-colors shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Staff
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Showroom</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No staff members found</td></tr>
              ) : filtered.map(member => (
                <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{member.name}</div>
                    {member.email && <div className="text-sm text-gray-500">{member.email}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{member.phoneNumber}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${ROLE_COLORS[member.role] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                      {ROLE_LABELS[member.role] || member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {member.showroomName || (member.role === 'showroom_staff' ? <span className="text-gray-400 italic">Unassigned</span> : '—')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${member.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${member.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                      {member.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(member)} className="text-brand-blue-600 hover:text-brand-blue-800 text-sm font-medium">Edit</button>
                      {member.role !== 'superadmin' && (
                        <button onClick={() => handleToggleActive(member)} className={`text-sm font-medium ${member.isActive ? 'text-red-600 hover:text-red-800' : 'text-emerald-600 hover:text-emerald-800'}`}>
                          {member.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <StaffFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingStaff(null) }}
        onSubmit={handleSubmit}
        editingStaff={editingStaff}
        showrooms={showrooms}
      />
    </div>
  )
}
