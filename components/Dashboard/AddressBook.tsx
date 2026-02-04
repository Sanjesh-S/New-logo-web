'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Plus, Edit2, Trash2, Check } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getUserAddresses, saveAddress, updateAddress, deleteAddress, type SavedAddress } from '@/lib/firebase/database'

interface Address {
  id: string
  name: string
  phone: string
  address: string
  landmark?: string
  city: string
  state: string
  pincode: string
  isDefault?: boolean
}

export default function AddressBook() {
  const { user } = useAuth()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Omit<Address, 'id'>>({
    name: '',
    phone: '',
    address: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false,
  })

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user?.uid) {
        setLoading(false)
        return
      }
      
      try {
        setLoading(true)
        const savedAddresses = await getUserAddresses(user.uid)
        setAddresses(savedAddresses.map(addr => ({
          id: addr.id || '',
          name: addr.name,
          phone: addr.phone,
          address: addr.address,
          landmark: addr.landmark,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode,
          isDefault: addr.isDefault || false,
        })))
      } catch (error) {
        // Error fetching addresses
      } finally {
        setLoading(false)
      }
    }
    
    fetchAddresses()
  }, [user?.uid])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.uid) return
    
    try {
      if (editingId) {
        // Update existing address
        await updateAddress(editingId, {
          userId: user.uid,
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          landmark: formData.landmark,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          isDefault: formData.isDefault,
        })
        // Refresh addresses
        const savedAddresses = await getUserAddresses(user.uid)
        setAddresses(savedAddresses.map(addr => ({
          id: addr.id || '',
          name: addr.name,
          phone: addr.phone,
          address: addr.address,
          landmark: addr.landmark,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode,
          isDefault: addr.isDefault || false,
        })))
        setEditingId(null)
      } else {
        // Create new address
        await saveAddress({
          userId: user.uid,
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          landmark: formData.landmark,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          isDefault: formData.isDefault || false,
        })
        // Refresh addresses
        const savedAddresses = await getUserAddresses(user.uid)
        setAddresses(savedAddresses.map(addr => ({
          id: addr.id || '',
          name: addr.name,
          phone: addr.phone,
          address: addr.address,
          landmark: addr.landmark,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode,
          isDefault: addr.isDefault || false,
        })))
      }
      
      setFormData({
        name: '',
        phone: '',
        address: '',
        landmark: '',
        city: '',
        state: '',
        pincode: '',
        isDefault: false,
      })
      setShowAddForm(false)
    } catch (error) {
      // Error saving address
      alert('Failed to save address. Please try again.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return
    
    try {
      await deleteAddress(id)
      // Refresh addresses
      if (user?.uid) {
        const savedAddresses = await getUserAddresses(user.uid)
        setAddresses(savedAddresses.map(addr => ({
          id: addr.id || '',
          name: addr.name,
          phone: addr.phone,
          address: addr.address,
          landmark: addr.landmark,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode,
          isDefault: addr.isDefault || false,
        })))
      }
    } catch (error) {
      // Error deleting address
      alert('Failed to delete address. Please try again.')
    }
  }

  const handleEdit = (address: Address) => {
    setFormData({
      name: address.name,
      phone: address.phone,
      address: address.address,
      landmark: address.landmark || '',
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      isDefault: address.isDefault || false,
    })
    setEditingId(address.id)
    setShowAddForm(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-lime border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading addresses...</p>
        </div>
      </div>
    )
  }

  if (addresses.length === 0 && !showAddForm) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No saved addresses</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Save your addresses to make checkout faster and easier. You can add multiple addresses for different locations.
        </p>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-lime text-brand-blue-900 rounded-lg font-semibold hover:bg-brand-lime-400 transition-colors shadow-md hover:shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Add Your First Address
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Saved Addresses</h2>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add New
          </button>
        )}
      </div>

      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Address' : 'Add New Address'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Landmark (Optional)</label>
                <input
                  type="text"
                  value={formData.landmark}
                  onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <input
                  type="text"
                  required
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="w-4 h-4 text-brand-blue-600 border-gray-300 rounded focus:ring-brand-blue-500"
                  />
                  <span className="text-sm text-gray-700">Set as default address</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 px-6 py-2 bg-brand-lime text-brand-blue-900 rounded-lg font-semibold hover:bg-brand-lime-400 transition-colors"
              >
                {editingId ? 'Update Address' : 'Save Address'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setEditingId(null)
                  setFormData({
                    name: '',
                    phone: '',
                    address: '',
                    landmark: '',
                    city: '',
                    state: '',
                    pincode: '',
                    isDefault: false,
                  })
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((address) => (
          <motion.div
            key={address.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-md transition-all relative"
          >
            {address.isDefault && (
              <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 bg-brand-blue-50 text-brand-blue-700 rounded-full text-xs font-semibold">
                <Check className="w-3 h-3" />
                Default
              </div>
            )}
            <div className="pr-16">
              <div className="flex items-start gap-3 mb-3">
                <MapPin className="w-5 h-5 text-brand-blue-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">{address.name}</h3>
                  <p className="text-sm text-gray-600">{address.phone}</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-1">{address.address}</p>
              {address.landmark && (
                <p className="text-sm text-gray-600 mb-1">Near {address.landmark}</p>
              )}
              <p className="text-sm text-gray-600">
                {address.city}, {address.state} - {address.pincode}
              </p>
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => handleEdit(address)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-brand-blue-600 hover:bg-brand-blue-50 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(address.id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
