'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, TrendingUp, Users, CheckCircle } from 'lucide-react'
import { getProductById, type Product, type ProductVariant } from '@/lib/firebase/database'
import { isFixedLensCamera } from '@/lib/utils/fixedLensCameras'

interface ProductDetailProps {
  productId: string
  category: string
  brand: string
}

export default function ProductDetail({
  productId,
  category,
  brand,
}: ProductDetailProps) {
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        setError(null)

        const data = await getProductById(productId)
        if (!data) {
          setError('Product not found')
          return
        }
        setProduct(data)
        // For DSLR and Phone, don't auto-select variant - user must select one
        // Exception: Fixed-lens cameras should auto-select first variant since they don't show variant selection UI
        const cat = (data.category || '').toLowerCase().trim()
        const isDSLR = cat === 'cameras' || cat === 'camera' || cat === 'dslr'
        const isPhone = cat === 'phones' || cat === 'phone' || cat === 'iphone' || cat.includes('phone')
        
        // Check if this is a fixed-lens camera
        const isFixedLens = isDSLR && isFixedLensCamera(data.modelName || '')
        
        if (data?.variants?.length) {
          // Auto-select for non-DSLR/Phone products OR fixed-lens cameras
          if (!isDSLR && !isPhone) {
            setSelectedVariantId(data.variants[0].id)
          } else if (isFixedLens) {
            // Fixed-lens cameras: auto-select first variant (they won't see the selection UI)
            setSelectedVariantId(data.variants[0].id)
          } else {
            // For DSLR/Phone (non-fixed-lens), don't select any variant initially
            setSelectedVariantId(null)
          }
        } else {
          setSelectedVariantId(null)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchProduct()
    }
  }, [productId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-lime border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-brand-blue-900 mb-4">
            Product Not Found
          </h1>
          <p className="text-gray-600 mb-6">{error || 'The product you are looking for does not exist.'}</p>
          <Link
            href={`/products?category=${encodeURIComponent(category)}&brand=${encodeURIComponent(brand)}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-lime text-brand-blue-900 rounded-lg font-semibold hover:bg-brand-lime-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Products
          </Link>
        </div>
      </div>
    )
  }

  const hasVariants = product.variants && product.variants.length > 0
  const selectedVariant: ProductVariant | undefined = hasVariants && selectedVariantId
    ? product.variants!.find((v) => v.id === selectedVariantId)
    : undefined
  
  // Check if this is DSLR or Phone
  const cat = (category || product.category || '').toLowerCase().trim()
  const isDSLR = cat === 'cameras' || cat === 'camera' || cat === 'dslr'
  const isPhone = cat === 'phones' || cat === 'phone' || cat === 'iphone' || cat.includes('phone')
  
  // Check if this is a fixed-lens camera (should not show variant selection)
  const isFixedLens = isDSLR && isFixedLensCamera(product.modelName || '')
  
  // For DSLR/Phone with variants, only show price if variant is selected
  // For fixed-lens cameras, always show price (no variant selection)
  const shouldShowPrice = hasVariants && (isDSLR || isPhone) && !isFixedLens
    ? selectedVariantId !== null 
    : true
  
  const effectivePrice = selectedVariant ? selectedVariant.basePrice : product.basePrice

  const displayPrice = effectivePrice.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  })

  const assessmentUrl =
    `/assessment?id=${encodeURIComponent(product.id)}&category=${encodeURIComponent(category || product.category)}&brand=${encodeURIComponent(brand || product.brand)}&model=${encodeURIComponent(product.modelName)}` +
    (selectedVariantId ? `&variantId=${encodeURIComponent(selectedVariantId)}` : '')

  const handleBack = () => {
    // Try browser back first, fallback to products page
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push(`/products?category=${encodeURIComponent(category || product.category)}&brand=${encodeURIComponent(brand || product.brand)}`)
    }
  }

  return (
    <div className="min-h-screen bg-white pt-20 md:pt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-brand-blue-900 mb-4 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Models</span>
        </button>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 p-4 md:p-6">
            {/* Left Column - Product Image */}
            <div className="relative w-full aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.modelName}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-contain p-6"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-gray-300 rounded-full mx-auto mb-2" />
                    <p className="text-xs">No image available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Product Details */}
            <div className="flex flex-col justify-center space-y-4">
              {/* Heading */}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-brand-blue-900 mb-1">
                  Sell Old {product.modelName}
                </h1>
                <p className="text-sm text-gray-600">
                  {product.brand ? product.brand.charAt(0).toUpperCase() + product.brand.slice(1) : ''} {product.category || ''}
                </p>
              </div>

              {/* Variant Selection (Cashify-style) - Hide for fixed-lens cameras */}
              {hasVariants && !isFixedLens && (
                <div>
                  <h3 className="text-sm font-semibold text-brand-blue-900 mb-3">Choose a variant</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.variants!.map((v) => (
                      <motion.button
                        key={v.id}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedVariantId(v.id)}
                        className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                          selectedVariantId === v.id
                            ? 'border-brand-lime bg-brand-lime/20 text-brand-blue-900'
                            : 'border-gray-200 bg-white text-brand-blue-900 hover:border-brand-lime'
                        }`}
                      >
                        {v.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Section - Only show if variant is selected for DSLR/Phone */}
              {shouldShowPrice && (
                <div className="bg-gradient-to-br from-brand-blue-50 to-brand-lime-50 rounded-xl p-4 border border-brand-blue-100">
                  <p className="text-xs font-medium text-gray-600 mb-1">Get Upto</p>
                  <p className="text-3xl md:text-4xl font-bold text-brand-blue-900 mb-3">
                    {displayPrice}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Users className="w-3 h-3 text-brand-lime" />
                    <span>3250+ already sold on WorthyTen</span>
                  </div>
                </div>
              )}

              {/* CTA Button - Disabled if variant not selected for DSLR/Phone (except fixed-lens) */}
              {hasVariants && (isDSLR || isPhone) && !isFixedLens && !selectedVariantId ? (
                <button
                  disabled
                  className="w-full py-3 px-5 bg-gray-300 text-gray-500 rounded-lg font-semibold text-base cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Select a variant to continue
                </button>
              ) : (
                <Link 
                  href={assessmentUrl} 
                  prefetch={true}
                  replace={false}
                  scroll={true}
                >
                  <button
                    className="w-full py-3 px-5 bg-brand-blue-600 text-white rounded-lg font-semibold text-base shadow-md hover:bg-brand-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 will-change-transform"
                  >
                    Get Exact Value
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </button>
                </Link>
              )}

              {/* Features */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-brand-lime/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-brand-lime" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Free Pickup</p>
                    <p className="text-xs font-semibold text-brand-blue-900">Doorstep Service</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-brand-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-brand-blue-900" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Same Day</p>
                    <p className="text-xs font-semibold text-brand-blue-900">Payment</p>
                  </div>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-3 border-t border-gray-200">
                <CheckCircle className="w-3 h-3 text-brand-lime" />
                <span>100% Secure & Verified Process</span>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

