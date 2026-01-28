'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { getUserValuationsLegacy, getUserPickupRequests, type Valuation, type PickupRequest } from '@/lib/firebase/database'
import { Clock, Truck, CheckCircle, AlertCircle, Package } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ActiveOrderItem {
  id: string
  type: 'valuation' | 'pickup'
  brand?: string
  model?: string
  productName?: string
  estimatedValue?: number
  price?: number
  status?: string
  createdAt?: Date | any
}

export default function ActiveOrders() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeOrders, setActiveOrders] = useState<ActiveOrderItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActiveOrders = async () => {
      if (!user?.uid) return

      try {
        setLoading(true)
        const userPhone = user?.phoneNumber?.replace(/^\+91/, '') || ''
        
        // Fetch both valuations and pickup requests
        const [valuations, pickupRequests] = await Promise.all([
          getUserValuationsLegacy(user.uid).catch(() => []),
          getUserPickupRequests(user.uid, userPhone).catch(() => []),
        ])

        // Combine and filter for active orders
        const allOrders: ActiveOrderItem[] = [
          ...valuations
            .filter((v) => v.status === 'pending' || v.status === 'approved')
            .map(v => ({
              id: v.id || '',
              type: 'valuation' as const,
              brand: v.brand,
              model: v.model,
              estimatedValue: v.estimatedValue,
              status: v.status,
              createdAt: v.createdAt,
            })),
          ...pickupRequests
            .filter((pr) => {
              const status = pr.status || 'pending'
              // Include pending, confirmed, and other active statuses
              return status === 'pending' || status === 'confirmed' || status === 'hold' || status === 'verification'
            })
            .map(pr => ({
              id: pr.id,
              type: 'pickup' as const,
              productName: pr.productName,
              price: pr.price,
              status: pr.status || 'pending',
              createdAt: pr.createdAt,
            })),
        ]

        // Sort by date (newest first)
        allOrders.sort((a, b) => {
          const aDate = a.createdAt instanceof Date 
            ? a.createdAt.getTime() 
            : (a.createdAt as any)?.toDate?.()?.getTime() || 0
          const bDate = b.createdAt instanceof Date 
            ? b.createdAt.getTime() 
            : (b.createdAt as any)?.toDate?.()?.getTime() || 0
          return bDate - aDate
        })

        setActiveOrders(allOrders)
      } catch (err: any) {
        console.error('Error fetching active orders:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchActiveOrders()
  }, [user?.uid, user?.phoneNumber])

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
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No active orders</h3>
        <p className="text-gray-600 mb-6">You don't have any pending orders at the moment.</p>
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
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-lime text-brand-blue-900 rounded-lg font-semibold hover:bg-brand-lime-400 transition-colors cursor-pointer"
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
        <span className="text-sm text-gray-500">{activeOrders.length} {activeOrders.length === 1 ? 'order' : 'orders'}</span>
      </div>

      <div className="space-y-4">
        {activeOrders.map((order, index) => {
          const statusInfo = getStatusInfo(order.status || 'pending', order.type)
          const StatusIcon = statusInfo.icon

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
                            {order.brand} {order.model}
                          </>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{statusInfo.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Order ID: {order.id?.substring(0, 8)}...</span>
                        <span>₹{(order.type === 'pickup' ? order.price : order.estimatedValue)?.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  {order.id && (
                    <>
                      {order.type === 'valuation' ? (
                        <>
                          <Link
                            href={`/order-summary?id=${order.id}`}
                            className="px-4 py-2 text-sm font-medium text-brand-blue-600 hover:text-brand-blue-700 border border-brand-blue-200 rounded-lg hover:bg-brand-blue-50 transition-colors text-center"
                          >
                            View Details
                          </Link>
                          {order.status === 'approved' && (
                            <Link
                              href={`/order-summary?id=${order.id}&schedule=true`}
                              className="px-4 py-2 text-sm font-medium bg-brand-lime text-brand-blue-900 rounded-lg hover:bg-brand-lime-400 transition-colors text-center"
                            >
                              Schedule Pickup
                            </Link>
                          )}
                        </>
                      ) : (
                        <Link
                          href={`/order-summary?id=${order.id}`}
                          className="px-4 py-2 text-sm font-medium text-brand-blue-600 hover:text-brand-blue-700 border border-brand-blue-200 rounded-lg hover:bg-brand-blue-50 transition-colors text-center"
                        >
                          View Details
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
