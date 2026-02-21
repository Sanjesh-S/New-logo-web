'use client'

import { useState, useEffect } from 'react'
import type { StaffUser, StaffRole, Showroom } from '@/lib/firebase/database'

interface StaffFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Omit<StaffUser, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  editingStaff?: StaffUser | null
  showrooms: Showroom[]
}

const ROLES: { value: StaffRole; label: string }[] = [
  { value: 'manager', label: 'Manager' },
  { value: 'pickup_agent', label: 'Pickup Agent' },
  { value: 'showroom_staff', label: 'Showroom Staff' },
  { value: 'qc_team', label: 'QC Team' },
]

export default function StaffFormModal({ isOpen, onClose, onSubmit, editingStaff, showrooms }: StaffFormModalProps) {
  const [name, setName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<StaffRole>('pickup_agent')
  const [showroomId, setShowroomId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (editingStaff) {
      setName(editingStaff.name || '')
      setPhoneNumber(editingStaff.phoneNumber || '')
      setEmail(editingStaff.email || '')
      setRole(editingStaff.role || 'pickup_agent')
      setShowroomId(editingStaff.showroomId || '')
    } else {
      setName('')
      setPhoneNumber('')
      setEmail('')
      setRole('pickup_agent')
      setShowroomId('')
    }
    setError('')
  }, [editingStaff, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) { setError('Name is required'); return }
    if (!phoneNumber.trim() || phoneNumber.replace(/\D/g, '').length < 10) {
      setError('Valid phone number is required (10+ digits)')
      return
    }

    const selectedShowroom = showrooms.find(s => s.id === showroomId)

    setSaving(true)
    try {
      await onSubmit({
        name: name.trim(),
        phoneNumber: phoneNumber.trim().startsWith('+') ? phoneNumber.trim() : `+91${phoneNumber.replace(/\D/g, '').slice(-10)}`,
        email: email.trim().toLowerCase() || undefined,
        role,
        isActive: editingStaff?.isActive ?? true,
        showroomId: role === 'showroom_staff' ? showroomId : undefined,
        showroomName: role === 'showroom_staff' ? selectedShowroom?.name : undefined,
        createdBy: editingStaff?.createdBy,
      })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save staff member')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 outline-none" placeholder="Full name" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
            <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 outline-none" placeholder="10-digit mobile number" />
            <p className="text-xs text-gray-500 mt-1">Staff will use this number to log in via OTP</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 outline-none" placeholder="Optional" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
            <select value={role} onChange={e => setRole(e.target.value as StaffRole)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 outline-none bg-white">
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {role === 'showroom_staff' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Showroom *</label>
              <select value={showroomId} onChange={e => setShowroomId(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 outline-none bg-white">
                <option value="">Select a showroom</option>
                {showrooms.filter(s => s.isActive).map(s => (
                  <option key={s.id} value={s.id}>{s.name} — {s.city}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-brand-blue-900 text-white rounded-lg hover:bg-brand-blue-800 font-medium transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : editingStaff ? 'Update' : 'Add Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
