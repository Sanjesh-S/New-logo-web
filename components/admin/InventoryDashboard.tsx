'use client'

import { useState, useEffect, useCallback } from 'react'
import { type InventoryItem, type StockMovement, type InventoryLocation, type Showroom } from '@/lib/firebase/database'
import { useAuth } from '@/contexts/AuthContext'
import { checkStaffRole } from '@/lib/firebase/database'

const LOCATION_LABELS: Record<string, string> = {
  service_station: 'Service Station',
  showroom: 'Showroom',
  warehouse: 'Warehouse',
}

const LOCATION_COLORS: Record<string, string> = {
  service_station: 'bg-purple-100 text-purple-700',
  showroom: 'bg-sky-100 text-sky-700',
  warehouse: 'bg-slate-100 text-slate-700',
}

const STATUS_LABELS: Record<string, string> = {
  in_stock: 'In Stock',
  in_repair: 'In Repair',
  sold: 'Sold',
  transferred: 'Transferred',
  returned: 'Returned',
}

export default function InventoryDashboard() {
  const { user } = useAuth()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [stats, setStats] = useState<{ total: number; byLocation: Record<string, number>; byStatus: Record<string, number> }>({ total: 0, byLocation: {}, byStatus: {} })
  const [showrooms, setShowrooms] = useState<Showroom[]>([])
  const [loading, setLoading] = useState(true)

  const [locationFilter, setLocationFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [view, setView] = useState<'stock' | 'movements' | 'aging'>('stock')

  const [movements, setMovements] = useState<StockMovement[]>([])
  const [movementsLoading, setMovementsLoading] = useState(false)

  const [transferItem, setTransferItem] = useState<InventoryItem | null>(null)
  const [transferLocation, setTransferLocation] = useState<InventoryLocation>('warehouse')
  const [transferShowroomId, setTransferShowroomId] = useState('')
  const [transferNotes, setTransferNotes] = useState('')
  const [transferring, setTransferring] = useState(false)

  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null)
  const [detailMovements, setDetailMovements] = useState<StockMovement[]>([])

  const loadInventory = useCallback(async () => {
    setLoading(true)
    try {
      const [itemsRes, statsRes, showroomRes] = await Promise.all([
        fetch('/api/admin/inventory?action=list').then(r => r.json()),
        fetch('/api/admin/inventory?action=stats').then(r => r.json()),
        fetch('/api/admin/showrooms').then(r => r.json()),
      ])
      setItems(itemsRes.items || [])
      setStats(statsRes.total !== undefined ? statsRes : { total: 0, byLocation: {}, byStatus: {} })
      setShowrooms((showroomRes.showrooms || []).filter((s: Showroom) => s.isActive))
    } catch (err) {
      console.error('Error loading inventory:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadInventory() }, [loadInventory])

  useEffect(() => {
    if (view === 'movements') {
      setMovementsLoading(true)
      fetch('/api/admin/inventory?action=movements')
        .then(r => r.json())
        .then(data => { setMovements(data.movements || []); setMovementsLoading(false) })
        .catch(() => setMovementsLoading(false))
    }
  }, [view])

  useEffect(() => {
    if (detailItem?.id) {
      fetch(`/api/admin/inventory?action=movements&inventoryId=${detailItem.id}`)
        .then(r => r.json())
        .then(data => setDetailMovements(data.movements || []))
        .catch(() => setDetailMovements([]))
    }
  }, [detailItem])

  const filtered = items.filter(item => {
    if (locationFilter !== 'all' && item.currentLocation !== locationFilter) return false
    if (statusFilter !== 'all' && item.status !== statusFilter) return false
    if (!searchTerm.trim()) return true
    const q = searchTerm.toLowerCase()
    return (item.serialNumber || '').toLowerCase().includes(q) ||
      (item.orderId || '').toLowerCase().includes(q) ||
      (item.productName || '').toLowerCase().includes(q) ||
      (item.brand || '').toLowerCase().includes(q)
  })

  const getDaysInStock = (item: InventoryItem): number => {
    const stockIn = item.stockInDate instanceof Date
      ? item.stockInDate
      : (item.stockInDate as any)?.toDate?.()
        || (item.stockInDate as any)?._seconds ? new Date((item.stockInDate as any)._seconds * 1000) : null
    if (!stockIn) {
      const created = item.createdAt instanceof Date
        ? item.createdAt
        : (item.createdAt as any)?.toDate?.()
          || (item.createdAt as any)?._seconds ? new Date((item.createdAt as any)._seconds * 1000) : null
      if (!created) return 0
      return Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24))
    }
    return Math.floor((Date.now() - stockIn.getTime()) / (1000 * 60 * 60 * 24))
  }

  const agingBuckets = {
    '0-7 days': filtered.filter(i => getDaysInStock(i) <= 7).length,
    '8-14 days': filtered.filter(i => { const d = getDaysInStock(i); return d > 7 && d <= 14 }).length,
    '15-30 days': filtered.filter(i => { const d = getDaysInStock(i); return d > 14 && d <= 30 }).length,
    '30+ days': filtered.filter(i => getDaysInStock(i) > 30).length,
  }

  const handleTransfer = async () => {
    if (!transferItem?.id || !user) return
    setTransferring(true)
    try {
      const role = await checkStaffRole({ email: user.email, phoneNumber: user.phoneNumber })
      const performedBy = role?.staffDoc?.id || user.uid
      const performedByName = role?.staffDoc?.name || 'Admin'
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transfer',
          id: transferItem.id,
          toLocation: transferLocation,
          toShowroomId: transferLocation === 'showroom' ? transferShowroomId : undefined,
          reason: 'manual_transfer',
          performedBy,
          performedByName,
          notes: transferNotes,
        }),
      })
      if (!res.ok) throw new Error('Transfer failed')
      setTransferItem(null)
      setTransferNotes('')
      loadInventory()
    } catch (err) {
      console.error('Transfer failed:', err)
      alert('Transfer failed')
    } finally {
      setTransferring(false)
    }
  }

  const handleStockOut = async (item: InventoryItem, reason: string) => {
    if (!item.id || !user) return
    try {
      const role = await checkStaffRole({ email: user.email, phoneNumber: user.phoneNumber })
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'stock_out',
          id: item.id,
          reason,
          performedBy: role?.staffDoc?.id || user.uid,
          performedByName: role?.staffDoc?.name || 'Admin',
        }),
      })
      if (!res.ok) throw new Error('Stock out failed')
      loadInventory()
    } catch (err) {
      console.error('Stock out failed:', err)
    }
  }

  const formatDate = (d: any): string => {
    if (!d) return '—'
    if (d instanceof Date) return d.toLocaleDateString('en-IN')
    if (d?.toDate) return d.toDate().toLocaleDateString('en-IN')
    if (d?._seconds) return new Date(d._seconds * 1000).toLocaleDateString('en-IN')
    if (d?.seconds) return new Date(d.seconds * 1000).toLocaleDateString('en-IN')
    return '—'
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total In Stock</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        {(['service_station', 'showroom', 'warehouse'] as const).map(loc => (
          <div key={loc} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">{LOCATION_LABELS[loc]}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.byLocation[loc] || 0}</p>
          </div>
        ))}
      </div>

      <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100">
        {(['stock', 'movements', 'aging'] as const).map(v => (
          <button key={v} onClick={() => setView(v)} className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${view === v ? 'bg-brand-blue-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
            {v === 'stock' ? 'Stock Register' : v === 'movements' ? 'Movement Log' : 'Aging Report'}
          </button>
        ))}
      </div>

      {view === 'stock' && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" placeholder="Search serial, order ID, product..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 outline-none" />
              </div>
              <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-lg bg-white outline-none">
                <option value="all">All Locations</option>
                {Object.entries(LOCATION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-lg bg-white outline-none">
                <option value="all">All Statuses</option>
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-blue-200 border-t-brand-blue-600"></div></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order ID</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Serial</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Days</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Price</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500">No inventory items found</td></tr>
                    ) : filtered.map(item => {
                      const days = getDaysInStock(item)
                      return (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 text-sm font-mono text-gray-600">{item.orderId}</td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-900">{item.serialNumber}</td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                            <div className="text-xs text-gray-500">{item.brand} &middot; {item.category}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${LOCATION_COLORS[item.currentLocation] || 'bg-gray-100 text-gray-700'}`}>
                              {LOCATION_LABELS[item.currentLocation] || item.currentLocation}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{STATUS_LABELS[item.status] || item.status}</td>
                          <td className="px-4 py-3">
                            <span className={`text-sm font-medium ${days > 30 ? 'text-red-600' : days > 14 ? 'text-amber-600' : 'text-gray-700'}`}>{days}d</span>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">₹{item.agreedPrice.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => setDetailItem(item)} className="text-xs text-brand-blue-600 hover:text-brand-blue-800 font-medium px-2 py-1">History</button>
                              {item.status === 'in_stock' && (
                                <>
                                  <button onClick={() => { setTransferItem(item); setTransferLocation('warehouse') }} className="text-xs text-purple-600 hover:text-purple-800 font-medium px-2 py-1">Transfer</button>
                                  <button onClick={() => handleStockOut(item, 'sold')} className="text-xs text-emerald-600 hover:text-emerald-800 font-medium px-2 py-1">Sold</button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {view === 'movements' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {movementsLoading ? (
            <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-blue-200 border-t-brand-blue-600"></div></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Serial</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">From</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">To</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">By</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {movements.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500">No movements recorded</td></tr>
                  ) : movements.map((m: any) => {
                    const typeColor = m.type === 'stock_in' ? 'bg-emerald-100 text-emerald-700' : m.type === 'stock_out' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    return (
                      <tr key={m.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(m.createdAt)}</td>
                        <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeColor}`}>{m.type.replace('_', ' ')}</span></td>
                        <td className="px-4 py-3 text-sm text-gray-900">{m.productName}</td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-600">{m.serialNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{m.fromLocation ? (LOCATION_LABELS[m.fromLocation] || m.fromLocation) : '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{m.toLocation ? (LOCATION_LABELS[m.toLocation] || m.toLocation) : '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{m.performedByName}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{m.reason}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {view === 'aging' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(agingBuckets).map(([label, count]) => {
              const isDanger = label === '30+ days'
              const isWarning = label === '15-30 days'
              return (
                <div key={label} className={`rounded-xl p-5 shadow-sm border ${isDanger ? 'bg-red-50 border-red-200' : isWarning ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'}`}>
                  <p className={`text-sm ${isDanger ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-gray-500'}`}>{label}</p>
                  <p className={`text-3xl font-bold mt-1 ${isDanger ? 'text-red-700' : isWarning ? 'text-amber-700' : 'text-gray-900'}`}>{count}</p>
                </div>
              )
            })}
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Items Over 14 Days</h3>
            <div className="space-y-2">
              {filtered.filter(i => getDaysInStock(i) > 14).map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900 text-sm">{item.productName}</span>
                    <span className="text-gray-500 text-xs ml-2">SN: {item.serialNumber}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${LOCATION_COLORS[item.currentLocation]}`}>{LOCATION_LABELS[item.currentLocation]}</span>
                    <span className={`font-semibold text-sm ${getDaysInStock(item) > 30 ? 'text-red-600' : 'text-amber-600'}`}>{getDaysInStock(item)}d</span>
                  </div>
                </div>
              ))}
              {filtered.filter(i => getDaysInStock(i) > 14).length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No items over 14 days</p>
              )}
            </div>
          </div>
        </div>
      )}

      {transferItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-gray-900 text-lg">Transfer Device</h3>
            <p className="text-sm text-gray-600 mt-1">{transferItem.productName} (SN: {transferItem.serialNumber})</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                <select value={transferLocation} onChange={e => setTransferLocation(e.target.value as InventoryLocation)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white outline-none">
                  {Object.entries(LOCATION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              {transferLocation === 'showroom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Showroom</label>
                  <select value={transferShowroomId} onChange={e => setTransferShowroomId(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white outline-none">
                    <option value="">Select showroom</option>
                    {showrooms.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={transferNotes} onChange={e => setTransferNotes(e.target.value)} rows={2} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg outline-none resize-none" placeholder="Reason for transfer..." />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setTransferItem(null)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleTransfer} disabled={transferring || (transferLocation === 'showroom' && !transferShowroomId)} className="flex-1 py-2.5 bg-brand-blue-900 text-white rounded-lg font-medium hover:bg-brand-blue-800 disabled:opacity-50">
                {transferring ? 'Transferring...' : 'Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{detailItem.productName}</h3>
                <p className="text-sm text-gray-500">SN: {detailItem.serialNumber}</p>
              </div>
              <button onClick={() => setDetailItem(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Order</span><span className="font-mono">{detailItem.orderId}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Location</span><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${LOCATION_COLORS[detailItem.currentLocation]}`}>{LOCATION_LABELS[detailItem.currentLocation]}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Status</span><span>{STATUS_LABELS[detailItem.status]}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Price</span><span className="font-semibold">₹{detailItem.agreedPrice.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Days in Stock</span><span className="font-semibold">{getDaysInStock(detailItem)}d</span></div>
            </div>
            <h4 className="font-semibold text-gray-900 mb-3">Movement History</h4>
            {detailMovements.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No movements recorded</p>
            ) : (
              <div className="space-y-2">
                {detailMovements.map((m: any) => (
                  <div key={m.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">{m.type.replace('_', ' ')}</span>
                      <span className="text-xs text-gray-500">{formatDate(m.createdAt)}</span>
                    </div>
                    <p className="text-gray-600 text-xs mt-1">
                      {m.fromLocation ? `${LOCATION_LABELS[m.fromLocation] || m.fromLocation} → ` : ''}
                      {m.toLocation ? (LOCATION_LABELS[m.toLocation] || m.toLocation) : 'Out'}
                    </p>
                    {m.notes && <p className="text-gray-500 text-xs mt-0.5">{m.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
