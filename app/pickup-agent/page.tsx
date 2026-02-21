'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getAgentAssignedOrders, checkStaffRole, type PickupRequest } from '@/lib/firebase/database'
import { signOut } from '@/lib/firebase/auth'
import Link from 'next/link'

export default function PickupAgentDashboard() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<PickupRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [agentName, setAgentName] = useState('')

  const loadOrders = async () => {
    if (!user) return
    setLoading(true)
    try {
      const role = await checkStaffRole({ email: user.email, phoneNumber: user.phoneNumber })
      if (role?.staffDoc?.name) setAgentName(role.staffDoc.name)

      const staffId = role?.staffDoc?.id || user.uid
      const data = await getAgentAssignedOrders(staffId)
      setOrders(data)
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadOrders() }, [user])

  const pendingOrders = orders.filter(o => o.status === 'assigned')
  const completedOrders = orders.filter(o => o.status === 'picked_up' || o.status === 'completed' || o.status === 'qc_review')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-teal-600 text-white px-4 py-4 shadow-lg">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="text-lg font-bold">Pickup Agent</h1>
            {agentName && <p className="text-teal-100 text-sm">{agentName}</p>}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadOrders} className="p-2 bg-teal-500 rounded-lg hover:bg-teal-400 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
            <button onClick={() => signOut()} className="text-sm bg-teal-500 px-3 py-1.5 rounded-lg hover:bg-teal-400 transition-colors">Logout</button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-teal-600">{pendingOrders.length}</p>
            <p className="text-xs text-gray-500 mt-1">Pending Pickups</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-emerald-600">{completedOrders.length}</p>
            <p className="text-xs text-gray-500 mt-1">Completed</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-200 border-t-teal-600"></div>
          </div>
        ) : pendingOrders.length === 0 && completedOrders.length === 0 ? (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            <p className="text-gray-500 font-medium">No assigned orders</p>
            <p className="text-gray-400 text-sm mt-1">Pull down to refresh</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingOrders.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Pending Pickups</h2>
                <div className="space-y-3">
                  {pendingOrders.map(order => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              </div>
            )}
            {completedOrders.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Completed</h2>
                <div className="space-y-3">
                  {completedOrders.map(order => (
                    <OrderCard key={order.id} order={order} completed />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function OrderCard({ order, completed }: { order: PickupRequest; completed?: boolean }) {
  const customerName = order.customer?.name || order.userName || 'N/A'
  const customerPhone = order.customer?.phone || order.userPhone || ''
  const productName = order.productName || 'N/A'
  const price = order.price || 0
  const orderId = order.orderId || order.id
  const address = order.customer?.address || order.pickupAddress || ''
  const city = order.customer?.city || ''
  const pickupDate = order.pickupDate ? new Date(order.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-4 ${completed ? 'border-gray-100 opacity-70' : 'border-teal-100'}`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{orderId}</span>
        <span className="text-sm font-semibold text-gray-900">₹{price.toLocaleString('en-IN')}</span>
      </div>
      <h3 className="font-medium text-gray-900 text-sm">{productName}</h3>
      <div className="mt-2 space-y-1">
        <p className="text-sm text-gray-700">{customerName} {customerPhone && `• ${customerPhone}`}</p>
        {address && <p className="text-xs text-gray-500 line-clamp-2">{address}{city && `, ${city}`}</p>}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{pickupDate}</span>
          {order.pickupTime && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{order.pickupTime}</span>}
        </div>
      </div>
      {!completed && (
        <Link
          href={`/pickup-agent/verify/${orderId}`}
          className="mt-3 block w-full text-center bg-teal-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-teal-700 transition-colors"
        >
          Start Verification
        </Link>
      )}
    </div>
  )
}
