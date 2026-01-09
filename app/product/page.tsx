'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Navigation from '@/components/Navigation'
import ProductDetail from '@/components/ProductDetail'

function ProductDetailContent() {
  const searchParams = useSearchParams()
  const productId = searchParams.get('id') || ''
  const category = searchParams.get('category') || ''
  const brand = searchParams.get('brand') || ''

  if (!productId) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-brand-blue-900 mb-4">
            Product ID Required
          </h1>
          <p className="text-gray-600 mb-6">
            Please select a product to view its details.
          </p>
        </div>
      </div>
    )
  }

  return (
    <ProductDetail
      productId={productId}
      category={category}
      brand={brand}
    />
  )
}

export default function ProductDetailPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Navigation />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center text-gray-600">
            Loading product...
          </div>
        }
      >
        <ProductDetailContent />
      </Suspense>
    </main>
  )
}



