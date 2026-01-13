'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { getUserValuationsLegacy, type Valuation } from '@/lib/firebase/database'
import { Clock, Truck, CheckCircle, AlertCircle, Package } from 'lucide-react'
import Link from 'next/link'

export default function ActiveOrders() {
  const { user } = useAuth()
  const [activeOrders, setActiveOrders] = useState<Valuation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActiveOrders = async () => {
      if (!user?.uid) return

      try {
        setLoading(true)
        const allValuations = await getUserValuationsLegacy(user.uid)
        // Filter for pending and approved orders
        const active = allValuations.filter(
          (v) => v.status === 'pending' || v.status === 'approved'
        )
        setActiveOrders(active)
      } catch (err: any) {
        console.error('Error fetching active orders:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchActiveOrders()
  }, [user?.uid])

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
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-lime text-brand-blue-900 rounded-lg font-semibold hover:bg-brand-lime-400 transition-colors"
        >
          Start New Trade-In
        </Link>
      </div>
    )
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          text: 'Pending Review',
          description: 'Your order is being reviewed by our team',
          color: 'text-yellow-600 bg-yellow-50',
        }
      case 'approved':
        return {
          icon: Truck,
          text: 'Approved - Schedule Pickup',
          description: 'Your order is approved! Schedule a pickup time',
          color: 'text-green-600 bg-green-50',
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
          const statusInfo = getStatusInfo(order.status || 'pending')
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
                        {order.brand} {order.model}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{statusInfo.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Order ID: {order.id?.substring(0, 8)}...</span>
                        <span>₹{order.estimatedValue?.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  {order.id && (
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
