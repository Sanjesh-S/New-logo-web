'use client'

import { motion } from 'framer-motion'
import { CheckCircle, Clock, Package, Truck, AlertCircle, XCircle } from 'lucide-react'

type OrderStatus = 'pending' | 'confirmed' | 'scheduled' | 'picked_up' | 'verification' | 'completed' | 'rejected' | 'cancelled'

interface TimelineStep {
  status: OrderStatus
  label: string
  description: string
  icon: typeof CheckCircle
  date?: Date | string
}

interface OrderTrackingTimelineProps {
  status: string
  createdAt?: Date | string | any
  pickupDate?: string
  pickupTime?: string
  completedAt?: Date | string | any
  cancelledAt?: Date | string | any
}

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
  pending: { label: 'Order Placed', icon: Package, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  confirmed: { label: 'Order Confirmed', icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-200' },
  scheduled: { label: 'Pickup Scheduled', icon: Clock, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  picked_up: { label: 'Device Picked Up', icon: Truck, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  verification: { label: 'Quality Check', icon: Package, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  completed: { label: 'Order Completed', icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-200' },
  rejected: { label: 'Order Rejected', icon: XCircle, color: 'text-red-600 bg-red-50 border-red-200' },
  cancelled: { label: 'Order Cancelled', icon: XCircle, color: 'text-gray-600 bg-gray-50 border-gray-200' },
}

// Helper to safely convert Firestore Timestamp or Date to Date
function getDateFromTimestamp(value: Date | any | unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate()
  }
  if (typeof value === 'string') {
    return new Date(value)
  }
  return null
}

export default function OrderTrackingTimeline({
  status,
  createdAt,
  pickupDate,
  pickupTime,
  completedAt,
  cancelledAt,
}: OrderTrackingTimelineProps) {
  const normalizedStatus = (status || 'pending').toLowerCase() as OrderStatus
  
  // Build timeline steps based on status
  const getTimelineSteps = (): TimelineStep[] => {
    const steps: TimelineStep[] = []
    const createdDate = getDateFromTimestamp(createdAt)
    
    // Step 1: Order Placed (always present)
    steps.push({
      status: 'pending',
      label: 'Order Placed',
      description: 'Your trade-in request has been received',
      icon: Package,
      date: createdDate || undefined,
    })

    // Step 2: Order Confirmed (if status is beyond pending)
    if (['confirmed', 'scheduled', 'picked_up', 'verification', 'completed'].includes(normalizedStatus)) {
      steps.push({
        status: 'confirmed',
        label: 'Order Confirmed',
        description: 'Your order has been confirmed',
        icon: CheckCircle,
        date: createdDate || undefined,
      })
    }

    // Step 3: Pickup Scheduled (if scheduled or beyond)
    if (['scheduled', 'picked_up', 'verification', 'completed'].includes(normalizedStatus)) {
      steps.push({
        status: 'scheduled',
        label: 'Pickup Scheduled',
        description: pickupDate && pickupTime 
          ? `Scheduled for ${new Date(pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at ${pickupTime}`
          : 'Pickup has been scheduled',
        icon: Clock,
        date: pickupDate ? new Date(pickupDate) : undefined,
      })
    }

    // Step 4: Device Picked Up (if picked up or beyond)
    if (['picked_up', 'verification', 'completed'].includes(normalizedStatus)) {
      steps.push({
        status: 'picked_up',
        label: 'Device Picked Up',
        description: 'Your device has been collected',
        icon: Truck,
        date: pickupDate ? new Date(pickupDate) : undefined,
      })
    }

    // Step 5: Quality Check (if verification or completed)
    if (['verification', 'completed'].includes(normalizedStatus)) {
      steps.push({
        status: 'verification',
        label: 'Quality Check',
        description: 'Device is being inspected',
        icon: Package,
      })
    }

    // Step 6: Final Status
    if (normalizedStatus === 'completed') {
      const completedDate = getDateFromTimestamp(completedAt)
      steps.push({
        status: 'completed',
        label: 'Order Completed',
        description: 'Payment processed successfully',
        icon: CheckCircle,
        date: completedDate || undefined,
      })
    } else if (normalizedStatus === 'rejected') {
      steps.push({
        status: 'rejected',
        label: 'Order Rejected',
        description: 'Device did not meet quality standards',
        icon: XCircle,
      })
    } else if (normalizedStatus === 'cancelled') {
      const cancelledDate = getDateFromTimestamp(cancelledAt)
      steps.push({
        status: 'cancelled',
        label: 'Order Cancelled',
        description: 'Order has been cancelled',
        icon: XCircle,
        date: cancelledDate || undefined,
      })
    }

    return steps
  }

  const timelineSteps = getTimelineSteps()
  const currentStepIndex = timelineSteps.length - 1

  const formatDate = (date: Date | undefined): string => {
    if (!date) return ''
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Tracking</h3>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
        
        <div className="space-y-6">
          {timelineSteps.map((step, index) => {
            const isCompleted = index <= currentStepIndex
            const isCurrent = index === currentStepIndex && !['completed', 'rejected', 'cancelled'].includes(step.status)
            const Icon = step.icon
            
            return (
              <motion.div
                key={step.status}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex items-start gap-4"
              >
                {/* Icon */}
                <div
                  className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                    isCompleted
                      ? 'bg-brand-lime border-brand-lime text-brand-blue-900'
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                  } ${isCurrent ? 'ring-4 ring-brand-lime/20' : ''}`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4
                      className={`font-semibold ${
                        isCompleted ? 'text-gray-900' : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </h4>
                    {step.date && (
                      <span className="text-xs text-gray-500">
                        {formatDate(step.date instanceof Date ? step.date : new Date(step.date))}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-sm ${
                      isCompleted ? 'text-gray-600' : 'text-gray-400'
                    }`}
                  >
                    {step.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Current Status Badge */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Current Status:</span>
          <span
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border ${
              statusConfig[normalizedStatus]?.color || 'text-gray-600 bg-gray-50 border-gray-200'
            }`}
          >
            {(() => {
              const Icon = statusConfig[normalizedStatus]?.icon || Clock
              return <Icon className="w-4 h-4" />
            })()}
            {statusConfig[normalizedStatus]?.label || status}
          </span>
        </div>
      </div>
    </div>
  )
}
