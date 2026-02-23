'use client'

import { useEffect, useState } from 'react'
import { subscribeToPickupRequests, updatePickupRequest, type PickupRequest, type ShowroomWalkIn, type StaffUser } from '@/lib/firebase/database'
import { signOut } from '@/lib/firebase/auth'
import Link from 'next/link'
import AssessmentViewModal from '@/components/admin/AssessmentViewModal'

type QCItem = { type: 'pickup' | 'showroom_walkin'; data: PickupRequest | ShowroomWalkIn }
type Tab = 'pickup_requests' | 'review'

export default function QCDashboard() {
  const [tab, setTab] = useState<Tab>('pickup_requests')
  const [pickupRequests, setPickupRequests] = useState<PickupRequest[]>([])
  const [pickupReady, setPickupReady] = useState(false)
  const [pickupAgents, setPickupAgents] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [reviewFilter, setReviewFilter] = useState<'all' | 'pickup' | 'showroom_walkin'>('all')
  const [assessmentModalRequest, setAssessmentModalRequest] = useState<PickupRequest | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeToPickupRequests((data) => {
      setPickupRequests(data)
      setPickupReady(true)
    })
    return () => unsubscribe()
  }, [])

  const loadAgents = async () => {
    setLoading(true)
    try {
      const staffRes = await fetch('/api/admin/staff').then(r => r.json())
      const agents = (staffRes.staff || []).filter((s: StaffUser) => s.role === 'pickup_agent' && s.isActive)
      setPickupAgents(agents)
    } catch (error) {
      console.error('Error loading agents:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAgents() }, [])

  const activePickupRequests = pickupRequests.filter(r => r.status !== 'cancelled')
  const pendingCount = activePickupRequests.filter(r => r.status === 'pending').length

  const reviewItems: QCItem[] = pickupRequests
    .filter(r => r.status === 'picked_up' || r.status === 'qc_review')
    .map(r => ({ type: 'pickup' as const, data: r }))

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/qc/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status: newStatus }),
      })
      if (!res.ok) {
        alert('Failed to update status')
      }
    } catch (err) {
      console.error('Error updating status:', err)
      alert('Failed to update status')
    }
  }

  const handleAssignAgent = async (requestId: string, agentId: string) => {
    const agent = pickupAgents.find(a => a.id === agentId)
    try {
      const res = await fetch('/api/qc/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          agentId: agentId || '',
          agentName: agent?.name || '',
          assignedByRole: 'qc_team',
          assignedByName: 'QC Team',
        }),
      })
      if (!res.ok) {
        alert('Failed to assign agent')
      }
    } catch (err) {
      console.error('Error assigning agent:', err)
    }
  }

  const handleRemarksChange = async (requestId: string, remarks: string) => {
    try {
      await updatePickupRequest(requestId, { remarks })
    } catch (err) {
      console.error('Error saving remarks:', err)
    }
  }

  const filteredPickupRequests = activePickupRequests.filter((request) => {
    const status = request.status || 'pending'
    const matchesStatus = statusFilter === 'All' || status === statusFilter
    if (!matchesStatus) return false
    const q = searchTerm.trim().toLowerCase()
    if (!q) return true
    const orderId = request.orderId || request.id || ''
    const productName = request.productName || request.device?.productName || ''
    const customerName = request.customer?.name || request.userName || ''
    const customerPhone = request.customer?.phone || request.userPhone || ''
    const customerEmail = request.customer?.email || request.userEmail || ''
    return orderId.toLowerCase().includes(q) ||
      productName.toLowerCase().includes(q) ||
      customerName.toLowerCase().includes(q) ||
      customerPhone.toLowerCase().includes(q) ||
      customerEmail.toLowerCase().includes(q)
  })

  const filteredReview = reviewItems.filter(item => {
    if (reviewFilter !== 'all' && item.type !== reviewFilter) return false
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

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string }> = {
      pending: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
      confirmed: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
      assigned: { bg: 'bg-cyan-50 border-cyan-200', text: 'text-cyan-700' },
      picked_up: { bg: 'bg-teal-50 border-teal-200', text: 'text-teal-700' },
      qc_review: { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700' },
      service_station: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
      showroom: { bg: 'bg-sky-50 border-sky-200', text: 'text-sky-700' },
      warehouse: { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-700' },
      completed: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
      hold: { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
      verification: { bg: 'bg-violet-50 border-violet-200', text: 'text-violet-700' },
      reject: { bg: 'bg-red-50 border-red-200', text: 'text-red-700' },
      suspect: { bg: 'bg-pink-50 border-pink-200', text: 'text-pink-700' },
    }
    return configs[status] || { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-700' }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-indigo-600 text-white px-4 py-4 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-lg font-bold">QC Dashboard</h1>
            <div className="flex gap-4 text-sm mt-1">
              <span className="text-indigo-200">{activePickupRequests.length} total requests</span>
              {pendingCount > 0 && <span className="text-amber-300">{pendingCount} pending</span>}
              <span className="text-indigo-200">{reviewItems.length} ready for review</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadAgents} className="p-2 bg-indigo-500 rounded-lg hover:bg-indigo-400 transition-colors" title="Refresh">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
            <button onClick={() => signOut()} className="text-sm bg-indigo-500 px-3 py-1.5 rounded-lg hover:bg-indigo-400 transition-colors">Logout</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex">
          <button
            onClick={() => { setTab('pickup_requests'); setSearchTerm(''); setStatusFilter('All') }}
            className={`flex-1 py-3.5 text-sm font-semibold text-center border-b-2 transition-colors ${tab === 'pickup_requests' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Pickup Requests
            <span className={`ml-2 inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full text-xs font-bold ${tab === 'pickup_requests' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
              {activePickupRequests.length}
            </span>
          </button>
          <button
            onClick={() => { setTab('review'); setSearchTerm('') }}
            className={`flex-1 py-3.5 text-sm font-semibold text-center border-b-2 transition-colors ${tab === 'review' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Ready for Review
            {reviewItems.length > 0 && (
              <span className={`ml-2 inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full text-xs font-bold ${tab === 'review' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                {reviewItems.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {tab === 'pickup_requests' && (
          <div>
            {/* Search + Status Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" placeholder="Search by Order ID, product, customer..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm">
                <option value="All">All statuses</option>
                <optgroup label="Pre-pickup">
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="assigned">Assigned</option>
                  <option value="hold">Hold</option>
                  <option value="verification">Verification</option>
                  <option value="reject">Reject</option>
                  <option value="suspect">Suspect</option>
                </optgroup>
                <optgroup label="After pickup">
                  <option value="picked_up">Picked Up</option>
                  <option value="qc_review">QC Review</option>
                  <option value="service_station">Service Stn</option>
                  <option value="showroom">Showroom</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="completed">Completed</option>
                </optgroup>
              </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {!pickupReady ? (
                <div className="flex flex-col justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600"></div>
                  <p className="mt-4 text-gray-500 text-sm">Connecting to live updates...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[120px]">Order ID</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[110px]">Product</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[160px]">Customer</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[80px]">Price</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[100px]">Pickup Date</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[110px]">Status</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[120px]">Assign Agent</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[90px]">Assessment</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[140px]">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredPickupRequests.map((request) => {
                        const createdAt = request.createdAt instanceof Date
                          ? request.createdAt
                          : (request.createdAt as any)?.toDate?.() || new Date()

                        const productName = request.productName || request.device?.productName || 'N/A'
                        const price = request.price || request.device?.adjustedPrice || 0
                        const customerName = request.customer?.name || request.userName || 'N/A'
                        const customerPhone = request.customer?.phone || request.userPhone || 'N/A'
                        const customerEmail = request.customer?.email || request.userEmail || 'N/A'
                        const address = request.customer?.address || request.pickupAddress || ''
                        const city = request.customer?.city || ''
                        const state = request.customer?.state || request.state || ''
                        const pincode = request.customer?.pincode || ''
                        const pickupDate = request.pickupDate ? new Date(request.pickupDate) : null
                        const status = request.status || 'pending'
                        const statusConfig = getStatusConfig(status)

                        const isCustomOrderId = (id: string | null | undefined) =>
                          id && /^[A-Z]{2}\d/.test(id)
                        const displayOrderId =
                          request.orderId ||
                          (isCustomOrderId(request.valuationId) ? request.valuationId : null) ||
                          request.id
                        const isLegacy = !request.orderId && !isCustomOrderId(request.valuationId)

                        return (
                          <tr key={request.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-3 py-3">
                              <div className="space-y-0.5">
                                <div className={`text-xs font-mono ${isLegacy ? 'text-gray-600' : 'text-gray-900 font-semibold'}`}>
                                  {displayOrderId}
                                </div>
                                {isLegacy && (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Legacy</span>
                                )}
                                <div className="text-[10px] text-gray-400">
                                  {createdAt.toLocaleDateString('en-IN')}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <div className="font-medium text-gray-900 text-xs">{productName}</div>
                              {request.device?.accessories && request.device.accessories.length > 0 && (
                                <div className="text-[10px] text-gray-500 mt-0.5">+{request.device.accessories.length} acc.</div>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              <div className="space-y-0.5">
                                <div className="font-medium text-gray-900 text-xs">{customerName}</div>
                                <div className="text-xs text-gray-500">{customerPhone}</div>
                                {customerEmail !== 'N/A' && (
                                  <div className="text-[10px] text-gray-400 truncate max-w-[150px]">{customerEmail}</div>
                                )}
                                {address && (
                                  <div className="text-[10px] text-gray-500 max-w-[150px] line-clamp-2">{typeof address === 'string' ? address : ''}</div>
                                )}
                                {(city || state || pincode) && (
                                  <div className="text-[10px] text-gray-400">{city && `${city}, `}{state}{pincode && ` - ${pincode}`}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <span className="font-semibold text-gray-900 text-sm">₹{price.toLocaleString('en-IN')}</span>
                            </td>
                            <td className="px-3 py-3">
                              {pickupDate ? (
                                <div className="space-y-0.5">
                                  <div className="font-medium text-gray-900 text-xs">
                                    {pickupDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                                  </div>
                                  {request.pickupTime && (
                                    <div className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded inline-block">{request.pickupTime}</div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 italic">Not set</span>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              <select
                                value={status}
                                onChange={(e) => handleStatusChange(request.id, e.target.value)}
                                className={`text-[11px] font-semibold rounded-md px-2 py-1 border ${statusConfig.bg} ${statusConfig.text} focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer`}
                              >
                                {(['picked_up', 'qc_review', 'service_station', 'showroom', 'warehouse', 'completed'].includes(status)
                                  ? (
                                    <>
                                      <option value="picked_up">Picked Up</option>
                                      <option value="qc_review">QC Review</option>
                                      <option value="service_station">Service Stn</option>
                                      <option value="showroom">Showroom</option>
                                      <option value="warehouse">Warehouse</option>
                                      <option value="completed">Completed</option>
                                      <option value="hold">Hold</option>
                                      <option value="reject">Reject</option>
                                    </>
                                  )
                                  : (
                                    <>
                                      <option value="pending">Pending</option>
                                      <option value="confirmed">Confirmed</option>
                                      {status === 'assigned' && <option value="assigned">Assigned</option>}
                                      <option value="hold">Hold</option>
                                      <option value="verification">Verification</option>
                                      <option value="reject">Reject</option>
                                      <option value="suspect">Suspect</option>
                                    </>
                                  )
                                )}
                              </select>
                            </td>
                            <td className="px-3 py-3">
                              {status === 'pending' ? (
                                <span className="text-[10px] text-gray-400 italic">Confirm first</span>
                              ) : pickupAgents.length > 0 ? (
                                <div className="space-y-0.5">
                                  <select
                                    value={request.assignedTo || ''}
                                    onChange={(e) => handleAssignAgent(request.id, e.target.value)}
                                    className="text-[11px] rounded-md px-2 py-1 border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white w-full"
                                  >
                                    <option value="">Unassigned</option>
                                    {pickupAgents.map(agent => (
                                      <option key={agent.id} value={agent.id}>{agent.name}</option>
                                    ))}
                                  </select>
                                  {request.assignedAgentName && (
                                    <div className="space-y-0.5">
                                      <span className="text-[10px] text-cyan-600 font-medium">{request.assignedAgentName}</span>
                                      {request.assignedByRole && (
                                        <span className={`block text-[9px] font-medium ${request.assignedByRole === 'admin' ? 'text-purple-500' : 'text-indigo-500'}`}>
                                          by {request.assignedByRole === 'admin' ? 'Admin' : 'QC'}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] text-gray-400 italic">No agents</span>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              <button
                                type="button"
                                onClick={() => setAssessmentModalRequest(request)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-all border border-indigo-200"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                View
                              </button>
                            </td>
                            <td className="px-3 py-3">
                              <textarea
                                defaultValue={request.remarks || ''}
                                onBlur={(e) => handleRemarksChange(request.id, e.target.value)}
                                placeholder="Remarks..."
                                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none bg-gray-50 hover:bg-white focus:bg-white"
                                rows={2}
                              />
                            </td>
                          </tr>
                        )
                      })}
                      {filteredPickupRequests.length === 0 && (
                        <tr>
                          <td colSpan={9} className="px-6 py-16 text-center">
                            <div className="flex flex-col items-center">
                              <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                              <p className="text-gray-500 font-medium">
                                {searchTerm.trim() || statusFilter !== 'All' ? 'No requests match your filters' : 'No pickup requests'}
                              </p>
                              <p className="text-gray-400 text-sm mt-1">
                                {searchTerm.trim() || statusFilter !== 'All' ? 'Try changing search or status filter' : 'New requests appear here instantly'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'review' && (
          <div>
            {/* Search + filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" placeholder="Search by Order ID, product, or customer..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
              </div>
              <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                {(['all', 'pickup', 'showroom_walkin'] as const).map(f => (
                  <button key={f} onClick={() => setReviewFilter(f)} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${reviewFilter === f ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                    {f === 'all' ? 'All' : f === 'pickup' ? 'Pickups' : 'Showroom'}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600"></div>
              </div>
            ) : filteredReview.length === 0 ? (
              <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-gray-500 font-medium">No items pending QC review</p>
                <p className="text-gray-400 text-sm mt-1">Items will appear here after pickup agents verify devices</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredReview.map(item => (
                  <ReviewItemCard key={item.data.id} item={item} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assessment View Modal */}
      <AssessmentViewModal
        isOpen={!!assessmentModalRequest}
        onClose={() => setAssessmentModalRequest(null)}
        assessmentAnswers={
          assessmentModalRequest?.assessmentAnswers ||
          (assessmentModalRequest?.device?.assessmentAnswers as Record<string, unknown> | undefined)
        }
        valuationId={assessmentModalRequest?.valuationId ?? undefined}
        orderId={
          assessmentModalRequest
            ? (assessmentModalRequest.orderId ||
              (/^[A-Z]{2}\d/.test(assessmentModalRequest.valuationId || '')
                ? assessmentModalRequest.valuationId || undefined
                : undefined) ||
              assessmentModalRequest.id)
            : undefined
        }
        productName={assessmentModalRequest?.productName || assessmentModalRequest?.device?.productName}
      />
    </div>
  )
}

function ReviewItemCard({ item }: { item: QCItem }) {
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
        href={`/qc/review?orderId=${orderId}&type=${item.type}&docId=${data.id}`}
        className="mt-3 block w-full text-center bg-indigo-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors"
      >
        Review
      </Link>
    </div>
  )
}
