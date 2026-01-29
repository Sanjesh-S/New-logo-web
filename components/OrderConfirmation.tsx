'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, User, Phone, CheckCircle, X, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

interface OrderConfirmationProps {
  isOpen: boolean
  price: number
  productName: string
  phoneNumber: string
  valuationId?: string
  onConfirm: (addressData: AddressData) => void
  onClose: () => void
}

export interface AddressData {
  name: string
  phone: string
  email: string
  pincode: string
  city: string
  state: string
  address: string
  landmark?: string
  pickupDate?: string
  pickupTime?: string
}

export default function OrderConfirmation({
  isOpen,
  price,
  productName,
  phoneNumber,
  valuationId,
  onConfirm,
  onClose,
}: OrderConfirmationProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState<AddressData>({
    name: '',
    phone: phoneNumber || '',
    email: '',
    pincode: '',
    city: '',
    state: '',
    address: '',
    landmark: '',
    pickupDate: '',
    pickupTime: '',
  })
  const [showSchedulePickup, setShowSchedulePickup] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pincodeLoading, setPincodeLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof AddressData, string>>>({})
  const [showSuccess, setShowSuccess] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  
  // Refs for form fields to scroll to on validation error
  const nameRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const pincodeRef = useRef<HTMLInputElement>(null)
  const cityRef = useRef<HTMLInputElement>(null)
  const stateRef = useRef<HTMLInputElement>(null)
  const addressRef = useRef<HTMLTextAreaElement>(null)

  // Fetch address details from pincode API
  const fetchAddressFromPincode = async (pincode: string) => {
    if (pincode.length !== 6) return

    setPincodeLoading(true)
    try {
      // Using India Post API or similar pincode lookup service
      // You can use: https://api.postalpincode.in/pincode/{pincode}
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`)
      const data = await response.json()

      if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice) {
        const postOffice = data[0].PostOffice[0]
        setFormData(prev => ({
          ...prev,
          city: postOffice.District || postOffice.Name || '',
          state: postOffice.State || '',
        }))
        setErrors(prev => ({ ...prev, pincode: '' }))
      } else {
        setErrors(prev => ({ ...prev, pincode: 'Invalid pincode' }))
      }
    } catch (error) {
      console.error('Error fetching pincode data:', error)
      setErrors(prev => ({ ...prev, pincode: 'Failed to fetch address details' }))
    } finally {
      setPincodeLoading(false)
    }
  }

  useEffect(() => {
    if (formData.pincode.length === 6 && /^\d{6}$/.test(formData.pincode)) {
      fetchAddressFromPincode(formData.pincode)
    }
  }, [formData.pincode])

  // Auto-scroll to first error field when validation fails
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const errorFields = [
        { field: 'name', ref: nameRef },
        { field: 'phone', ref: phoneRef },
        { field: 'email', ref: emailRef },
        { field: 'pincode', ref: pincodeRef },
        { field: 'city', ref: cityRef },
        { field: 'state', ref: stateRef },
        { field: 'address', ref: addressRef },
      ]
      
      for (const { field, ref } of errorFields) {
        if (errors[field as keyof AddressData] && ref.current) {
          setTimeout(() => {
            ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            ref.current?.focus()
          }, 100)
          break
        }
      }
    }
  }, [errors])

  const handleChange = (field: keyof AddressData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AddressData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number'
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required'
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Please enter a valid 6-digit pincode'
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Generate time slots based on selected date and current time
  useEffect(() => {
    if (!selectedDate) {
      setAvailableTimeSlots([])
      return
    }

    const slots = [
      '02:00 AM - 04:00 AM',
      '04:00 AM - 06:00 AM',
      '06:00 AM - 08:00 AM',
      '08:00 AM - 10:00 AM',
      '10:00 AM - 12:00 PM',
      '12:00 PM - 02:00 PM',
      '02:00 PM - 04:00 PM',
      '04:00 PM - 06:00 PM',
      '06:00 PM - 08:00 PM',
      '08:00 PM - 10:00 PM',
      '10:00 PM - 12:00 AM',
    ]

    const selectedDateObj = new Date(selectedDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    selectedDateObj.setHours(0, 0, 0, 0)

    // If selected date is today, filter out past time slots
    if (selectedDateObj.getTime() === today.getTime()) {
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      const currentTime = currentHour * 60 + currentMinute // Convert to minutes

      const filteredSlots = slots.filter(slot => {
        const [startTimeStr, endTimeStr] = slot.split(' - ')
        
        // Parse start time
        const [startTime, startPeriod] = startTimeStr.split(' ')
        const [startHours, startMinutes] = startTime.split(':').map(Number)
        let startSlotHour = startHours
        if (startPeriod === 'PM' && startHours !== 12) startSlotHour += 12
        if (startPeriod === 'AM' && startHours === 12) startSlotHour = 0
        let startSlotTime = startSlotHour * 60 + startMinutes

        // Parse end time
        const [endTime, endPeriod] = endTimeStr.split(' ')
        const [endHours, endMinutes] = endTime.split(':').map(Number)
        let endSlotHour = endHours
        if (endPeriod === 'PM' && endHours !== 12) endSlotHour += 12
        if (endPeriod === 'AM' && endHours === 12) endSlotHour = 0
        let endSlotTime = endSlotHour * 60 + endMinutes

        // Handle 12:00 AM (midnight) for end time
        if (endSlotTime === 0) {
          endSlotTime = 24 * 60 // Treat as next day
        }
        // Handle 12:00 AM (midnight) for start time - if current time is before 11:30 PM,
        // treat midnight as next day (add 24 hours) so it's considered future
        if (startSlotTime === 0 && currentTime < 23 * 60 + 30) {
          startSlotTime = 24 * 60 // Treat as next day
        }

        // Show slots if:
        // 1. The slot hasn't ended yet (end time is in the future), OR
        // 2. The start time is at least 30 minutes in the future
        return endSlotTime > currentTime || startSlotTime > (currentTime + 30)
      })
      setAvailableTimeSlots(filteredSlots)
    } else {
      // For future dates, show all slots
      setAvailableTimeSlots(slots)
    }

    // Reset selected time when date changes
    setFormData(prev => ({ ...prev, pickupTime: '' }))
  }, [selectedDate])

  // Generate available dates (Today, Tomorrow, Day after tomorrow)
  const getAvailableDates = () => {
    const dates = []
    const today = new Date()
    for (let i = 0; i < 3; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push({
        value: date.toISOString().split('T')[0],
        label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'long' }),
        display: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })
    }
    return dates
  }

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      // Move to schedule pickup step
      setShowSchedulePickup(true)
    }
    // Error scrolling is handled by useEffect when errors state changes
  }

  const handleScheduleSubmit = () => {
    if (!selectedDate || !formData.pickupTime) {
      alert('Please select both date and time')
      return
    }
    // Reset checkbox when showing confirmation
    setAgreedToTerms(false)
    // Show confirmation view
    setShowConfirmation(true)
  }

  const handleConfirmPickup = async () => {
    setSubmitting(true)
    try {
      // Save to Firestore and send Telegram notification
      const { createPickupRequest } = await import('@/lib/api/client')
      console.log('Creating pickup request with valuationId:', valuationId)
      const result = await createPickupRequest({
        productName,
        price,
        customer: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          landmark: formData.landmark || '',
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        },
        pickupDate: selectedDate,
        pickupTime: formData.pickupTime || '',
        userId: user?.uid || null,
        valuationId: valuationId || null,
      })
      console.log('Pickup request created:', result)

      if (result.success) {
        console.log('Pickup request created successfully:', result)
        // Show success state
        setShowSuccess(true)
        
        // Call onConfirm to proceed with the flow after a short delay
        setTimeout(() => {
          onConfirm({
            ...formData,
            pickupDate: selectedDate,
          })
        }, 1500)
      } else {
        console.error('API Error:', result)
        // Show error in a user-friendly way without alert
        setErrors({ phone: 'Failed to confirm pickup. Please try again.' })
        setSubmitting(false)
      }
    } catch (error: any) {
      console.error('Error confirming pickup:', error)
      // Show error in a user-friendly way without alert
      setErrors({ phone: error.message || 'Something went wrong. Please try again.' })
      setSubmitting(false)
    }
  }

  const formatPickupDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selectedDateObj = new Date(dateStr)
    selectedDateObj.setHours(0, 0, 0, 0)
    
    if (selectedDateObj.getTime() === today.getTime()) {
      return 'Today'
    } else if (selectedDateObj.getTime() === today.getTime() + 86400000) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {showConfirmation ? 'Confirm Your Details' : showSchedulePickup ? 'Schedule Pickup' : 'Enter Pickup Details'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {showConfirmation ? 'Please review your details before confirming' : showSchedulePickup ? 'Select a convenient date and time' : 'Where can we pick up your device?'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Modal Content - Address Form */}
          {!showSchedulePickup && !showConfirmation && (
          <div className="p-6">
            <form onSubmit={handleAddressSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Full Name *
            </label>
            <input
              ref={nameRef}
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 outline-none transition-all ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your full name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Contact Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4 inline mr-1" />
              Contact Number *
            </label>
            <input
              ref={phoneRef}
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 outline-none transition-all ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="10-digit mobile number"
              maxLength={10}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address (for confirmation) *
            </label>
            <input
              ref={emailRef}
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 outline-none transition-all ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="your.email@example.com"
            />
            <p className="mt-1 text-xs text-gray-500">We'll send pickup confirmation to this email</p>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Pincode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Pincode *
            </label>
            <div className="relative">
              <input
                ref={pincodeRef}
                type="text"
                value={formData.pincode}
                onChange={(e) => handleChange('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 outline-none transition-all ${
                  errors.pincode ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter 6-digit pincode"
                maxLength={6}
              />
              {pincodeLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-brand-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            {errors.pincode && (
              <p className="mt-1 text-sm text-red-600">{errors.pincode}</p>
            )}
            {formData.pincode.length === 6 && !pincodeLoading && !errors.pincode && (
              <p className="mt-1 text-sm text-green-600">✓ Address details fetched</p>
            )}
          </div>

          {/* Agent Availability Message */}
          {formData.city && formData.state && formData.pincode.length === 6 && !pincodeLoading && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-green-900 mb-1">Great! We provide free pickup in {formData.city}, {formData.state}.</p>
                <p className="text-sm text-green-800">Our agent will collect your device from your doorstep.</p>
              </div>
            </div>
          )}

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City *
            </label>
            <input
              ref={cityRef}
              type="text"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 outline-none transition-all ${
                errors.city ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="City (auto-filled from pincode)"
              readOnly={!!formData.pincode && formData.pincode.length === 6}
            />
            {errors.city && (
              <p className="mt-1 text-sm text-red-600">{errors.city}</p>
            )}
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State *
            </label>
            <input
              ref={stateRef}
              type="text"
              value={formData.state}
              onChange={(e) => handleChange('state', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 outline-none transition-all ${
                errors.state ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="State (auto-filled from pincode)"
              readOnly={!!formData.pincode && formData.pincode.length === 6}
            />
            {errors.state && (
              <p className="mt-1 text-sm text-red-600">{errors.state}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Complete Address *
            </label>
            <textarea
              ref={addressRef}
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              rows={3}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 outline-none transition-all resize-none ${
                errors.address ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="House/Flat No., Building Name, Street, Area"
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address}</p>
            )}
          </div>

          {/* Landmark (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Landmark (Optional)
            </label>
            <input
              type="text"
              value={formData.landmark}
              onChange={(e) => handleChange('landmark', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 outline-none transition-all"
              placeholder="Nearby landmark for easy location"
            />
          </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-brand-blue-600 to-brand-lime text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Schedule Pickup
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>
          </div>
          )}

          {/* Success View */}
          {showSuccess && (
            <div className="p-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 bg-gradient-to-br from-brand-lime to-brand-lime-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
                >
                  <CheckCircle className="w-10 h-10 text-white" />
                </motion.div>
                <h2 className="text-2xl md:text-3xl font-bold text-brand-blue-900 mb-2">
                  Order Confirmed Successfully! 🎉
                </h2>
                <p className="text-gray-600 mb-4">
                  Your pickup request has been submitted
                </p>
                <p className="text-sm text-gray-500">
                  Our team will contact you soon to confirm the pickup schedule.
                </p>
              </motion.div>
            </div>
          )}

          {/* Confirmation View */}
          {showConfirmation && !showSuccess && (
            <div className="p-6">
              <div className="space-y-6">
                {/* Order Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Order Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Device:</span>
                      <span className="font-medium text-gray-900">{productName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-bold text-brand-blue-900">₹{price.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Customer Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium text-gray-900">{formData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium text-gray-900">{formData.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium text-gray-900">{formData.email}</span>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Address</h3>
                  <p className="text-gray-900">
                    {formData.address}
                    {formData.landmark && ` (Near: ${formData.landmark})`}, {formData.city}, {formData.state} - {formData.pincode}
                  </p>
                </div>

                {/* Pickup Slot */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Pickup Slot</h3>
                  <p className="text-gray-900 font-medium">
                    {formatPickupDate(selectedDate)}, {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {formData.pickupTime}
                  </p>
                </div>
              </div>

              {/* Terms and Conditions Checkbox */}
              <div className="flex items-start gap-3 pt-4 mt-4 border-t border-gray-200">
                <input
                  type="checkbox"
                  id="agree-terms-confirmation"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded border-2 border-gray-300 text-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer accent-cyan-500"
                  style={{ accentColor: '#06b6d4' }}
                />
                <label htmlFor="agree-terms-confirmation" className="text-sm text-gray-700 cursor-pointer leading-relaxed">
                  I agree to the{' '}
                  <Link href="/terms-conditions" target="_blank" className="text-cyan-600 hover:text-cyan-700 underline font-medium">
                    Terms and Conditions
                  </Link>
                  {' '}&{' '}
                  <Link href="/privacy-policy" target="_blank" className="text-cyan-600 hover:text-cyan-700 underline font-medium">
                    Privacy Policy
                  </Link>
                  .
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 mt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setAgreedToTerms(false)
                    setShowConfirmation(false)
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition-all"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPickup}
                  disabled={submitting || !agreedToTerms}
                  className={`flex-1 px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 ${
                    agreedToTerms && !submitting
                      ? 'bg-gradient-to-r from-brand-blue-600 to-brand-lime text-white'
                      : 'bg-gray-300 text-gray-700 cursor-not-allowed'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    'Confirm Pickup'
                  )}
                </button>
              </div>
            </div>
          )}

        {/* Schedule Pickup Section */}
        {showSchedulePickup && !showConfirmation && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Schedule Pickup</h2>
              <p className="text-sm text-gray-600">Select a convenient date and time</p>
            </div>

            {/* Select Date */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Select Date</h3>
              <div className="grid grid-cols-3 gap-3">
                {getAvailableDates().map((date) => (
                  <button
                    key={date.value}
                    type="button"
                    onClick={() => {
                      setSelectedDate(date.value)
                      setFormData(prev => ({ ...prev, pickupDate: date.value }))
                    }}
                    className={`p-4 border-2 rounded-lg text-center transition-all ${
                      selectedDate === date.value
                        ? 'border-brand-blue-600 bg-brand-blue-50 text-brand-blue-900'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-semibold">{date.label}</div>
                    <div className="text-sm text-gray-600">{date.display}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Select Time */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Select Time</h3>
              {!selectedDate ? (
                <p className="text-gray-500 text-sm">Please select a date first.</p>
              ) : availableTimeSlots.length === 0 ? (
                <p className="text-gray-500 text-sm">No available time slots for this date. Please select another date.</p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {availableTimeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, pickupTime: slot }))}
                      className={`p-3 border-2 rounded-lg text-center transition-all ${
                        formData.pickupTime === slot
                          ? 'border-brand-blue-600 bg-brand-blue-50 text-brand-blue-900 font-semibold'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => setShowSchedulePickup(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition-all"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleScheduleSubmit}
                disabled={!selectedDate || !formData.pickupTime || loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-brand-blue-600 to-brand-lime text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    Next: Confirm
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        </motion.div>
      </div>
  )
}
