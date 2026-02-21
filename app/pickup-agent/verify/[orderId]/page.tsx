'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getPickupRequest, createPickupVerification, updatePickupRequest, checkStaffRole, type PickupRequest } from '@/lib/firebase/database'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

type Step = 'photos' | 'id_proof' | 'serial' | 'review'
const STEPS: { key: Step; label: string }[] = [
  { key: 'photos', label: 'Device Photos' },
  { key: 'id_proof', label: 'ID Proof' },
  { key: 'serial', label: 'Serial Number' },
  { key: 'review', label: 'Review' },
]

export default function VerificationPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const orderId = params.orderId as string

  const [order, setOrder] = useState<PickupRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>('photos')
  const [submitting, setSubmitting] = useState(false)

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
    const load = async () => {
      try {
        const data = await getPickupRequest(orderId)
        setOrder(data)
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

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const storage = getStorage()
    const storageRef = ref(storage, path)
    await uploadBytes(storageRef, file)
    return getDownloadURL(storageRef)
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

      const photoUrls = await Promise.all(
        devicePhotos.map((f, i) => uploadFile(f, `pickupVerifications/${oId}/device_${i}_${Date.now()}.jpg`))
      )
      const idProofUrl = await uploadFile(idProofFile, `pickupVerifications/${oId}/id_proof_${Date.now()}.jpg`)

      await createPickupVerification({
        orderId: oId,
        pickupRequestId: order.id,
        agentId,
        agentName,
        devicePhotos: photoUrls,
        customerIdProof: idProofUrl,
        serialNumber: serialNumber.trim(),
        notes: notes.trim() || undefined,
        status: 'submitted',
      })

      await updatePickupRequest(order.id, { status: 'picked_up' as any })

      // Generate provisional receipt
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

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <p className="text-gray-600 font-medium">Order not found</p>
        <button onClick={() => router.back()} className="mt-4 text-teal-600 font-medium">Go Back</button>
      </div>
    )
  }

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

      {/* Step progress */}
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
        {/* Step 1: Device Photos */}
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
                    <button onClick={() => removeDevicePhoto(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">×</button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500">{devicePhotos.length}/3 minimum photos captured</p>
          </div>
        )}

        {/* Step 2: ID Proof */}
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

        {/* Step 3: Serial Number */}
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

        {/* Step 4: Review */}
        {step === 'review' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">Review & Submit</h2>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              <div className="p-4">
                <p className="text-xs text-gray-500 uppercase font-semibold">Product</p>
                <p className="font-medium text-gray-900 mt-1">{order.productName || 'N/A'}</p>
                <p className="text-sm text-gray-600">₹{(order.price || 0).toLocaleString('en-IN')}</p>
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

        {/* Navigation */}
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
