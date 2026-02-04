'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { getUserValuationsLegacy, getUserPickupRequests, updatePickupRequest, updateValuation, type Valuation, type PickupRequest } from '@/lib/firebase/database'
import { Clock, Truck, CheckCircle, AlertCircle, Package, X, Calendar, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PickupScheduler from '@/components/PickupScheduler'
import OrderTrackingTimeline from './OrderTrackingTimeline'

// Helper to safely convert Firestore Timestamp or Date to Date
interface FirestoreTimestamp {
  toDate: () => Date
}

function getDateFromTimestamp(value: Date | FirestoreTimestamp | unknown): Date {
  if (value instanceof Date) {
    return value
  }
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as FirestoreTimestamp).toDate === 'function') {
    return (value as FirestoreTimestamp).toDate()
  }
  return new Date()
}

function getDateStringFromValue(value: Date | FirestoreTimestamp | string | unknown): string | undefined {
  if (!value) return undefined
  if (typeof value === 'string') return value
  if (value instanceof Date) {
    return value.toISOString().split('T')[0]
  }
  if (typeof value === 'object' && 'toDate' in value && typeof (value as FirestoreTimestamp).toDate === 'function') {
    return (value as FirestoreTimestamp).toDate().toISOString().split('T')[0]
  }
  return undefined
}

/**
 * Check if rescheduling is allowed (must be more than 2 hours before pickup slot starts)
 * @param pickupDate - Date string in YYYY-MM-DD format
 * @param pickupTime - Time string in format "10:00 PM - 12:00 AM"
 * @returns true if rescheduling is allowed (more than 2 hours before slot start)
 */
function canReschedule(pickupDate: string | undefined, pickupTime: string | undefined): boolean {
  if (!pickupDate || !pickupTime) {
    return true // Allow rescheduling if date/time is missing (shouldn't happen, but be safe)
  }

  try {
    // Parse the time slot to get start time (e.g., "10:00 PM - 12:00 AM" -> "10:00 PM")
    const [startTimeStr] = pickupTime.split(' - ')
    if (!startTimeStr) {
      return true // If we can't parse, allow rescheduling
    }

    // Parse start time (e.g., "10:00 PM")
    const [timePart, period] = startTimeStr.trim().split(' ')
    if (!timePart || !period) {
      return true // If we can't parse, allow rescheduling
    }

    const [hours, minutes] = timePart.split(':').map(Number)
    let startHour = hours
    if (period.toUpperCase() === 'PM' && hours !== 12) startHour += 12
    if (period.toUpperCase() === 'AM' && hours === 12) startHour = 0

    // Create pickup slot start datetime
    const pickupDateObj = new Date(pickupDate)
    pickupDateObj.setHours(startHour, minutes, 0, 0)

    // Get current time
    const now = new Date()

    // Calculate difference in milliseconds
    const diffMs = pickupDateObj.getTime() - now.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    // Allow rescheduling only if more than 2 hours remain
    return diffHours > 2
  } catch (error) {
    // Error checking reschedule eligibility
    return true // If there's an error, allow rescheduling to be safe
  }
}

interface ActiveOrderItem {
  id: string
  orderId?: string // Custom Order ID for display
  type: 'valuation' | 'pickup'
  brand?: string
  model?: string
  productName?: string
  estimatedValue?: number
  price?: number
  status?: string
  createdAt?: Date | FirestoreTimestamp
  pickupDate?: string
  pickupTime?: string
}

