'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { getUserValuationsLegacy, getUserPickupRequests, type Valuation, type PickupRequest } from '@/lib/firebase/database'
import { Package, Calendar, IndianRupee, CheckCircle, XCircle, Clock, AlertCircle, Truck } from 'lucide-react'
import Link from 'next/link'

type StatusType = 'pending' | 'approved' | 'completed' | 'rejected' | 'cancelled' | 'confirmed' | 'hold' | 'verification'

const statusConfig: Record<StatusType, { icon: typeof Clock; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-yellow-600 bg-yellow-50 border-yellow-200', label: 'Pending' },
  approved: { icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-200', label: 'Approved' },
  completed: { icon: CheckCircle, color: 'text-blue-600 bg-blue-50 border-blue-200', label: 'Completed' },
  rejected: { icon: XCircle, color: 'text-red-600 bg-red-50 border-red-200', label: 'Rejected' },
  cancelled: { icon: XCircle, color: 'text-red-600 bg-red-50 border-red-200', label: 'Cancelled' },
  confirmed: { icon: CheckCircle, color: 'text-blue-600 bg-blue-50 border-blue-200', label: 'Confirmed' },
  hold: { icon: AlertCircle, color: 'text-orange-600 bg-orange-50 border-orange-200', label: 'On Hold' },
  verification: { icon: Clock, color: 'text-purple-600 bg-purple-50 border-purple-200', label: 'Verification' },
}

interface OrderItem {
  id: string
  type: 'valuation' | 'pickup'
  brand?: string
  model?: string
  productName?: string
  category?: string
  estimatedValue?: number
  price?: number
  condition?: string
  status?: string
  createdAt?: Date | any
  pickupDate?: string
  pickupTime?: string
  cancelledAt?: Date | any
}

export default function OrderHistory() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.uid) return

      try {
        setLoading(true)
        setError(null)
        
        // Fetch both valuations and pickup requests
        const userPhone = user?.phoneNumber?.replace(/^\+91/, '') || ''
        console.log('Fetching order history for user:', user.uid, 'phone:', userPhone)
        
        const [valuations, pickupRequests] = await Promise.all([
          getUserValuationsLegacy(user.uid).catch((e) => { console.error('Valuations fetch error:', e); return [] }),
          getUserPickupRequests(user.uid, userPhone).catch((e) => { console.error('Pickup requests fetch error:', e); return [] }),
        ])
        
        console.log('Order history - valuations:', valuations.length, 'pickup requests:', pickupRequests.length)

        // Combine and sort by date - include ALL orders (including cancelled)
        const allOrders: OrderItem[] = [
          ...valuations.map(v => ({
            id: v.id || '',
            type: 'valuation' as const,
            brand: v.brand,
            model: v.model,
            category: v.category,
            estimatedValue: v.estimatedValue,
            condition: v.condition,
            status: v.status,
            createdAt: v.createdAt,
          })),
          ...pickupRequests.map(pr => ({
            id: pr.id,
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
          const aDate = a.createdAt instanceof Date 
            ? a.createdAt.getTime() 
            : (a.createdAt as any)?.toDate?.()?.getTime() || 0
          const bDate = b.createdAt instanceof Date 
            ? b.createdAt.getTime() 
            : (b.createdAt as any)?.toDate?.()?.getTime() || 0
          return bDate - aDate
        })

        setOrders(allOrders)
      } catch (err: any) {
        setError(err.message || 'Failed to load order history')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [user?.uid])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-brand-lime border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
        <p className="text-gray-600 mb-6">Start trading in your devices to see your order history here.</p>
        <Link
          href="/#trade-in"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-lime text-brand-blue-900 rounded-lg font-semibold hover:bg-brand-lime-400 transition-colors"
        >
          Start Trading
        </Link>
      </div>
    )
  }

  const formatDate = (date: Date | any) => {
    if (!date) return 'N/A'
    const d = date?.toDate ? date.toDate() : new Date(date)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Order History</h2>
        <span className="text-sm text-gray-500">{orders.length} {orders.length === 1 ? 'order' : 'orders'}</span>
      </div>

      <div className="space-y-3">
        {orders.map((order, index) => {
          const status = (order.status || 'pending') as StatusType
          const StatusIcon = statusConfig[status]?.icon || Clock
          const statusStyle = statusConfig[status] || statusConfig.pending

          return (
            <motion.div
              key={order.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
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
                      {order.type === 'valuation' && (
                        <p className="text-sm text-gray-500 capitalize">{order.category}</p>
                      )}
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold ${statusStyle.color}`}>
                      <StatusIcon className="w-4 h-4" />
                      {statusStyle.label}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 mb-1">Order ID</p>
                      <p className="font-mono text-xs text-gray-900">{order.id?.substring(0, 8)}...</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">{order.type === 'pickup' ? 'Price' : 'Estimated Value'}</p>
                      <p className="font-semibold text-gray-900 flex items-center gap-1">
                        <IndianRupee className="w-4 h-4" />
                        {(order.type === 'pickup' ? order.price : order.estimatedValue)?.toLocaleString('en-IN') || 'N/A'}
                      </p>
                    </div>
                    {order.type === 'valuation' && (
                      <div>
                        <p className="text-gray-500 mb-1">Condition</p>
                        <p className="text-gray-900 capitalize">{order.condition || 'N/A'}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-500 mb-1">Date</p>
                      <p className="text-gray-900 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col gap-2">
                  {order.id && order.type === 'valuation' && (
                    <Link
                      href={`/order-summary?id=${order.id}`}
                      className="px-4 py-2 text-sm font-medium text-brand-blue-600 hover:text-brand-blue-700 border border-brand-blue-200 rounded-lg hover:bg-brand-blue-50 transition-colors text-center"
                    >
                      View Details
                    </Link>
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
