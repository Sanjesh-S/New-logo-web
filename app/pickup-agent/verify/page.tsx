'use client'

import { useEffect, useState, useRef, Fragment } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { checkStaffRole, type PickupRequest } from '@/lib/firebase/database'
import { ASSESSMENT_GROUPS, getAssessmentLabel, formatAnswerValue } from '@/lib/utils/assessmentLabels'

type Step = 'details' | 'photos' | 'id_proof' | 'serial' | 'review'
const STEPS: { key: Step; label: string }[] = [
  { key: 'details', label: 'Order Info' },
  { key: 'photos', label: 'Device Photos' },
  { key: 'id_proof', label: 'ID Proof' },
  { key: 'serial', label: 'Serial Number' },
  { key: 'review', label: 'Review' },
]

export default function VerificationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const orderId = searchParams.get('orderId') || ''

  const [order, setOrder] = useState<PickupRequest | null>(null)
  const [assessment, setAssessment] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>('details')
  const [submitting, setSubmitting] = useState(false)
  const [showAssessment, setShowAssessment] = useState(false)

  const [devicePhotos, setDevicePhotos] = useState<File[]>([])
  const [devicePhotosPrev, setDevicePhotosPrev] = useState<string[]>([])
  const [idProofFile, setIdProofFile] = useState<File | null>(null)
  const [idProofPrev, setIdProofPrev] = useState<string>('')
  const [serialNumber, setSerialNumber] = useState('')
  const [serialPhoto, setSerialPhoto] = useState<File | null>(null)
  const [notes, setNotes] = useState('')

  const devicePhotoRef = useRef<HTMLInputElement>(null)
  const idProofRef = useRef<HTMLInputElement>(null)
  const serialPhotoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!orderId) { setLoading(false); return }
    const load = async () => {
      try {
        const res = await fetch(`/api/pickup-agent/order-detail?orderId=${encodeURIComponent(orderId)}`)
        const data = await res.json()
        if (res.ok) {
          setOrder(data.order || null)
          setAssessment(data.assessment || null)
        }
      } catch (err) {
        console.error('Error loading order:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [orderId])

  const handleDevicePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newPhotos = [...devicePhotos, ...files]
    setDevicePhotos(newPhotos)
    const previews = [...devicePhotosPrev, ...files.map(f => URL.createObjectURL(f))]
    setDevicePhotosPrev(previews)
  }

  const removeDevicePhoto = (idx: number) => {
    setDevicePhotos(prev => prev.filter((_, i) => i !== idx))
    setDevicePhotosPrev(prev => prev.filter((_, i) => i !== idx))
  }

  const handleIdProof = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIdProofFile(file)
      setIdProofPrev(URL.createObjectURL(file))
    }
  }

  const handleSerialPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSerialPhoto(file)
  }

  const uploadFile = async (file: File, pathPrefix: string): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('path', pathPrefix)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Upload failed')
    }
    const data = await res.json()
    return data.url
  }

  const handleSubmit = async () => {
    if (!user || !order) return
    if (devicePhotos.length < 3) { alert('Please capture at least 3 device photos'); return }
    if (!idProofFile) { alert('Please capture customer ID proof'); return }
    if (!serialNumber.trim()) { alert('Please enter the serial number'); return }

    setSubmitting(true)
    try {
      const role = await checkStaffRole({ email: user.email, phoneNumber: user.phoneNumber })
      const agentId = role?.staffDoc?.id || user.uid
      const agentName = role?.staffDoc?.name || 'Agent'
      const oId = order.orderId || order.id

      const pathPrefix = `pickupVerifications/${oId}`
      const photoUrls = await Promise.all(
        devicePhotos.map((f) => uploadFile(f, pathPrefix))
      )
      const idProofUrl = await uploadFile(idProofFile, pathPrefix)

      const verifyRes = await fetch('/api/pickup-agent/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: oId,
          pickupRequestId: order.id,
          agentId,
          agentName,
          devicePhotos: photoUrls,
          customerIdProof: idProofUrl,
          serialNumber: serialNumber.trim(),
          notes: notes.trim() || '',
        }),
      })
      if (!verifyRes.ok) {
        const errData = await verifyRes.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to save verification')
      }

      try {
        await fetch('/api/receipts/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: oId,
            sourceType: 'pickup',
            sourceId: order.id,
            receiptType: 'provisional',
            customerName: order.customer?.name || order.userName || '',
            customerPhone: order.customer?.phone || order.userPhone || '',
            customerEmail: order.customer?.email || order.userEmail || '',
            productName: order.productName || '',
            brand: '',
            category: '',
            serialNumber: serialNumber.trim(),
            agreedPrice: order.price || 0,
            staffName: agentName,
          }),
        })
      } catch (receiptErr) {
        console.error('Receipt generation failed:', receiptErr)
      }

      router.push('/pickup-agent?verified=true')
    } catch (error) {
      console.error('Error submitting verification:', error)
      alert('Failed to submit verification. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const currentStepIdx = STEPS.findIndex(s => s.key === step)

  const canProceed = () => {
    switch (step) {
      case 'details': return true
      case 'photos': return devicePhotos.length >= 3
      case 'id_proof': return !!idProofFile
      case 'serial': return serialNumber.trim().length > 0
      default: return true
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  if (!orderId || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <p className="text-gray-600 font-medium">Order not found</p>
        <button onClick={() => router.back()} className="mt-4 text-teal-600 font-medium">Go Back</button>
      </div>
    )
  }

  const customerName = order.customer?.name || order.userName || 'N/A'
  const customerPhone = order.customer?.phone || order.userPhone || ''
  const customerEmail = order.customer?.email || order.userEmail || ''
  const customerAddress = order.customer?.address || order.pickupAddress || ''
  const customerCity = order.customer?.city || ''
  const customerState = order.customer?.state || order.state || ''
  const customerPincode = order.customer?.pincode || ''
  const customerLandmark = order.customer?.landmark || ''

  const assessmentKeys = assessment ? Object.keys(assessment).filter(k => assessment[k] != null && assessment[k] !== '') : []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-teal-600 text-white px-4 py-3 shadow-lg sticky top-0 z-10">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => router.back()} className="p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex-1">
            <h1 className="font-semibold">Verify Pickup</h1>
            <p className="text-teal-100 text-xs">{order.orderId || order.id}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-lg mx-auto flex gap-1">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex-1">
              <div className={`h-1.5 rounded-full ${i <= currentStepIdx ? 'bg-teal-500' : 'bg-gray-200'}`} />
              <p className={`text-[10px] mt-1 text-center ${i <= currentStepIdx ? 'text-teal-600 font-medium' : 'text-gray-400'}`}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {step === 'details' && (
          <div className="space-y-4">
            {/* Product Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{order.productName || 'N/A'}</h3>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">{order.orderId || order.id}</p>
                </div>
                <p className="text-lg font-bold text-gray-900">{'\u20B9'}{(order.price || 0).toLocaleString('en-IN')}</p>
              </div>
              {order.remarks && (
                <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg p-2">{order.remarks}</p>
              )}
            </div>

            {/* Customer Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Customer Details
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Name</span>
                  <span className="text-sm font-medium text-gray-900">{customerName}</span>
                </div>
                {customerPhone && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Phone</span>
                    <a href={`tel:${customerPhone}`} className="text-sm font-medium text-teal-600">{customerPhone}</a>
                  </div>
                )}
                {customerEmail && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Email</span>
                    <span className="text-sm text-gray-900">{customerEmail}</span>
                  </div>
                )}
              </div>
              {customerAddress && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Pickup Address</p>
                  <p className="text-sm text-gray-800">{customerAddress}</p>
                  {customerLandmark && <p className="text-sm text-gray-600">Landmark: {customerLandmark}</p>}
                  <p className="text-sm text-gray-600">
                    {[customerCity, customerState, customerPincode].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
              {(order.pickupDate || order.pickupTime) && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex gap-3">
                  {order.pickupDate && (
                    <span className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded font-medium">
                      {new Date(order.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                  {order.pickupTime && (
                    <span className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded font-medium">{order.pickupTime}</span>
                  )}
                </div>
              )}
            </div>

            {/* Assessment Details */}
            {assessmentKeys.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <button
                  onClick={() => setShowAssessment(!showAssessment)}
                  className="w-full flex items-center justify-between"
                >
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    Device Assessment ({assessmentKeys.length} items)
                  </h3>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform ${showAssessment ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showAssessment && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-4">
                    {Object.entries(ASSESSMENT_GROUPS).map(([groupName, groupKeys]) => {
                      const present = groupKeys.filter(k => assessmentKeys.includes(k))
                      if (present.length === 0) return null
                      return (
                        <Fragment key={groupName}>
                          <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 border-b border-gray-100 pb-1">{groupName}</p>
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
                          <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 border-b border-gray-100 pb-1">Other</p>
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
          </div>
        )}

        {step === 'photos' && (
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-gray-900">Device Photos</h2>
              <p className="text-sm text-gray-500 mt-1">Capture at least 3 photos: front, back, and overall condition</p>
            </div>
            <input ref={devicePhotoRef} type="file" accept="image/*" capture="environment" multiple onChange={handleDevicePhotos} className="hidden" />
            <button onClick={() => devicePhotoRef.current?.click()} className="w-full border-2 border-dashed border-teal-300 rounded-xl py-8 flex flex-col items-center gap-2 text-teal-600 hover:bg-teal-50 transition-colors">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span className="font-medium text-sm">Tap to capture photo</span>
            </button>
            {devicePhotosPrev.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {devicePhotosPrev.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                    <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    <button onClick={() => removeDevicePhoto(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">&times;</button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500">{devicePhotos.length}/3 minimum photos captured</p>
          </div>
        )}

        {step === 'id_proof' && (
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-gray-900">Customer ID Proof</h2>
              <p className="text-sm text-gray-500 mt-1">Capture customer&apos;s Aadhaar, PAN, or Driving License</p>
            </div>
            <input ref={idProofRef} type="file" accept="image/*" capture="environment" onChange={handleIdProof} className="hidden" />
            {idProofPrev ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-200">
                <img src={idProofPrev} alt="ID Proof" className="w-full" />
                <button onClick={() => { setIdProofFile(null); setIdProofPrev('') }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full px-3 py-1 text-xs font-medium">Remove</button>
              </div>
            ) : (
              <button onClick={() => idProofRef.current?.click()} className="w-full border-2 border-dashed border-teal-300 rounded-xl py-8 flex flex-col items-center gap-2 text-teal-600 hover:bg-teal-50 transition-colors">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" /></svg>
                <span className="font-medium text-sm">Tap to capture ID proof</span>
              </button>
            )}
          </div>
        )}

        {step === 'serial' && (
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-gray-900">Serial Number</h2>
              <p className="text-sm text-gray-500 mt-1">Enter or photograph the device serial number</p>
            </div>
            <input type="text" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} placeholder="Enter serial number" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-lg" />
            <input ref={serialPhotoRef} type="file" accept="image/*" capture="environment" onChange={handleSerialPhoto} className="hidden" />
            <button onClick={() => serialPhotoRef.current?.click()} className="w-full border border-gray-200 rounded-xl py-3 flex items-center justify-center gap-2 text-gray-600 hover:bg-gray-50 transition-colors text-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
              {serialPhoto ? 'Photo captured' : 'Photo serial number label (optional)'}
            </button>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">Review & Submit</h2>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              <div className="p-4">
                <p className="text-xs text-gray-500 uppercase font-semibold">Product</p>
                <p className="font-medium text-gray-900 mt-1">{order.productName || 'N/A'}</p>
                <p className="text-sm text-gray-600">{'\u20B9'}{(order.price || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-500 uppercase font-semibold">Customer</p>
                <p className="font-medium text-gray-900 mt-1">{customerName}</p>
                {customerPhone && <p className="text-sm text-gray-600">{customerPhone}</p>}
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-500 uppercase font-semibold">Device Photos</p>
                <div className="flex gap-2 mt-2">
                  {devicePhotosPrev.map((url, i) => (
                    <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-500 uppercase font-semibold">ID Proof</p>
                {idProofPrev && <img src={idProofPrev} alt="ID" className="w-24 h-16 object-cover rounded-lg mt-2 border" />}
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-500 uppercase font-semibold">Serial Number</p>
                <p className="font-mono text-gray-900 mt-1">{serialNumber}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none" placeholder="Any additional notes about the device..." />
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {currentStepIdx > 0 && (
            <button onClick={() => setStep(STEPS[currentStepIdx - 1].key)} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors">Back</button>
          )}
          {currentStepIdx < STEPS.length - 1 ? (
            <button onClick={() => setStep(STEPS[currentStepIdx + 1].key)} disabled={!canProceed()} className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Next
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit Verification'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
