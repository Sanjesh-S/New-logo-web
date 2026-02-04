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
          <a
            href="/brands"
            className="inline-block px-6 py-3 bg-brand-blue-900 text-white rounded-lg font-semibold hover:bg-brand-blue-800 transition-colors"
          >
            Browse Products
          </a>
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

function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 pt-20 md:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
            <div className="flex gap-2">
              <div className="h-20 w-20 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-20 w-20 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-20 w-20 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>
          <div className="space-y-6">
            <div className="h-8 w-3/4 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse" />
            <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProductDetailPage() {
  return (
    <main id="main-content" className="min-h-screen bg-gray-50">
      <Navigation />
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetailContent />
      </Suspense>
    </main>
  )
}



