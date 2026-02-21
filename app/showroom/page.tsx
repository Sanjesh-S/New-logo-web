'use client'

import { useEffect, useState } from 'react'
import { useShowroom } from '@/components/showroom/ShowroomGuard'
import { subscribeToShowroomWalkIns, type ShowroomWalkIn } from '@/lib/firebase/database'
import { signOut } from '@/lib/firebase/auth'
import Link from 'next/link'

export default function ShowroomDashboard() {
  const showroom = useShowroom()
  const [walkIns, setWalkIns] = useState<ShowroomWalkIn[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'today' | 'pending' | 'completed'>('today')

  useEffect(() => {
    if (!showroom?.showroomId) { setLoading(false); return }
    const unsub = subscribeToShowroomWalkIns((data) => {
      setWalkIns(data)
      setLoading(false)
    }, showroom.showroomId)
    return () => unsub()
  }, [showroom?.showroomId])

  const today = new Date().toDateString()
  const todayWalkIns = walkIns.filter(w => {
    const d = w.createdAt instanceof Date ? w.createdAt : (w.createdAt as any)?.toDate?.()
    return d && d.toDateString() === today
  })
  const pendingQC = walkIns.filter(w => w.status === 'pending_qc' || w.status === 'qc_review')
  const completed = walkIns.filter(w => ['service_station', 'showroom', 'warehouse', 'completed'].includes(w.status))

  const displayList = tab === 'today' ? todayWalkIns : tab === 'pending' ? pendingQC : completed

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-amber-600 text-white px-4 py-4 shadow-lg">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="text-lg font-bold">Showroom</h1>
            <p className="text-amber-100 text-sm">{showroom?.showroomName}</p>
          </div>
          <button onClick={() => signOut()} className="text-sm bg-amber-500 px-3 py-1.5 rounded-lg hover:bg-amber-400 transition-colors">Logout</button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
            <p className="text-xl font-bold text-amber-600">{todayWalkIns.length}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Today</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
            <p className="text-xl font-bold text-indigo-600">{pendingQC.length}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Pending QC</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
            <p className="text-xl font-bold text-emerald-600">{completed.length}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Completed</p>
          </div>
        </div>

        <Link href="/showroom/walk-in" className="block w-full text-center bg-amber-600 text-white py-3 rounded-xl font-semibold hover:bg-amber-700 transition-colors shadow-md">
          + New Walk-in
        </Link>

        <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100">
          {(['today', 'pending', 'completed'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t ? 'bg-amber-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              {t === 'today' ? 'Today' : t === 'pending' ? 'Pending QC' : 'Completed'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-200 border-t-amber-600"></div>
          </div>
        ) : displayList.length === 0 ? (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
            <p className="text-gray-500">No walk-ins in this category</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayList.map(w => (
              <WalkInCard key={w.id} walkIn={w} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function WalkInCard({ walkIn }: { walkIn: ShowroomWalkIn }) {
  const statusColors: Record<string, string> = {
    pending_qc: 'bg-amber-100 text-amber-700',
    qc_review: 'bg-indigo-100 text-indigo-700',
    service_station: 'bg-purple-100 text-purple-700',
    showroom: 'bg-sky-100 text-sky-700',
    warehouse: 'bg-slate-100 text-slate-700',
    completed: 'bg-emerald-100 text-emerald-700',
  }

  const statusLabels: Record<string, string> = {
    pending_qc: 'Pending QC',
    qc_review: 'QC Review',
    service_station: 'Service Station',
    showroom: 'Showroom',
    warehouse: 'Warehouse',
    completed: 'Completed',
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{walkIn.orderId || walkIn.id}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[walkIn.status] || 'bg-gray-100 text-gray-700'}`}>
          {statusLabels[walkIn.status] || walkIn.status}
        </span>
      </div>
      <h3 className="font-medium text-gray-900 text-sm">{walkIn.product.name}</h3>
      <p className="text-xs text-gray-500">{walkIn.product.brand} &middot; {walkIn.product.category}</p>
      <div className="flex justify-between items-center mt-2">
        <p className="text-sm text-gray-700">{walkIn.customer.name}</p>
        <p className="font-semibold text-gray-900">₹{walkIn.manualPrice.toLocaleString('en-IN')}</p>
      </div>
    </div>
  )
}
