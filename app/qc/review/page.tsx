'use client'

import { useEffect, useState, Fragment } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  checkStaffRole,
  type PickupRequest, type ShowroomWalkIn, type PickupVerification, type QCDecision, type Showroom,
} from '@/lib/firebase/database'
import { ASSESSMENT_GROUPS, getAssessmentLabel, formatAnswerValue } from '@/lib/utils/assessmentLabels'

export default function QCReviewPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()

  const orderId = searchParams.get('orderId') || ''
  const sourceType = (searchParams.get('type') || 'pickup') as 'pickup' | 'showroom_walkin'
  const docId = searchParams.get('docId') || orderId

  const [pickupData, setPickupData] = useState<PickupRequest | null>(null)
  const [walkInData, setWalkInData] = useState<ShowroomWalkIn | null>(null)
  const [verification, setVerification] = useState<PickupVerification | null>(null)
  const [showrooms, setShowrooms] = useState<Showroom[]>([])
  const [assessment, setAssessment] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showAssessment, setShowAssessment] = useState(false)

  const [decision, setDecision] = useState<QCDecision | ''>('')
  const [targetShowroomId, setTargetShowroomId] = useState('')
  const [notes, setNotes] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (!orderId) { setLoading(false); return }
    const load = async () => {
      try {
        const params = new URLSearchParams({ orderId, type: sourceType, docId })
        const res = await fetch(`/api/qc/review-data?${params}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load')

        setShowrooms(data.showrooms || [])
        if (sourceType === 'pickup') {
          setPickupData(data.pickupData || null)
          setVerification(data.verification || null)
          setAssessment(data.assessment || null)
        } else {
          setWalkInData(data.walkInData || null)
        }
      } catch (err) {
        console.error('Error loading review data:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [orderId, sourceType, docId])

  const handleSubmitDecision = async () => {
    if (!decision || !user) return
    setSubmitting(true)
    try {
      const role = await checkStaffRole({ email: user.email, phoneNumber: user.phoneNumber })
      const reviewerId = role?.staffDoc?.id || user.uid
      const reviewerName = role?.staffDoc?.name || 'QC Reviewer'

      const sourceId = sourceType === 'pickup' ? (pickupData?.id || orderId) : (walkInData?.id || docId)

      const res = await fetch('/api/qc/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          sourceType,
          sourceId,
          verificationId: verification?.id,
          reviewerId,
          reviewerName,
          decision,
          targetShowroomId: decision === 'showroom' ? targetShowroomId : undefined,
          notes: notes.trim() || '',
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to submit QC review')
      }

      try {
        let customerName = '', customerPhone = '', customerEmail = '', productName = '', brand = '', category = ''
        let serialNumber = '', staffName = ''
        let agreedPrice = 0

        if (sourceType === 'pickup' && pickupData) {
          productName = pickupData.productName || ''
          serialNumber = verification?.serialNumber || ''
          agreedPrice = pickupData.price || 0
          customerName = pickupData.customer?.name || pickupData.userName || ''
          customerPhone = pickupData.customer?.phone || pickupData.userPhone || ''
          customerEmail = pickupData.customer?.email || pickupData.userEmail || ''
          staffName = verification?.agentName || ''
        } else if (walkInData) {
          productName = walkInData.product?.name || ''
          brand = walkInData.product?.brand || ''
          category = walkInData.product?.category || ''
          serialNumber = walkInData.product?.serialNumber || ''
          agreedPrice = walkInData.manualPrice || 0
          customerName = walkInData.customer?.name || ''
          customerPhone = walkInData.customer?.phone || ''
          customerEmail = walkInData.customer?.email || ''
          staffName = walkInData.staffName || ''
        }

        await fetch('/api/receipts/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId, sourceType, sourceId,
            receiptType: 'final', customerName, customerPhone, customerEmail,
            productName, brand, category, serialNumber, agreedPrice,
            staffName, qcDecision: decision, qcNotes: notes.trim(),
          }),
        })
      } catch (receiptErr) {
        console.error('Receipt generation failed:', receiptErr)
      }

      router.push('/qc?reviewed=true')
    } catch (error) {
      console.error('Error submitting QC decision:', error)
      alert('Failed to submit decision. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (!orderId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <p className="text-gray-600 font-medium">No order specified</p>
        <button onClick={() => router.back()} className="mt-4 text-indigo-600 font-medium">Go Back</button>
      </div>
    )
  }

  const isPickup = sourceType === 'pickup'
  const photos = isPickup ? (verification?.devicePhotos || []) : (walkInData?.devicePhotos || [])
  const idProof = isPickup ? verification?.customerIdProof : walkInData?.customer?.idProofPhoto
  const serial = isPickup ? (verification?.serialNumber || '') : (walkInData?.product?.serialNumber || '')
  const productName = isPickup ? (pickupData?.productName || 'N/A') : (walkInData?.product?.name || 'N/A')
  const price = isPickup ? (pickupData?.price || 0) : (walkInData?.manualPrice || 0)
  const customerName = isPickup ? (pickupData?.customer?.name || pickupData?.userName || 'N/A') : (walkInData?.customer?.name || 'N/A')
  const customerPhone = isPickup ? (pickupData?.customer?.phone || pickupData?.userPhone || '') : (walkInData?.customer?.phone || '')
  const customerAddress = isPickup ? (pickupData?.customer?.address || pickupData?.pickupAddress || '') : ''
  const customerCity = isPickup ? (pickupData?.customer?.city || '') : ''
  const agentName = verification?.agentName || ''
  const assessmentKeys = assessment ? Object.keys(assessment).filter(k => assessment[k] != null && assessment[k] !== '') : []

  const decisionConfig = {
    service_station: { label: 'Service Station', color: 'bg-purple-600 hover:bg-purple-700', icon: '\uD83D\uDD27' },
    showroom: { label: 'Ready for Showroom', color: 'bg-sky-600 hover:bg-sky-700', icon: '\uD83C\uDFEA' },
    warehouse: { label: 'Send to Warehouse', color: 'bg-slate-600 hover:bg-slate-700', icon: '\uD83D\uDCE6' },
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-indigo-600 text-white px-4 py-3 shadow-lg sticky top-0 z-10">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <button onClick={() => router.back()} className="p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex-1">
            <h1 className="font-semibold">QC Review</h1>
            <p className="text-indigo-200 text-xs">{orderId}</p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isPickup ? 'bg-teal-500/30 text-teal-100' : 'bg-amber-500/30 text-amber-100'}`}>
            {isPickup ? 'Online Pickup' : 'Showroom'}
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Product & Customer Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-semibold text-gray-900 text-lg">{productName}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{customerName}</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{'\u20B9'}{price.toLocaleString('en-IN')}</p>
          </div>
          {serial && <p className="text-sm text-gray-600 mt-2">Serial: <span className="font-mono">{serial}</span></p>}

          {/* Customer Details */}
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
            {customerPhone && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Phone</span>
                <span className="font-medium text-gray-900">{customerPhone}</span>
              </div>
            )}
            {customerAddress && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Address</span>
                <span className="font-medium text-gray-900 text-right max-w-[65%]">{customerAddress}{customerCity && `, ${customerCity}`}</span>
              </div>
            )}
            {agentName && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Pickup Agent</span>
                <span className="font-medium text-gray-900">{agentName}</span>
              </div>
            )}
          </div>

          {!isPickup && walkInData?.staffNotes && (
            <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-xs font-semibold text-amber-700 uppercase">Staff Inspection Notes</p>
              <p className="text-sm text-gray-700 mt-1">{walkInData.staffNotes}</p>
            </div>
          )}
          {isPickup && verification?.notes && (
            <div className="mt-3 p-3 bg-teal-50 rounded-lg border border-teal-100">
              <p className="text-xs font-semibold text-teal-700 uppercase">Agent Notes</p>
              <p className="text-sm text-gray-700 mt-1">{verification.notes}</p>
            </div>
          )}
        </div>

        {/* Assessment Details */}
        {isPickup && assessmentKeys.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <button onClick={() => setShowAssessment(!showAssessment)} className="w-full flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Device Assessment ({assessmentKeys.length} items)</h3>
              <svg className={`w-5 h-5 text-gray-400 transition-transform ${showAssessment ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {showAssessment && (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-4">
                {Object.entries(ASSESSMENT_GROUPS).map(([groupName, groupKeys]) => {
                  const present = groupKeys.filter(k => assessmentKeys.includes(k))
                  if (present.length === 0) return null
                  return (
                    <Fragment key={groupName}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 border-b border-gray-100 pb-1">{groupName}</p>
                      <div className="space-y-1.5">
                        {present.map(key => (
                          <div key={key} className="flex justify-between gap-3 text-sm">
                            <span className="text-gray-500">{getAssessmentLabel(key)}</span>
                            <span className="font-medium text-gray-900 text-right">{formatAnswerValue(assessment![key])}</span>
                          </div>
                        ))}
                      </div>
                    </Fragment>
                  )
                })}
                {(() => {
                  const grouped = Object.values(ASSESSMENT_GROUPS).flat()
                  const other = assessmentKeys.filter(k => !grouped.includes(k))
                  if (other.length === 0) return null
                  return (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 border-b border-gray-100 pb-1">Other</p>
                      <div className="space-y-1.5">
                        {other.map(key => (
                          <div key={key} className="flex justify-between gap-3 text-sm">
                            <span className="text-gray-500">{getAssessmentLabel(key)}</span>
                            <span className="font-medium text-gray-900 text-right">{formatAnswerValue(assessment![key])}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )
                })()}
              </div>
            )}
          </div>
        )}

        {photos.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Device Photos</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {photos.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-indigo-300 transition-colors">
                  <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          </div>
        )}

        {idProof && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Customer ID Proof</h3>
            <a href={idProof} target="_blank" rel="noopener noreferrer" className="block max-w-xs rounded-lg overflow-hidden border border-gray-200">
              <img src={idProof} alt="ID Proof" className="w-full" />
            </a>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">QC Decision</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(Object.keys(decisionConfig) as QCDecision[]).map(d => (
              <button key={d} onClick={() => setDecision(d)} className={`p-4 rounded-xl border-2 text-center transition-all ${decision === d ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-gray-300'}`}>
                <span className="text-2xl block mb-1">{decisionConfig[d].icon}</span>
                <span className={`font-medium text-sm ${decision === d ? 'text-indigo-700' : 'text-gray-700'}`}>{decisionConfig[d].label}</span>
              </button>
            ))}
          </div>

          {decision === 'showroom' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Showroom</label>
              <select value={targetShowroomId} onChange={e => setTargetShowroomId(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                <option value="">Select showroom</option>
                {showrooms.map(s => (
                  <option key={s.id} value={s.id}>{s.name} &mdash; {s.city}</option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">QC Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder="Remarks about the device condition..." />
          </div>

          {decision && (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={decision === 'showroom' && !targetShowroomId}
              className={`mt-4 w-full py-3 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 ${decisionConfig[decision].color}`}
            >
              Confirm: {decisionConfig[decision].label}
            </button>
          )}
        </div>
      </div>

      {showConfirm && decision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-gray-900 text-lg">Confirm Decision</h3>
            <p className="text-gray-600 text-sm mt-2">
              Route <strong>{productName}</strong> to <strong>{decisionConfig[decision].label}</strong>?
            </p>
            <p className="text-xs text-gray-500 mt-2">This will generate a final bill and create an inventory record.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => { setShowConfirm(false); handleSubmitDecision() }} disabled={submitting} className={`flex-1 py-2.5 text-white rounded-lg font-medium transition-colors disabled:opacity-50 ${decisionConfig[decision].color}`}>
                {submitting ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
