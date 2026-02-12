'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, MapPin, X, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import { useModalHistory } from '@/hooks/useModalHistory'

interface PickupSchedulerProps {
  isOpen: boolean
  onClose: () => void
  onSchedule: (date: string, time: string) => Promise<void>
  valuationId?: string
  productName?: string
  price?: number
  initialDate?: string
  initialTime?: string
}

export default function PickupScheduler({
  isOpen,
  onClose,
  onSchedule,
  valuationId,
  productName,
  price,
  initialDate,
  initialTime,
}: PickupSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || '')
  const [selectedTime, setSelectedTime] = useState<string>(initialTime || '')
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [step, setStep] = useState<'schedule' | 'confirm'>('schedule')

  // Handle browser back button to close modal
  useModalHistory(isOpen, onClose, 'pickup-scheduler')

  useEffect(() => {
    if (initialDate) setSelectedDate(initialDate)
    if (initialTime) setSelectedTime(initialTime)
  }, [initialDate, initialTime])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDate('')
      setSelectedTime('')
      setError(null)
      setSuccess(false)
      setStep('schedule')
    }
  }, [isOpen])

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
    setSelectedTime('')
  }, [selectedDate])

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

  const handleNextStep = () => {
    if (!selectedDate || !selectedTime) {
      setError('Please select both date and time')
      return
    }
    setError(null)
    setStep('confirm')
  }

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      setError('Please select both date and time')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await onSchedule(selectedDate, selectedTime)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to reschedule pickup. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {step === 'confirm' ? 'Confirm Reschedule' : 'Reschedule Pickup'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {step === 'confirm' ? 'Review your new pickup schedule' : 'Select a convenient date and time'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Success State */}
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                  className="w-20 h-20 bg-gradient-to-br from-brand-lime to-brand-lime-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
                >
                  <CheckCircle className="w-10 h-10 text-white" />
                </motion.div>
                <h3 className="text-2xl font-bold text-brand-blue-900 mb-2">Pickup Rescheduled!</h3>
                <p className="text-gray-600 mb-2">Your pickup has been rescheduled successfully.</p>
                <p className="text-sm text-gray-500">Redirecting...</p>
              </motion.div>
            ) : step === 'confirm' ? (
              /* Confirmation Step */
              <div className="space-y-6">
                {/* Order Information */}
                {productName && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Order Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Device:</span>
                        <span className="font-medium text-gray-900">{productName}</span>
                      </div>
                      {price && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Price:</span>
                          <span className="font-bold text-brand-blue-900">₹{price.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* New Pickup Schedule */}
                <div className="bg-gradient-to-br from-brand-blue-50 to-brand-lime/10 rounded-xl p-4 border border-brand-blue-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">New Pickup Schedule</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-brand-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-brand-blue-900 text-lg">
                        {formatPickupDate(selectedDate)}, {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-gray-600">{selectedTime}</p>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-900">
                      <p className="font-semibold mb-1">Pickup Information</p>
                      <ul className="space-y-1 text-blue-800">
                        <li>• Our team will arrive at your selected time</li>
                        <li>• Please keep your device ready for inspection</li>
                        <li>• You'll receive a confirmation SMS/Email</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setStep('schedule')}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-brand-blue-600 to-brand-lime text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Rescheduling...
                      </>
                    ) : (
                      'Confirm Reschedule'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Schedule Selection Step */
              <div className="space-y-6">
                {/* Date Selection */}
                <div>
                  <label className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-3">
                    <Calendar className="w-5 h-5 text-brand-blue-600" />
                    Select Date
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {getAvailableDates().map((date) => (
                      <button
                        key={date.value}
                        type="button"
                        onClick={() => {
                          setSelectedDate(date.value)
                          setError(null)
                        }}
                        className={`p-4 border-2 rounded-xl text-center transition-all ${
                          selectedDate === date.value
                            ? 'border-brand-blue-600 bg-brand-blue-50 text-brand-blue-900'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-semibold">{date.label}</div>
                        <div className="text-sm text-gray-600">{date.display}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Selection */}
                <div>
                  <label className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-3">
                    <Clock className="w-5 h-5 text-brand-blue-600" />
                    Select Time Slot
                  </label>
                  {!selectedDate ? (
                    <p className="text-gray-500 text-sm">Please select a date first.</p>
                  ) : availableTimeSlots.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <p className="text-amber-800 text-sm">No available time slots for today. Please select another date.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {availableTimeSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => {
                            setSelectedTime(slot)
                            setError(null)
                          }}
                          className={`p-3 border-2 rounded-lg text-center transition-all text-sm ${
                            selectedTime === slot
                              ? 'border-brand-blue-600 bg-brand-blue-50 text-brand-blue-900 font-semibold'
                              : 'border-gray-300 hover:border-gray-400 text-gray-700'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Summary */}
                {selectedDate && selectedTime && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium">
                        New pickup: {formatPickupDate(selectedDate)} at {selectedTime}
                      </span>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={!selectedDate || !selectedTime}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-brand-blue-600 to-brand-lime text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Next: Confirm
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
