'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { motion } from 'framer-motion'
import { CheckCircle, Package, Truck, CreditCard, ArrowRight, Copy, Check, Calendar, Sparkles, Shield, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { getProductById, getValuation, getPickupRequest, type Product, type PickupRequest, type Valuation } from '@/lib/firebase/database'
import PickupScheduler from '@/components/PickupScheduler'
import { Timestamp } from 'firebase/firestore'

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
  const [pickupRequest, setPickupRequest] = useState<PickupRequest | null>(null)
  const [valuation, setValuation] = useState<Valuation | null>(null)
  const [orderType, setOrderType] = useState<'valuation' | 'pickup'>('valuation')
  
  // Get the Order ID to display (prefer orderId from valuation/pickupRequest, fallback to valuationId)
  const displayOrderId = valuation?.orderId || pickupRequest?.orderId || valuationId || ''

  const finalPrice = (price ? parseInt(price, 10) : (pickupRequest?.price ?? valuation?.estimatedValue ?? 0)) || 0
  const internalBase = (basePrice ? parseInt(basePrice, 10) : 0) || 0
  const totalDeductions = (deductions ? parseInt(deductions, 10) : 0) || 0

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

  // Fetch order data (valuation or pickup request)
  useEffect(() => {
    const fetchOrderData = async () => {
      if (valuationId) {
        try {
          // Try to fetch both valuation and pickup request in parallel
          // Prioritize pickup request since confirmed orders are usually pickup requests
          const [valuationData, pickupReq] = await Promise.all([
            getValuation(valuationId).catch(() => null),
            getPickupRequest(valuationId).catch(() => null),
          ])

          // If pickup request exists, use it (more accurate for confirmed orders)
          if (pickupReq) {
            setOrderType('pickup')
            setPickupRequest(pickupReq)
            // Also set valuation if it exists (for reference)
            if (valuationData) {
              setValuation(valuationData)
            }
            // Extract pickupDate and pickupTime from pickup request
            if (pickupReq.pickupDate) {
              let dateValue: Date
              const pickupDate = pickupReq.pickupDate
              
              if (typeof pickupDate === 'string') {
                dateValue = new Date(pickupDate)
              } else {
                // Handle Date, Firestore Timestamp, or other date-like objects
                const dateLike = pickupDate as any
                if (dateLike instanceof Date) {
                  dateValue = dateLike
                } else if (dateLike?.toDate && typeof dateLike.toDate === 'function') {
                  dateValue = dateLike.toDate()
                } else {
                  dateValue = new Date(dateLike)
                }
              }
              
              const formattedDate = dateValue.toISOString().split('T')[0]
              setScheduledDate(formattedDate)
            }
            if (pickupReq.pickupTime) {
              setScheduledTime(pickupReq.pickupTime)
            }
            return
          }

          // If no pickup request, use valuation
          if (valuationData) {
            setValuation(valuationData)
            setOrderType('valuation')
            // Extract pickupDate and pickupTime from valuation
            if (valuationData.pickupDate) {
              // Handle both Date and Timestamp types
              let dateValue: Date
              if (valuationData.pickupDate instanceof Timestamp) {
                dateValue = valuationData.pickupDate.toDate()
              } else if (valuationData.pickupDate instanceof Date) {
                dateValue = valuationData.pickupDate
              } else {
                dateValue = new Date(valuationData.pickupDate)
              }
              // Format as YYYY-MM-DD for the date input
              const formattedDate = dateValue.toISOString().split('T')[0]
              setScheduledDate(formattedDate)
            }
            if (valuationData.pickupTime) {
              setScheduledTime(valuationData.pickupTime)
            }
          }
        } catch (error) {
          console.error('Error fetching order data:', error)
        }
      }
    }
    fetchOrderData()
  }, [valuationId])

  const copyOrderId = () => {
    const orderIdToCopy = displayOrderId
    if (orderIdToCopy) {
      navigator.clipboard.writeText(orderIdToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSchedulePickup = async (date: string, time: string) => {
    if (!valuationId) {
      throw new Error('Valuation ID is required')
    }

    const { schedulePickup } = await import('@/lib/api/client')
    const result = await schedulePickup({
      valuationId,
      pickupDate: date,
      pickupTime: time,
    })

    if (!result.success) {
      throw new Error(result.message || 'Failed to schedule pickup')
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

  // Use product data if available, otherwise use URL params or pickup request as fallback
  const productBrand = product?.brand || brand || ''
  const productModel = orderType === 'pickup' && pickupRequest?.productName 
    ? pickupRequest.productName 
    : product?.modelName || model || ''
  const productCategory = product?.category || category || ''
  const productImage = product?.imageUrl

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-lime-50/20">
      {/* Hero Success Section - Mobile Optimized */}
      <div className="relative overflow-hidden pt-16 pb-8 md:pt-20 md:pb-12">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-20 left-10 w-72 h-72 bg-brand-lime-400 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.15, 0.1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
            className="absolute top-10 right-10 w-96 h-96 bg-brand-blue-400 rounded-full blur-3xl"
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            {/* Success Icon with Unique Design */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: 'spring', 
                stiffness: 200, 
                damping: 15,
                delay: 0.2 
              }}
              className="relative mx-auto mb-6 w-20 h-20 md:w-28 md:h-28"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-lime-400 via-brand-lime-500 to-brand-lime-600 rounded-full shadow-2xl shadow-brand-lime/50" />
              <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 md:w-14 md:h-14 text-brand-lime-600" strokeWidth={2.5} />
              </div>
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 rounded-full bg-brand-lime-400 blur-xl"
              />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-3 leading-tight"
            >
              <span className="bg-gradient-to-r from-brand-blue-700 via-brand-lime-600 to-brand-blue-700 bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_ease-in-out_infinite]">
                Order Confirmed!
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto"
            >
              Your trade-in request has been submitted successfully
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* Main Content - Mobile First Layout */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 md:pb-12 space-y-4 sm:space-y-6">
        
        {/* Price Card - Prominent on Mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-blue-600 via-brand-blue-700 to-brand-blue-800 shadow-2xl"
        >
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="relative p-6 sm:p-8 md:p-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-brand-blue-100 text-sm sm:text-base font-medium mb-2">Final Offer Price</p>
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: 'spring' }}
                  className="text-4xl sm:text-5xl md:text-6xl font-black text-white"
                >
                  ₹{finalPrice.toLocaleString('en-IN')}
                </motion.div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-brand-lime-300" />
                <span className="text-brand-lime-200 text-sm sm:text-base font-semibold">Best Price Guaranteed</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Device & Order Info - Stacked on Mobile */}
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Device Card */}
          {(productBrand || productModel || pickupRequest?.productName) && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200/50 overflow-hidden"
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-brand-blue-600" />
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Device Details</h2>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  {productImage && (
                    <div className="relative w-full sm:w-32 h-48 sm:h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      <Image
                        src={productImage}
                        alt={productModel}
                        fill
                        sizes="(max-width: 640px) 100vw, 128px"
                        className="object-contain p-3 sm:p-4"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 space-y-3">
                    {orderType === 'pickup' && pickupRequest?.productName ? (
                      <>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Product</p>
                          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{pickupRequest.productName}</h3>
                        </div>
                        <div>
                          <span className="inline-flex items-center px-3 py-1.5 bg-brand-blue-50 text-brand-blue-700 rounded-full text-xs font-semibold capitalize border border-brand-blue-200">
                            <Truck className="w-3 h-3 mr-1" />
                            Pickup Request
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        {productBrand && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Brand</p>
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 capitalize">{productBrand}</h3>
                          </div>
                        )}
                        {productModel && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Model</p>
                            <p className="text-base sm:text-lg text-gray-700 font-semibold">{productModel}</p>
                          </div>
                        )}
                        {productCategory && (
                          <div>
                            <span className="inline-flex items-center px-3 py-1.5 bg-brand-blue-50 text-brand-blue-700 rounded-full text-xs font-semibold capitalize border border-brand-blue-200">
                              {productCategory}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Order Details Card */}
          {valuationId && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200/50 overflow-hidden"
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-brand-blue-600" />
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Order Details</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm text-gray-500">Order ID</span>
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
                    <p className="text-xs sm:text-sm font-mono text-gray-900 bg-gray-50 px-3 py-2 rounded-lg break-all border border-gray-200">
                      {displayOrderId}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm text-gray-500 block mb-2">Status</span>
                    {(() => {
                      // Get status from the appropriate source
                      let orderStatus: string
                      if (orderType === 'pickup') {
                        orderStatus = pickupRequest?.status || 'pending'
                      } else {
                        // For valuations, map status appropriately
                        const valStatus = valuation?.status || 'pending'
                        // Map valuation statuses to pickup statuses for display
                        if (valStatus === 'approved') {
                          orderStatus = 'confirmed' // Approved valuations are confirmed
                        } else if (valStatus === 'completed') {
                          orderStatus = 'completed'
                        } else {
                          orderStatus = valStatus
                        }
                      }
                      
                      const statusConfig: Record<string, { text: string; color: string; bgColor: string }> = {
                        pending: { text: 'Pending Review', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' },
                        confirmed: { text: 'Pickup Confirmed', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
                        approved: { text: 'Approved', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200' },
                        hold: { text: 'On Hold', color: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-200' },
                        verification: { text: 'Under Verification', color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200' },
                        completed: { text: 'Completed', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200' },
                        rejected: { text: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' },
                      }
                      
                      const status = statusConfig[orderStatus] || statusConfig.pending
                      
                      return (
                        <span className={`inline-flex items-center px-3 py-1.5 ${status.bgColor} ${status.color} rounded-full text-xs font-semibold border`}>
                          <span className={`w-2 h-2 ${status.color.replace('text-', 'bg-')} rounded-full mr-2 ${orderStatus === 'pending' ? 'animate-pulse' : ''}`}></span>
                          {status.text}
                        </span>
                      )
                    })()}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Pickup Scheduled Banner - Mobile Optimized */}
        {scheduledDate && scheduledTime && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-brand-lime-50 via-brand-lime-100 to-brand-lime-50 border-2 border-brand-lime-300 shadow-lg"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-lime-200 rounded-full blur-3xl opacity-50" />
            <div className="relative p-5 sm:p-6 md:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-brand-lime-500 to-brand-lime-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-2 text-lg sm:text-xl">Pickup Scheduled Successfully!</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 text-sm sm:text-base text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-brand-blue-600" />
                      <span className="font-semibold text-brand-blue-700">
                        {new Date(scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-brand-blue-600" />
                      <span className="font-semibold text-brand-blue-700">{scheduledTime}</span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Our team will arrive at your location at the scheduled time. Please keep your device ready for pickup.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Next Steps - Mobile Optimized Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200/50 overflow-hidden"
        >
          <div className="p-5 sm:p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">What's Next?</h2>
              <p className="text-sm sm:text-base text-gray-600">Your pickup is scheduled! Here's what happens next</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl border border-blue-200/50"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-brand-blue-500 to-brand-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <div className="mb-2">
                  <span className="text-xs font-bold text-brand-blue-600 bg-brand-blue-50 px-2 py-1 rounded">STEP 1</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-base sm:text-lg">Device Pickup</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Our pickup team will collect your device at the scheduled time. Please ensure the device is ready and accessible.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="p-5 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl border border-amber-200/50"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div className="mb-2">
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">STEP 2</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-base sm:text-lg">Quality Verification</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Our team will inspect and verify the device condition. This typically takes 5-10 Minutes.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="p-5 bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl border border-green-200/50 sm:col-span-2 lg:col-span-1"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div className="mb-2">
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">STEP 3</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-base sm:text-lg">Payment Processing</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  After QC completion, payment will be processed securely and transferred to your account within 30 Minutes.
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons - Mobile Optimized */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2"
        >
          <motion.button
            onClick={() => router.push('/dashboard')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-brand-blue-600 to-brand-blue-700 text-white rounded-xl sm:rounded-2xl font-semibold hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            View order details
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.button>
          <motion.button
            onClick={() => router.push('/products')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 px-6 py-4 border-2 border-brand-blue-600 text-brand-blue-600 bg-white rounded-xl sm:rounded-2xl font-semibold hover:bg-brand-blue-50 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            Trade Another Device
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.button>
        </motion.div>
      </div>

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
  )
}

export default function OrderSummaryPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen">
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
