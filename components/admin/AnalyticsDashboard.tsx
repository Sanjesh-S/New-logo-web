'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  Users,
  DollarSign,
  Package,
  ShoppingCart,
  BarChart3,
  Calendar,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { getAllProducts, getAllPickupRequests, getUserValuations } from '@/lib/firebase/database'
import type { Product, PickupRequest, Valuation } from '@/lib/firebase/database'

interface AnalyticsData {
  totalProducts: number
  totalValuations: number
  totalPickupRequests: number
  totalRevenue: number
  averageOrderValue: number
  conversionRate: number
  pendingOrders: number
  completedOrders: number
  rejectedOrders: number
  revenueByCategory: Record<string, number>
  ordersByStatus: Record<string, number>
  recentOrders: PickupRequest[]
  topProducts: Array<{ productId: string; productName: string; count: number }>
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      
      const [products, pickupRequests, allValuations] = await Promise.all([
        getAllProducts(),
        getAllPickupRequests(),
        // Note: getUserValuations requires userId, so we'll work with pickupRequests for now
        Promise.resolve([] as Valuation[]),
      ])

      // Calculate analytics
      const now = new Date()
      const timeRangeMs = {
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000,
        'all': Infinity,
      }[timeRange]

      const filteredRequests = pickupRequests.filter((request) => {
        if (timeRange === 'all') return true
        const createdAt = request.createdAt instanceof Date
          ? request.createdAt
          : (request.createdAt as any)?.toDate?.() || new Date()
        return now.getTime() - createdAt.getTime() <= timeRangeMs
      })

      // Calculate revenue
      const totalRevenue = filteredRequests
        .filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + (r.price || 0), 0)

      // Calculate orders by status
      const ordersByStatus: Record<string, number> = {}
      filteredRequests.forEach((request) => {
        const status = request.status || 'pending'
        ordersByStatus[status] = (ordersByStatus[status] || 0) + 1
      })

      // Calculate revenue by category (from product names)
      const revenueByCategory: Record<string, number> = {}
      filteredRequests
        .filter(r => r.status === 'completed')
        .forEach((request) => {
          // Try to infer category from product name
          const productName = request.productName || ''
          let category = 'Other'
          
          if (productName.toLowerCase().includes('camera') || productName.toLowerCase().includes('dslr')) {
            category = 'Cameras'
          } else if (productName.toLowerCase().includes('phone') || productName.toLowerCase().includes('iphone')) {
            category = 'Phones'
          } else if (productName.toLowerCase().includes('laptop') || productName.toLowerCase().includes('macbook')) {
            category = 'Laptops'
          } else if (productName.toLowerCase().includes('tablet') || productName.toLowerCase().includes('ipad')) {
            category = 'Tablets'
          }
          
          revenueByCategory[category] = (revenueByCategory[category] || 0) + (request.price || 0)
        })

      // Top products
      const productCounts: Record<string, { name: string; count: number }> = {}
      filteredRequests.forEach((request) => {
        const productName = request.productName || 'Unknown'
        if (!productCounts[productName]) {
          productCounts[productName] = { name: productName, count: 0 }
        }
        productCounts[productName].count++
      })

      const topProducts = Object.values(productCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map((p, idx) => ({
          productId: `product-${idx}`,
          productName: p.name,
          count: p.count,
        }))

      // Recent orders
      const recentOrders = [...filteredRequests]
        .sort((a, b) => {
          const aDate = a.createdAt instanceof Date
            ? a.createdAt.getTime()
            : (a.createdAt as any)?.toDate?.()?.getTime() || 0
          const bDate = b.createdAt instanceof Date
            ? b.createdAt.getTime()
            : (b.createdAt as any)?.toDate?.()?.getTime() || 0
          return bDate - aDate
        })
        .slice(0, 10)

      const completedOrders = filteredRequests.filter(r => r.status === 'completed').length
      const pendingOrders = filteredRequests.filter(r => r.status === 'pending').length
      const rejectedOrders = filteredRequests.filter(r => r.status === 'reject').length

      setAnalytics({
        totalProducts: products.length,
        totalValuations: filteredRequests.length,
        totalPickupRequests: filteredRequests.length,
        totalRevenue,
        averageOrderValue: completedOrders > 0 ? totalRevenue / completedOrders : 0,
        conversionRate: filteredRequests.length > 0
          ? (completedOrders / filteredRequests.length) * 100
          : 0,
        pendingOrders,
        completedOrders,
        rejectedOrders,
        revenueByCategory,
        ordersByStatus,
        recentOrders,
        topProducts,
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-brand-lime border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!analytics) {
    return <div className="text-center py-12 text-gray-600">No analytics data available</div>
  }

  const StatCard = ({
    title,
    value,
    icon: Icon,
    change,
    changeLabel,
  }: {
    title: string
    value: string | number
    icon: any
    change?: number
    changeLabel?: string
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-brand-blue-50 rounded-lg">
          <Icon className="w-6 h-6 text-brand-blue-600" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            change >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {change >= 0 ? (
              <ArrowUp className="w-4 h-4" />
            ) : (
              <ArrowDown className="w-4 h-4" />
            )}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm text-gray-600">{title}</p>
      {changeLabel && (
        <p className="text-xs text-gray-500 mt-1">{changeLabel}</p>
      )}
    </motion.div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Business insights and performance metrics</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-lime bg-white"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`₹${analytics.totalRevenue.toLocaleString('en-IN')}`}
          icon={DollarSign}
        />
        <StatCard
          title="Total Orders"
          value={analytics.totalPickupRequests}
          icon={ShoppingCart}
        />
        <StatCard
          title="Average Order Value"
          value={`₹${Math.round(analytics.averageOrderValue).toLocaleString('en-IN')}`}
          icon={TrendingUp}
        />
        <StatCard
          title="Conversion Rate"
          value={`${analytics.conversionRate.toFixed(1)}%`}
          icon={BarChart3}
        />
      </div>

      {/* Order Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Order Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span className="text-gray-700">Pending</span>
              </div>
              <span className="font-semibold text-gray-900">{analytics.pendingOrders}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-gray-700">Completed</span>
              </div>
              <span className="font-semibold text-gray-900">{analytics.completedOrders}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-gray-700">Rejected</span>
              </div>
              <span className="font-semibold text-gray-900">{analytics.rejectedOrders}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue by Category</h2>
          <div className="space-y-3">
            {Object.entries(analytics.revenueByCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([category, revenue]) => (
                <div key={category} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">{category}</span>
                    <span className="font-semibold text-gray-900">
                      ₹{revenue.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-lime transition-all"
                      style={{
                        width: `${
                          (revenue / analytics.totalRevenue) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </motion.div>
      </div>

      {/* Top Products */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">Top Products</h2>
        <div className="space-y-3">
          {analytics.topProducts.map((product, index) => (
            <div
              key={product.productId}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
                <span className="font-medium text-gray-900">{product.productName}</span>
              </div>
              <span className="text-gray-600">{product.count} orders</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Product</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Price</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {analytics.recentOrders.map((order) => {
                const customerName = order.customer?.name || order.userName || 'N/A'
                const customerPhone = order.customer?.phone || order.userPhone || ''
                const createdAt = order.createdAt instanceof Date
                  ? order.createdAt
                  : (order.createdAt as any)?.toDate?.() || new Date()
                
                return (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {order.productName || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      <div>{customerName}</div>
                      {customerPhone && (
                        <div className="text-xs text-gray-500">{customerPhone}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                      ₹{(order.price || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : order.status === 'reject'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {order.status || 'pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {createdAt.toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
