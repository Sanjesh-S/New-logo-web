'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { motion } from 'framer-motion'
import { CheckCircle, Package, Truck, CreditCard, ArrowRight, Copy, Check, Calendar } from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { getProductById, type Product } from '@/lib/firebase/database'
import PickupScheduler from '@/components/PickupScheduler'

function OrderSummaryContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const valuationId = searchParams.get('id')
  const price = searchParams.get('price')
  const basePrice = searchParams.get('basePrice')
  const deductions = searchParams.get('deductions')
  const productId = searchParams.get('productId')
  const brand = searchParams.get('brand')
  const model = searchParams.get('model')
  const category = searchParams.get('category')
  
  const [copied, setCopied] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
  const [productLoading, setProductLoading] = useState(false)
  const [showScheduler, setShowScheduler] = useState(false)
  const [scheduledDate, setScheduledDate] = useState<string | null>(null)
  const [scheduledTime, setScheduledTime] = useState<string | null>(null)

  const finalPrice = price ? parseInt(price) : 0
  const internalBase = basePrice ? parseInt(basePrice) : 0
  const totalDeductions = deductions ? parseInt(deductions) : 0

  // Fetch product information if productId is available
  useEffect(() => {
    const fetchProduct = async () => {
      if (productId) {
        try {
          setProductLoading(true)
          const productData = await getProductById(productId)
          setProduct(productData)
        } catch (error) {
          console.error('Error fetching product:', error)
        } finally {
          setProductLoading(false)
        }
      }
    }
    fetchProduct()
  }, [productId])

  const copyOrderId = () => {
    if (valuationId) {
      navigator.clipboard.writeText(valuationId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSchedulePickup = async (date: string, time: string) => {
    if (!valuationId) {
      throw new Error('Valuation ID is required')
    }

    const response = await fetch('/api/pickup/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valuationId,
        pickupDate: date,
        pickupTime: time,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to schedule pickup')
    }

    setScheduledDate(date)
    setScheduledTime(time)
  }

  // Check if schedule param is in URL
  useEffect(() => {
    const scheduleParam = searchParams.get('schedule')
    if (scheduleParam === 'true' && valuationId) {
      setShowScheduler(true)
    }
  }, [searchParams, valuationId])

  // Use product data if available, otherwise use URL params as fallback
  const productBrand = product?.brand || brand || ''
  const productModel = product?.modelName || model || ''
  const productCategory = product?.category || category || ''
  const productImage = product?.imageUrl

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-20 md:pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
            className="relative mx-auto mb-6"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-brand-lime via-brand-lime-500 to-brand-lime-600 rounded-full flex items-center justify-center shadow-2xl shadow-brand-lime/30">
              <CheckCircle className="w-14 h-14 text-white" strokeWidth={2.5} />
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="absolute inset-0 rounded-full bg-brand-lime/20 blur-2xl"
            />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-3"
          >
            Order Confirmed!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-gray-600"
          >
            Your trade-in request has been submitted successfully
          </motion.p>
        </motion.div>

        {/* Product Information Card */}
        {(productBrand || productModel) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-6"
          >
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="text-xl font-bold text-gray-900">Device Details</h2>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-6">
                {/* Product Image */}
                {productImage && (
                  <div className="relative w-32 h-32 md:w-40 md:h-40 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                    <Image
                      src={productImage}
                      alt={productModel}
                      fill
                      sizes="(min-width: 768px) 160px, 128px"
                      className="object-contain p-4"
                    />
                  </div>
                )}
                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  {productBrand && (
                    <div className="mb-2">
                      <span className="text-sm text-gray-500">Brand</span>
                      <h3 className="text-2xl font-bold text-gray-900 capitalize">{productBrand}</h3>
                    </div>
                  )}
                  {productModel && (
                    <div className="mb-3">
                      <span className="text-sm text-gray-500">Model</span>
                      <p className="text-lg text-gray-700 font-medium">{productModel}</p>
                    </div>
                  )}
                  {productCategory && (
                    <div>
                      <span className="inline-flex items-center px-3 py-1 bg-brand-blue-50 text-brand-blue-700 rounded-full text-xs font-semibold capitalize">
                        {productCategory}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Price Summary Card - Main Focus */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Header with gradient accent */}
              <div className="bg-gradient-to-r from-brand-blue-600 to-brand-blue-700 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Price Summary</h2>
              </div>

              <div className="p-6 md:p-8">
                <div className="space-y-5">
                  {/* Base Price */}
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 text-base">Base Price</span>
                    <span className="text-gray-900 font-semibold text-lg">₹{internalBase.toLocaleString('en-IN')}</span>
                  </div>

                  {/* Deductions */}
                  {totalDeductions !== 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex justify-between items-center py-2"
                    >
                      <span className="text-gray-600 text-base">Adjustments</span>
                      <span className={`font-semibold text-lg ${totalDeductions < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {totalDeductions > 0 ? '+' : ''}₹{Math.abs(totalDeductions).toLocaleString('en-IN')}
                      </span>
                    </motion.div>
                  )}

                  {/* Divider */}
                  <div className="border-t-2 border-gray-100 pt-5 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-gray-900">Final Offer Price</span>
                      <motion.span
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: 'spring' }}
                        className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-brand-blue-700 to-brand-lime-600 bg-clip-text text-transparent"
                      >
                        ₹{finalPrice.toLocaleString('en-IN')}
                      </motion.span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Order Details Card - Sidebar */}
          {valuationId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="lg:col-span-1"
            >
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden h-full">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">Order Details</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">Order ID</span>
                      <button
                        onClick={copyOrderId}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors group"
                        title="Copy Order ID"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                    <p className="text-sm font-mono text-gray-900 bg-gray-50 px-3 py-2 rounded-lg break-all">
                      {valuationId}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 block mb-2">Status</span>
                    <span className="inline-flex items-center px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold border border-amber-200">
                      <span className="w-2 h-2 bg-amber-500 rounded-full mr-2 animate-pulse"></span>
                      Pending Review
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-8 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h2 className="text-xl font-bold text-gray-900">What's Next?</h2>
            <p className="text-sm text-gray-500 mt-1">Here's what happens after your order confirmation</p>
          </div>

          <div className="p-6 md:p-8">
            <div className="grid md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col items-start"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-brand-blue-500 to-brand-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Package className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-brand-blue-600 bg-brand-blue-50 px-2 py-1 rounded">STEP 1</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">Review & Verification</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Our team will review your submission within 24 hours and verify the device details.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col items-start"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-brand-lime-500 to-brand-lime-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Truck className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-brand-lime-600 bg-brand-lime-50 px-2 py-1 rounded">STEP 2</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">Schedule Pickup</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-3">
                  {scheduledDate && scheduledTime
                    ? `Pickup scheduled for ${new Date(scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} at ${scheduledTime}`
                    : 'Schedule a convenient pickup time at your location.'}
                </p>
                {!scheduledDate && valuationId && (
                  <button
                    onClick={() => setShowScheduler(true)}
                    className="text-sm text-brand-blue-600 hover:text-brand-blue-700 font-medium flex items-center gap-1"
                  >
                    <Calendar className="w-4 h-4" />
                    Schedule Now
                  </button>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="flex flex-col items-start"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <CreditCard className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">STEP 3</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">Payment</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  After verification, payment will be processed securely to your account.
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          {valuationId && !scheduledDate && (
            <motion.button
              onClick={() => setShowScheduler(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-brand-lime to-brand-lime-600 text-brand-blue-900 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Schedule Pickup
            </motion.button>
          )}
          <motion.button
            onClick={() => router.push('/')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-brand-blue-600 to-brand-blue-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            Back to Home
            <ArrowRight className="w-5 h-5" />
          </motion.button>
          <motion.button
            onClick={() => router.push('/products')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 px-6 py-4 border-2 border-brand-blue-600 text-brand-blue-600 rounded-xl font-semibold hover:bg-brand-blue-50 transition-all flex items-center justify-center gap-2"
          >
            Trade Another Device
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>

        {/* Pickup Scheduler Modal */}
        {valuationId && (
          <PickupScheduler
            isOpen={showScheduler}
            onClose={() => setShowScheduler(false)}
            onSchedule={handleSchedulePickup}
            valuationId={valuationId}
            productName={productModel || product?.modelName}
            price={finalPrice}
            initialDate={scheduledDate || undefined}
            initialTime={scheduledTime || undefined}
          />
        )}
      </div>
    </div>
  )
}

export default function OrderSummaryPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gray-50">
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center pt-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading order summary...</p>
            </div>
          </div>
        }>
          <OrderSummaryContent />
        </Suspense>
      </main>
    </>
  )
}
