'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useModalHistory } from '@/hooks/useModalHistory'

interface LaptopTabletFormProps {
  isOpen: boolean
  onClose: () => void
  category: 'laptops' | 'tablets'
}

interface FormData {
  model: string
  age: string
  warranty: string
  name: string
  contact: string
  location: string
}

export default function LaptopTabletForm({ isOpen, onClose, category }: LaptopTabletFormProps) {
  const [formData, setFormData] = useState<FormData>({
    model: '',
    age: '',
    warranty: '',
    name: '',
    contact: '',
    location: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [submitting, setSubmitting] = useState(false)

  // Handle browser back button to close modal
  useModalHistory(isOpen, onClose, `laptop-tablet-form-${category}`)

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}

    if (!formData.model.trim()) {
      newErrors.model = 'Model is required'
    }
    if (!formData.age.trim()) {
      newErrors.age = 'Age of device is required'
    }
    if (!formData.warranty.trim()) {
      newErrors.warranty = 'Warranty information is required'
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    if (!formData.contact.trim()) {
      newErrors.contact = 'Contact number is required'
    } else if (!/^\d{10}$/.test(formData.contact.replace(/\D/g, ''))) {
      newErrors.contact = 'Please enter a valid 10-digit contact number'
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      setSubmitting(true)
      try {
        // Submit to API
        const response = await fetch('/api/laptop-tablet-inquiry', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            category,
            model: formData.model,
            age: formData.age,
            warranty: formData.warranty,
            name: formData.name,
            contact: formData.contact,
            location: formData.location,
          }),
        })

        const data = await response.json()

        if (response.ok && data.success) {
          // Redirect to confirmation page
          window.location.href = `/laptop-tablet-confirmation?id=${data.id}`
        } else {
          throw new Error(data.error || 'Failed to submit inquiry')
        }
      } catch (error) {
        console.error('Error submitting inquiry:', error)
        alert('An error occurred. Please try again.')
        setSubmitting(false)
      }
    }
  }

  const handleClose = () => {
    setFormData({
      model: '',
      age: '',
      warranty: '',
      name: '',
      contact: '',
      location: '',
    })
    setErrors({})
    setSubmitting(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-2xl font-bold text-brand-blue-900">
                  {category === 'laptops' ? 'Laptop' : 'Tablet'} Details
                </h2>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Model */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {category === 'laptops' ? 'Laptop' : 'Tablet'} Model *
                    </label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => handleChange('model', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 outline-none transition-all ${
                        errors.model ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={`Enter ${category === 'laptops' ? 'laptop' : 'tablet'} model`}
                      disabled={submitting}
                    />
                    {errors.model && (
                      <p className="mt-1 text-sm text-red-600">{errors.model}</p>
                    )}
                  </div>

                  {/* Age */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age of the Device *
                    </label>
                    <input
                      type="text"
                      value={formData.age}
                      onChange={(e) => handleChange('age', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 outline-none transition-all ${
                        errors.age ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., 2 years, 6 months"
                      disabled={submitting}
                    />
                    {errors.age && (
                      <p className="mt-1 text-sm text-red-600">{errors.age}</p>
                    )}
                  </div>

                  {/* Warranty */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Warranty *
                    </label>
                    <select
                      value={formData.warranty}
                      onChange={(e) => handleChange('warranty', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 outline-none transition-all ${
                        errors.warranty ? 'border-red-500' : 'border-gray-300'
                      }`}
                      disabled={submitting}
                    >
                      <option value="">Select warranty status</option>
                      <option value="active">Active Warranty</option>
                      <option value="expired">Warranty Expired</option>
                      <option value="none">No Warranty</option>
                    </select>
                    {errors.warranty && (
                      <p className="mt-1 text-sm text-red-600">{errors.warranty}</p>
                    )}
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 outline-none transition-all ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your full name"
                      disabled={submitting}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  {/* Contact */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact *
                    </label>
                    <input
                      type="tel"
                      value={formData.contact}
                      onChange={(e) => handleChange('contact', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 outline-none transition-all ${
                        errors.contact ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      disabled={submitting}
                    />
                    {errors.contact && (
                      <p className="mt-1 text-sm text-red-600">{errors.contact}</p>
                    )}
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleChange('location', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 outline-none transition-all ${
                        errors.location ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your location"
                      disabled={submitting}
                    />
                    {errors.location && (
                      <p className="mt-1 text-sm text-red-600">{errors.location}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={submitting}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-6 py-3 bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Submitting...' : 'Submit'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
