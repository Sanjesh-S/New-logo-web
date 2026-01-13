'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, MapPin, X, CheckCircle, AlertCircle } from 'lucide-react'

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

const timeSlots = [
  '09:00 AM - 11:00 AM',
  '11:00 AM - 01:00 PM',
  '01:00 PM - 03:00 PM',
  '03:00 PM - 05:00 PM',
  '05:00 PM - 07:00 PM',
]

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
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (initialDate) setSelectedDate(initialDate)
    if (initialTime) setSelectedTime(initialTime)
  }, [initialDate, initialTime])

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date()
    today.setDate(today.getDate() + 1) // Allow scheduling from tomorrow
    return today.toISOString().split('T')[0]
  }

  // Get maximum date (30 days from now)
  const getMaxDate = () => {
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 30)
    return maxDate.toISOString().split('T')[0]
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
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
      setError(err.message || 'Failed to schedule pickup. Please try again.')
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
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Schedule Pickup</h2>
              {productName && (
                <p className="text-sm text-gray-600 mt-1">{productName}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Pickup Scheduled!</h3>
                <p className="text-gray-600">Your pickup has been scheduled successfully.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Date Selection */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <Calendar className="w-5 h-5 text-brand-blue-600" />
                    Select Date
                  </label>
                  <input
                    type="date"
                    required
                    min={getMinDate()}
                    max={getMaxDate()}
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value)
                      setError(null)
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 text-gray-900"
                  />
                  {selectedDate && (
                    <p className="mt-2 text-sm text-gray-600">
                      Selected: <span className="font-medium">{formatDate(selectedDate)}</span>
                    </p>
                  )}
                </div>

                {/* Time Selection */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <Clock className="w-5 h-5 text-brand-blue-600" />
                    Select Time Slot
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => {
                          setSelectedTime(slot)
                          setError(null)
                        }}
                        className={`px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                          selectedTime === slot
                            ? 'border-brand-blue-600 bg-brand-blue-50 text-brand-blue-900'
                            : 'border-gray-200 hover:border-brand-blue-300 text-gray-700'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-semibold mb-1">Pickup Information</p>
                      <ul className="space-y-1 text-blue-800">
                        <li>• Our team will arrive at your selected time</li>
                        <li>• Please keep your device ready for inspection</li>
                        <li>• You'll receive a confirmation SMS/Email</li>
                        <li>• You can reschedule up to 24 hours before pickup</li>
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
                    onClick={onClose}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !selectedDate || !selectedTime}
                    className="flex-1 px-6 py-3 bg-brand-lime text-brand-blue-900 rounded-xl font-semibold hover:bg-brand-lime-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Scheduling...' : 'Confirm Pickup'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
