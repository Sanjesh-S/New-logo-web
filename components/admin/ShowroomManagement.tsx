'use client'

import { useState, useEffect } from 'react'
import { type Showroom, type StaffUser } from '@/lib/firebase/database'

export default function ShowroomManagement() {
  const [showrooms, setShowrooms] = useState<Showroom[]>([])
  const [staff, setStaff] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<Showroom | null>(null)

  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [pincode, setPincode] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [showroomRes, staffRes] = await Promise.all([
        fetch('/api/admin/showrooms'),
        fetch('/api/admin/staff'),
      ])
      const showroomJson = await showroomRes.json()
      const staffJson = await staffRes.json()
      setShowrooms(showroomJson.showrooms || [])
      setStaff(staffJson.staff || [])
    } catch (err) {
      console.error('Error loading showrooms:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const resetForm = () => {
    setName(''); setAddress(''); setCity(''); setState(''); setPincode(''); setPhone('')
    setError('')
  }

  const handleAdd = () => {
    setEditing(null)
    resetForm()
    setIsFormOpen(true)
  }

  const handleEdit = (showroom: Showroom) => {
    setEditing(showroom)
    setName(showroom.name)
    setAddress(showroom.address)
    setCity(showroom.city)
    setState(showroom.state)
    setPincode(showroom.pincode)
    setPhone(showroom.phone)
    setError('')
    setIsFormOpen(true)
  }

  const handleToggleActive = async (showroom: Showroom) => {
    try {
      await fetch(`/api/admin/showrooms?id=${showroom.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !showroom.isActive }),
      })
      await loadData()
    } catch (err) {
      console.error('Error toggling showroom:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim() || !address.trim() || !city.trim() || !state.trim() || !pincode.trim() || !phone.trim()) {
      setError('All fields are required')
      return
    }

    setSaving(true)
    try {
      const data = { name: name.trim(), address: address.trim(), city: city.trim(), state: state.trim(), pincode: pincode.trim(), phone: phone.trim(), isActive: editing?.isActive ?? true }
      if (editing?.id) {
        const res = await fetch(`/api/admin/showrooms?id=${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!res.ok) {
          const errData = await res.json()
          throw new Error(errData.error || 'Failed to update showroom')
        }
      } else {
        const res = await fetch('/api/admin/showrooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!res.ok) {
          const errData = await res.json()
          throw new Error(errData.error || 'Failed to create showroom')
        }
      }
      setIsFormOpen(false)
      resetForm()
      await loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to save showroom')
    } finally {
      setSaving(false)
    }
  }

  const getStaffCount = (showroomId: string) => {
    return staff.filter(s => s.showroomId === showroomId && s.isActive).length
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-blue-200 border-t-brand-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex justify-between items-center">
        <p className="text-gray-600 text-sm">{showrooms.length} showroom{showrooms.length !== 1 ? 's' : ''} configured</p>
        <button onClick={handleAdd} className="inline-flex items-center gap-2 bg-brand-blue-900 text-white px-5 py-2.5 rounded-lg hover:bg-brand-blue-800 font-medium transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Showroom
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {showrooms.length === 0 ? (
          <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
            No showrooms configured yet. Click &ldquo;Add Showroom&rdquo; to create one.
          </div>
        ) : showrooms.map(showroom => (
          <div key={showroom.id} className={`bg-white rounded-xl shadow-sm border p-5 ${showroom.isActive ? 'border-gray-100' : 'border-gray-200 opacity-60'}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{showroom.name}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{showroom.city}, {showroom.state} — {showroom.pincode}</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${showroom.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${showroom.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                {showroom.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">{showroom.address}</p>
            <p className="text-sm text-gray-600 mb-3">Phone: {showroom.phone}</p>
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <span className="text-xs text-gray-500">{getStaffCount(showroom.id!)} staff assigned</span>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(showroom)} className="text-sm text-brand-blue-600 hover:text-brand-blue-800 font-medium">Edit</button>
                <button onClick={() => handleToggleActive(showroom)} className={`text-sm font-medium ${showroom.isActive ? 'text-red-600 hover:text-red-800' : 'text-emerald-600 hover:text-emerald-800'}`}>
                  {showroom.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{editing ? 'Edit Showroom' : 'Add Showroom'}</h2>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Showroom Name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 outline-none" placeholder="e.g. Anna Nagar Showroom" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 outline-none resize-none" placeholder="Full address" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <input type="text" value={state} onChange={e => setState(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                  <input type="text" value={pincode} onChange={e => setPincode(e.target.value)} maxLength={6} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-brand-blue-900 text-white rounded-lg hover:bg-brand-blue-800 font-medium transition-colors disabled:opacity-50">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Add Showroom'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
