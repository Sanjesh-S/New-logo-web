'use client'

import { useEffect, useState } from 'react'
import { getOrdersForQC, type PickupRequest, type ShowroomWalkIn } from '@/lib/firebase/database'
import { signOut } from '@/lib/firebase/auth'
import Link from 'next/link'

type QCItem = { type: 'pickup' | 'showroom_walkin'; data: PickupRequest | ShowroomWalkIn }

export default function QCDashboard() {
  const [items, setItems] = useState<QCItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pickup' | 'showroom_walkin'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const loadItems = async () => {
    setLoading(true)
    try {
      const data = await getOrdersForQC()
      setItems(data)
    } catch (error) {
      console.error('Error loading QC items:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadItems() }, [])

  const filtered = items.filter(item => {
    if (filter !== 'all' && item.type !== filter) return false
    if (!searchTerm.trim()) return true
    const q = searchTerm.toLowerCase()
    if (item.type === 'pickup') {
      const d = item.data as PickupRequest
      return (d.orderId || d.id || '').toLowerCase().includes(q) ||
        (d.productName || '').toLowerCase().includes(q) ||
        (d.customer?.name || '').toLowerCase().includes(q)
    } else {
      const d = item.data as ShowroomWalkIn
      return (d.orderId || d.id || '').toLowerCase().includes(q) ||
        (d.product?.name || '').toLowerCase().includes(q) ||
        (d.customer?.name || '').toLowerCase().includes(q)
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-indigo-600 text-white px-4 py-4 shadow-lg">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div>
            <h1 className="text-lg font-bold">QC Dashboard</h1>
            <p className="text-indigo-200 text-sm">{items.length} item{items.length !== 1 ? 's' : ''} pending review</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadItems} className="p-2 bg-indigo-500 rounded-lg hover:bg-indigo-400 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
            <button onClick={() => signOut()} className="text-sm bg-indigo-500 px-3 py-1.5 rounded-lg hover:bg-indigo-400 transition-colors">Logout</button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Search by Order ID, product, or customer..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
          </div>
          <div className="flex bg-white rounded-lg border border-gray-200 p-1">
            {(['all', 'pickup', 'showroom_walkin'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${filter === f ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                {f === 'all' ? 'All' : f === 'pickup' ? 'Pickups' : 'Showroom'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-gray-500 font-medium">No items pending QC review</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map(item => (
              <QCItemCard key={item.data.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function QCItemCard({ item }: { item: QCItem }) {
  const isPickup = item.type === 'pickup'
  const data = item.data

  let orderId: string, productName: string, customerName: string, price: number, photos: string[]
  if (isPickup) {
    const p = data as PickupRequest
    orderId = p.orderId || p.id
    productName = p.productName || 'N/A'
    customerName = p.customer?.name || p.userName || 'N/A'
    price = p.price || 0
    photos = []
  } else {
    const w = data as ShowroomWalkIn
    orderId = w.orderId || w.id || ''
    productName = w.product?.name || 'N/A'
    customerName = w.customer?.name || 'N/A'
    price = w.manualPrice || 0
    photos = w.devicePhotos || []
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{orderId}</span>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isPickup ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'}`}>
          {isPickup ? 'Online Pickup' : 'Showroom'}
        </span>
      </div>
      {photos.length > 0 && (
        <div className="flex gap-1 mb-3 overflow-x-auto">
          {photos.slice(0, 3).map((url, i) => (
            <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 shrink-0">
              <img src={url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
          {photos.length > 3 && <span className="flex items-center text-xs text-gray-500 ml-1">+{photos.length - 3}</span>}
        </div>
      )}
      <h3 className="font-medium text-gray-900">{productName}</h3>
      <div className="flex justify-between items-center mt-2">
        <p className="text-sm text-gray-600">{customerName}</p>
        <p className="font-semibold text-gray-900">₹{price.toLocaleString('en-IN')}</p>
      </div>
      <Link
        href={`/qc/review/${orderId}?type=${item.type}&docId=${data.id}`}
        className="mt-3 block w-full text-center bg-indigo-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors"
      >
        Review
      </Link>
    </div>
  )
}