export default function ActiveOrders() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeOrders, setActiveOrders] = useState<ActiveOrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<ActiveOrderItem | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [expandedTracking, setExpandedTracking] = useState<string | null>(null)

  // Helper function to format product name without duplicate brand
  const formatProductName = (brand: string | undefined, model: string | undefined): string => {
    if (!brand && !model) return 'Unknown Product'
    if (!model) return brand || ''
    if (!brand) return model
    
    const normalizedBrand = brand.toLowerCase().trim()
    const normalizedModel = model.toLowerCase().trim()
    
    // If model already starts with brand, just return model
    if (normalizedModel.startsWith(normalizedBrand)) {
      return model
    }
    
    // Otherwise, return brand + model
    return `${brand} ${model}`.trim()
  }

  const fetchActiveOrders = async (isRefresh = false) => {
    if (!user?.uid) return

    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      const userPhone = user?.phoneNumber?.replace(/^\+91/, '') || ''
      
      // Fetching orders
      
      // Fetch both valuations and pickup requests
      const [valuations, pickupRequests] = await Promise.all([
        getUserValuationsLegacy(user.uid).catch((e) => { return [] }),
        getUserPickupRequests(user.uid, userPhone).catch((e) => { return [] }),
      ])
      
      // Orders fetched

      // Combine and filter for active orders (exclude completed, rejected, suspect, cancelled)
      const allOrders: ActiveOrderItem[] = [
        ...valuations
          .filter((v) => {
            const status = v.status || 'pending'
            // Exclude completed, rejected - these go to Order History (valuations don't have suspect/cancelled)
            return status !== 'completed' && status !== 'rejected'
          })
          .map(v => ({
            id: v.id || '',
            orderId: v.orderId, // Custom Order ID for display
            type: 'valuation' as const,
            brand: v.brand,
            model: v.model,
            estimatedValue: v.estimatedValue,
            status: v.status,
            createdAt: v.createdAt,
            pickupDate: getDateStringFromValue(v.pickupDate),
            pickupTime: v.pickupTime,
          })),
        ...pickupRequests
          .filter((pr) => {
            const status = pr.status || 'pending'
            // Exclude completed, reject, suspect, cancelled - these go to Order History
            // Include pending, confirmed, hold, verification (active statuses)
            return status !== 'completed' && status !== 'reject' && status !== 'suspect' && status !== 'cancelled'
          })
          .map(pr => ({
            id: pr.id,
            orderId: pr.orderId, // Custom Order ID for display
            type: 'pickup' as const,
            productName: pr.productName,
            price: pr.price,
            status: pr.status || 'pending',
            createdAt: pr.createdAt,
            pickupDate: pr.pickupDate,
            pickupTime: pr.pickupTime,
          })),
      ]

      // Sort by date (newest first)
      allOrders.sort((a, b) => {
        const aDate = getDateFromTimestamp(a.createdAt).getTime()
        const bDate = getDateFromTimestamp(b.createdAt).getTime()
        return bDate - aDate
      })

      setActiveOrders(allOrders)
    } catch (err: any) {
      // Error fetching active orders
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchActiveOrders()
  }, [user?.uid, user?.phoneNumber])
  
  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (user?.uid) {
        fetchActiveOrders(true)
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [user?.uid, user?.phoneNumber])

  const handleCancelOrder = async () => {
    if (!selectedOrder) return
    
    try {
      setCancelling(true)
      
      if (selectedOrder.type === 'pickup') {
        await updatePickupRequest(selectedOrder.id, { status: 'cancelled' })
      } else {
        await updateValuation(selectedOrder.id, { status: 'rejected' })
      }
      
      // Refresh orders list
      const userPhone = user?.phoneNumber?.replace(/^\+91/, '') || ''
      const [valuations, pickupRequests] = await Promise.all([
        getUserValuationsLegacy(user!.uid).catch(() => []),
        getUserPickupRequests(user!.uid, userPhone).catch(() => []),
      ])

      const allOrders: ActiveOrderItem[] = [
        ...valuations
          .filter((v) => {
            const status = v.status || 'pending'
            // Exclude completed, rejected - these go to Order History (valuations don't have suspect/cancelled)
            return status !== 'completed' && status !== 'rejected'
          })
          .map(v => ({
            id: v.id || '',
            orderId: v.orderId, // Custom Order ID for display
            type: 'valuation' as const,
            brand: v.brand,
            model: v.model,
            estimatedValue: v.estimatedValue,
            status: v.status,
            createdAt: v.createdAt,
            pickupDate: getDateStringFromValue(v.pickupDate),
            pickupTime: v.pickupTime,
          })),
        ...pickupRequests
          .filter((pr) => {
            const status = pr.status || 'pending'
            // Exclude completed, reject, suspect, cancelled - these go to Order History
            return status !== 'completed' && status !== 'reject' && status !== 'suspect' && status !== 'cancelled'
          })
          .map(pr => ({
            id: pr.id,
            orderId: pr.orderId,
            type: 'pickup' as const,
            productName: pr.productName,
            price: pr.price,
            status: pr.status || 'pending',
            createdAt: pr.createdAt,
            pickupDate: pr.pickupDate,
            pickupTime: pr.pickupTime,
          })),
      ]

      allOrders.sort((a, b) => {
        const aDate = getDateFromTimestamp(a.createdAt).getTime()
        const bDate = getDateFromTimestamp(b.createdAt).getTime()
        return bDate - aDate
      })

      setActiveOrders(allOrders)
      setShowCancelModal(false)
      setSelectedOrder(null)
    } catch (error) {
      // Error cancelling order
      alert('Failed to cancel order. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  const handleReschedule = async (date: string, time: string) => {
    if (!selectedOrder) return
    
    if (selectedOrder.type === 'pickup') {
      // Mark as rescheduled and store previous pickup info
      await updatePickupRequest(selectedOrder.id, {
        pickupDate: date,
        pickupTime: time,
        rescheduled: true,
        rescheduledAt: new Date(),
        previousPickupDate: selectedOrder.pickupDate || undefined,
        previousPickupTime: selectedOrder.pickupTime || undefined,
      })
    } else {
      await updateValuation(selectedOrder.id, {
        pickupDate: new Date(date),
        pickupTime: time,
      })
    }
    
    setShowRescheduleModal(false)
    setSelectedOrder(null)
    
    // Refresh orders list
    const userPhone = user?.phoneNumber?.replace(/^\+91/, '') || ''
    const [valuations, pickupRequests] = await Promise.all([
      getUserValuationsLegacy(user!.uid).catch(() => []),
      getUserPickupRequests(user!.uid, userPhone).catch(() => []),
    ])

    const allOrders: ActiveOrderItem[] = [
      ...valuations
        .filter((v) => {
          const status = v.status || 'pending'
          // Exclude completed, rejected - these go to Order History (valuations don't have suspect/cancelled)
          return status !== 'completed' && status !== 'rejected'
        })
        .map(v => ({
          id: v.id || '',
          orderId: v.orderId, // Custom Order ID for display
          type: 'valuation' as const,
          brand: v.brand,
          model: v.model,
          estimatedValue: v.estimatedValue,
          status: v.status,
          createdAt: v.createdAt,
          pickupDate: getDateStringFromValue(v.pickupDate),
          pickupTime: v.pickupTime,
        })),
      ...pickupRequests
        .filter((pr) => {
          const status = pr.status || 'pending'
          // Exclude completed, reject, suspect, cancelled - these go to Order History
          return status !== 'completed' && status !== 'reject' && status !== 'suspect' && status !== 'cancelled'
        })
        .map(pr => ({
          id: pr.id,
          orderId: pr.orderId,
          type: 'pickup' as const,
          productName: pr.productName,
          price: pr.price,
          status: pr.status || 'pending',
          createdAt: pr.createdAt,
          pickupDate: pr.pickupDate,
          pickupTime: pr.pickupTime,
        })),
    ]

    allOrders.sort((a, b) => {
      const aDate = getDateFromTimestamp(a.createdAt).getTime()
      const bDate = getDateFromTimestamp(b.createdAt).getTime()
      return bDate - aDate
    })

    setActiveOrders(allOrders)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-brand-lime border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (activeOrders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No active orders</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          You don't have any pending orders at the moment. Start a new trade-in to get an instant valuation for your device.
        </p>
        <a
          href="/#trade-in"
          onClick={(e) => {
            e.preventDefault()
            router.push('/#trade-in')
            // Scroll to the section after navigation
            setTimeout(() => {
              const element = document.getElementById('trade-in')
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            }, 300)
          }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-lime text-brand-blue-900 rounded-lg font-semibold hover:bg-brand-lime-400 transition-colors cursor-pointer shadow-md hover:shadow-lg"
        >
          Start New Trade-In
        </a>
      </div>
    )
  }

  const getStatusInfo = (status: string, type: 'valuation' | 'pickup') => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          text: type === 'pickup' ? 'Pickup Scheduled' : 'Pending Review',
          description: type === 'pickup' 
            ? 'Your pickup request is pending confirmation' 
            : 'Your order is being reviewed by our team',
          color: 'text-yellow-600 bg-yellow-50',
        }
      case 'approved':
        return {
          icon: Truck,
          text: 'Approved - Schedule Pickup',
          description: 'Your order is approved! Schedule a pickup time',
          color: 'text-green-600 bg-green-50',
        }
      case 'confirmed':
        return {
          icon: CheckCircle,
          text: 'Pickup Confirmed',
          description: 'Your pickup has been confirmed and will be collected soon',
          color: 'text-blue-600 bg-blue-50',
        }
      case 'hold':
        return {
          icon: AlertCircle,
          text: 'On Hold',
          description: 'Your pickup is temporarily on hold',
          color: 'text-orange-600 bg-orange-50',
        }
      case 'verification':
        return {
          icon: Clock,
          text: 'Under Verification',
          description: 'Your pickup is being verified',
          color: 'text-purple-600 bg-purple-50',
        }
      default:
        return {
          icon: AlertCircle,
          text: status,
          description: '',
          color: 'text-gray-600 bg-gray-50',
        }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Active Orders</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchActiveOrders(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-brand-blue-600 hover:bg-brand-blue-50 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh orders"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <span className="text-sm text-gray-500">{activeOrders.length} {activeOrders.length === 1 ? 'order' : 'orders'}</span>
        </div>
      </div>

      <div className="space-y-4">
        {activeOrders.map((order, index) => {
          const statusInfo = getStatusInfo(order.status || 'pending', order.type)
          const StatusIcon = statusInfo.icon
          const showTracking = expandedTracking === order.id

          return (
            <motion.div
              key={order.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`p-3 rounded-lg ${statusInfo.color}`}>
                      <StatusIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">
                        {order.type === 'pickup' ? (
                          <>
                            {order.productName}
                            <span className="ml-2 inline-flex items-center gap-1 text-xs text-brand-blue-600">
                              <Truck className="w-3 h-3" />
                              Pickup Request
                            </span>
                          </>
                        ) : (
                          <>
                            {formatProductName(order.brand, order.model)}
                          </>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{statusInfo.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span>Order ID: {order.orderId || order.id?.substring(0, 8) + '...'}</span>
                        <span>₹{(order.type === 'pickup' ? order.price : order.estimatedValue)?.toLocaleString('en-IN')}</span>
                        {order.pickupDate && (
                          <span className="flex items-center gap-1 text-brand-blue-600 font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(order.pickupDate).toLocaleDateString('en-IN', { 
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short'
                            })}
                            {order.pickupTime && ` • ${order.pickupTime}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
                  {order.id && (
                    <>
                      <button
                        onClick={() => setExpandedTracking(showTracking ? null : order.id || null)}
                        className="px-4 py-2 text-sm font-medium text-brand-blue-600 hover:text-brand-blue-700 border border-brand-blue-200 rounded-lg hover:bg-brand-blue-50 transition-colors text-center"
                      >
                        {showTracking ? 'Hide Tracking' : 'Track Order'}
                      </button>
                      <Link
                        href={`/order-summary?id=${order.orderId || order.id}&price=${order.type === 'pickup' ? order.price : order.estimatedValue}`}
                        className="px-4 py-2 text-sm font-medium text-brand-blue-600 hover:text-brand-blue-700 border border-brand-blue-200 rounded-lg hover:bg-brand-blue-50 transition-colors text-center"
                      >
                        View Details
                      </Link>
                      
                      {/* Schedule Pickup for approved valuations that don't have pickup scheduled yet */}
                      {order.type === 'valuation' && order.status === 'approved' && !order.pickupDate && (
                        <Link
                          href={`/order-summary?id=${order.orderId || order.id}&price=${order.estimatedValue}&schedule=true`}
                          className="px-4 py-2 text-sm font-medium bg-brand-lime text-brand-blue-900 rounded-lg hover:bg-brand-lime-400 transition-colors text-center"
                        >
                          Schedule Pickup
                        </Link>
                      )}
                      
                      {/* Reschedule button - shows for ALL orders (both valuation and pickup) with pending/confirmed status */}
                      {/* Only available if more than 2 hours before pickup slot starts */}
                      {(order.status === 'pending' || order.status === 'confirmed' || order.status === 'approved') && 
                       canReschedule(order.pickupDate, order.pickupTime) && (
                        <button
                          onClick={() => {
                            setSelectedOrder(order)
                            setShowRescheduleModal(true)
                          }}
                          className="px-4 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-1"
                        >
                          <Calendar className="w-4 h-4" />
                          Reschedule
                        </button>
                      )}
                      
                      {/* Cancel button for pending orders */}
                      {(order.status === 'pending' || order.status === 'confirmed') && (
                        <button
                          onClick={() => {
                            setSelectedOrder(order)
                            setShowCancelModal(true)
                          }}
                          className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {/* Order Tracking Timeline */}
              <AnimatePresence>
                {showTracking && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-6 pt-6 border-t border-gray-200 overflow-hidden"
                  >
                    <OrderTrackingTimeline
                      status={order.status || 'pending'}
                      createdAt={order.createdAt}
                      pickupDate={order.pickupDate}
                      pickupTime={order.pickupTime}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <X className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Cancel Order</h3>
                  <p className="text-sm text-gray-500">Are you sure?</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  You are about to cancel this {selectedOrder.type === 'pickup' ? 'pickup request' : 'order'}:
                </p>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="font-semibold text-gray-900">
                    {selectedOrder.type === 'pickup' 
                      ? selectedOrder.productName 
                      : formatProductName(selectedOrder.brand, selectedOrder.model)}
                  </p>
                  <p className="text-sm text-gray-600">
                    ₹{(selectedOrder.type === 'pickup' ? selectedOrder.price : selectedOrder.estimatedValue)?.toLocaleString('en-IN')}
                  </p>
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  This action cannot be undone. The {selectedOrder.type === 'pickup' ? 'pickup will be cancelled' : 'order will be marked as cancelled'}.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false)
                    setSelectedOrder(null)
                  }}
                  disabled={cancelling}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Keep Order
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {cancelling ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      Yes, Cancel Order
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reschedule Modal */}
      {selectedOrder && (
        <PickupScheduler
          isOpen={showRescheduleModal}
          onClose={() => {
            setShowRescheduleModal(false)
            setSelectedOrder(null)
          }}
          onSchedule={handleReschedule}
          valuationId={selectedOrder.id}
          productName={selectedOrder.type === 'pickup' 
            ? selectedOrder.productName 
            : formatProductName(selectedOrder.brand, selectedOrder.model)}
          price={selectedOrder.type === 'pickup' ? selectedOrder.price : selectedOrder.estimatedValue}
        />
      )}
    </div>
  )
}
