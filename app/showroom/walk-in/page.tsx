'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useShowroom } from '@/components/showroom/ShowroomGuard'
import { createShowroomWalkIn, checkStaffRole } from '@/lib/firebase/database'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

type Step = 'customer' | 'product' | 'photos' | 'pricing' | 'review'
const STEPS: { key: Step; label: string }[] = [
  { key: 'customer', label: 'Customer' },
  { key: 'product', label: 'Product' },
  { key: 'photos', label: 'Photos' },
  { key: 'pricing', label: 'Pricing' },
  { key: 'review', label: 'Review' },
]

const ID_PROOF_TYPES = ['Aadhaar', 'PAN', 'Driving License', 'Voter ID', 'Passport']
const CATEGORIES = ['Phone', 'DSLR', 'Laptop', 'iPad', 'Lens']

export default function WalkInEntryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const showroom = useShowroom()
  const [step, setStep] = useState<Step>('customer')
  const [submitting, setSubmitting] = useState(false)

  // Customer fields
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [idProofType, setIdProofType] = useState(ID_PROOF_TYPES[0])
  const [idProofFile, setIdProofFile] = useState<File | null>(null)
  const [idProofPrev, setIdProofPrev] = useState('')

  // Product fields
  const [category, setCategory] = useState(CATEGORIES[0])
  const [brand, setBrand] = useState('')
  const [productName, setProductName] = useState('')
  const [serialNumber, setSerialNumber] = useState('')

  // Photos
  const [devicePhotos, setDevicePhotos] = useState<File[]>([])
  const [devicePhotosPrev, setDevicePhotosPrev] = useState<string[]>([])

  // Pricing
  const [manualPrice, setManualPrice] = useState('')
  const [staffNotes, setStaffNotes] = useState('')

  const idRef = useRef<HTMLInputElement>(null)
  const photoRef = useRef<HTMLInputElement>(null)

  const currentStepIdx = STEPS.findIndex(s => s.key === step)

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const storage = getStorage()
    const storageRef = ref(storage, path)
    await uploadBytes(storageRef, file)
    return getDownloadURL(storageRef)
  }

  const handleSubmit = async () => {
    if (!user || !showroom) return
    setSubmitting(true)
    try {
      const role = await checkStaffRole({ email: user.email, phoneNumber: user.phoneNumber })
      const staffId = role?.staffDoc?.id || user.uid
      const staffName = role?.staffDoc?.name || 'Staff'
      const walkInId = `SW-${Date.now()}`

      const photoUrls = await Promise.all(
        devicePhotos.map((f, i) => uploadFile(f, `showroomWalkIns/${walkInId}/device_${i}_${Date.now()}.jpg`))
      )
      let idProofUrl = ''
      if (idProofFile) {
        idProofUrl = await uploadFile(idProofFile, `showroomWalkIns/${walkInId}/id_proof_${Date.now()}.jpg`)
      }

      await createShowroomWalkIn({
        orderId: walkInId,
        showroomId: showroom.showroomId,
        showroomName: showroom.showroomName,
        staffId,
        staffName,
        customer: {
          name: customerName.trim(),
          phone: customerPhone.trim(),
          email: customerEmail.trim(),
          idProofType,
          idProofPhoto: idProofUrl,
        },
        product: {
          name: productName.trim(),
          brand: brand.trim(),
          category,
          serialNumber: serialNumber.trim(),
        },
        manualPrice: Number(manualPrice) || 0,
        staffNotes: staffNotes.trim(),
        devicePhotos: photoUrls,
        status: 'pending_qc',
        source: 'showroom_walkin',
      })

      // Generate provisional receipt
      try {
        await fetch('/api/receipts/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: walkInId,
            sourceType: 'showroom_walkin',
            sourceId: walkInId,
            receiptType: 'provisional',
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            customerEmail: customerEmail.trim(),
            productName: productName.trim(),
            brand: brand.trim(),
            category,
            serialNumber: serialNumber.trim(),
            agreedPrice: Number(manualPrice) || 0,
            showroomName: showroom.showroomName,
            staffName,
          }),
        })
      } catch (receiptErr) {
        console.error('Receipt generation failed:', receiptErr)
      }

      router.push('/showroom?created=true')
    } catch (error) {
      console.error('Error creating walk-in:', error)
      alert('Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 'customer': return customerName.trim() && customerPhone.trim()
      case 'product': return brand.trim() && productName.trim() && serialNumber.trim()
      case 'photos': return devicePhotos.length >= 3
      case 'pricing': return Number(manualPrice) > 0
      default: return true
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-amber-600 text-white px-4 py-3 shadow-lg sticky top-0 z-10">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => router.back()} className="p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex-1">
            <h1 className="font-semibold">New Walk-in</h1>
            <p className="text-amber-100 text-xs">{showroom?.showroomName}</p>
          </div>
        </div>
      </div>

      {/* Step progress */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-lg mx-auto flex gap-1">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex-1">
              <div className={`h-1.5 rounded-full ${i <= currentStepIdx ? 'bg-amber-500' : 'bg-gray-200'}`} />
              <p className={`text-[10px] mt-1 text-center ${i <= currentStepIdx ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Step 1: Customer */}
        {step === 'customer' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">Customer Details</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none" placeholder="Customer name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none" placeholder="10-digit mobile" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none" placeholder="Optional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Proof Type</label>
              <select value={idProofType} onChange={e => setIdProofType(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 outline-none">
                {ID_PROOF_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <input ref={idRef} type="file" accept="image/*" capture="environment" onChange={e => {
              const f = e.target.files?.[0]
              if (f) { setIdProofFile(f); setIdProofPrev(URL.createObjectURL(f)) }
            }} className="hidden" />
            {idProofPrev ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-200">
                <img src={idProofPrev} alt="ID" className="w-full max-h-48 object-cover" />
                <button onClick={() => { setIdProofFile(null); setIdProofPrev('') }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full px-3 py-1 text-xs">Remove</button>
              </div>
            ) : (
              <button onClick={() => idRef.current?.click()} className="w-full border-2 border-dashed border-amber-300 rounded-xl py-6 flex flex-col items-center gap-2 text-amber-600 hover:bg-amber-50 transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                <span className="text-sm font-medium">Capture ID Proof</span>
              </button>
            )}
          </div>
        )}

        {/* Step 2: Product */}
        {step === 'product' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">Product Details</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 outline-none">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
              <input type="text" value={brand} onChange={e => setBrand(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none" placeholder="e.g. Samsung, Canon" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name / Model *</label>
              <input type="text" value={productName} onChange={e => setProductName(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none" placeholder="e.g. Galaxy S24 Ultra, EOS R5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number *</label>
              <input type="text" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none" placeholder="Device serial / IMEI" />
            </div>
          </div>
        )}

        {/* Step 3: Photos */}
        {step === 'photos' && (
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-gray-900">Device Photos</h2>
              <p className="text-sm text-gray-500 mt-1">Capture at least 3 photos of the device</p>
            </div>
            <input ref={photoRef} type="file" accept="image/*" capture="environment" multiple onChange={e => {
              const files = Array.from(e.target.files || [])
              setDevicePhotos(prev => [...prev, ...files])
              setDevicePhotosPrev(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
            }} className="hidden" />
            <button onClick={() => photoRef.current?.click()} className="w-full border-2 border-dashed border-amber-300 rounded-xl py-8 flex flex-col items-center gap-2 text-amber-600 hover:bg-amber-50 transition-colors">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span className="font-medium text-sm">Tap to capture photo</span>
            </button>
            {devicePhotosPrev.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {devicePhotosPrev.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                    <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    <button onClick={() => {
                      setDevicePhotos(prev => prev.filter((_, idx) => idx !== i))
                      setDevicePhotosPrev(prev => prev.filter((_, idx) => idx !== i))
                    }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">×</button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500">{devicePhotos.length}/3 minimum photos</p>
          </div>
        )}

        {/* Step 4: Pricing */}
        {step === 'pricing' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">Manual Pricing</h2>
            <p className="text-sm text-gray-500">Set the agreed price after physical inspection</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agreed Price (₹) *</label>
              <input type="number" value={manualPrice} onChange={e => setManualPrice(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-xl font-semibold" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition Notes</label>
              <textarea value={staffNotes} onChange={e => setStaffNotes(e.target.value)} rows={4} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none" placeholder="Notes on device condition, scratches, functionality..." />
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {step === 'review' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">Review & Submit</h2>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              <div className="p-4">
                <p className="text-xs text-gray-500 uppercase font-semibold">Customer</p>
                <p className="font-medium text-gray-900 mt-1">{customerName}</p>
                <p className="text-sm text-gray-600">{customerPhone} {customerEmail && `• ${customerEmail}`}</p>
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-500 uppercase font-semibold">Product</p>
                <p className="font-medium text-gray-900 mt-1">{productName}</p>
                <p className="text-sm text-gray-600">{brand} &middot; {category} &middot; SN: {serialNumber}</p>
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-500 uppercase font-semibold">Device Photos</p>
                <div className="flex gap-2 mt-2">
                  {devicePhotosPrev.map((url, i) => (
                    <div key={i} className="w-14 h-14 rounded-lg overflow-hidden border"><img src={url} alt="" className="w-full h-full object-cover" /></div>
                  ))}
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-500 uppercase font-semibold">Agreed Price</p>
                <p className="text-xl font-bold text-gray-900 mt-1">₹{Number(manualPrice).toLocaleString('en-IN')}</p>
                {staffNotes && <p className="text-sm text-gray-600 mt-1">{staffNotes}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {currentStepIdx > 0 && (
            <button onClick={() => setStep(STEPS[currentStepIdx - 1].key)} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors">Back</button>
          )}
          {currentStepIdx < STEPS.length - 1 ? (
            <button onClick={() => setStep(STEPS[currentStepIdx + 1].key)} disabled={!canProceed()} className="flex-1 py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Next
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-colors disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Accept Device & Submit'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
