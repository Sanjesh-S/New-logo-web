'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Navigation from '@/components/Navigation'
import ProductsGrid from '@/components/ProductsGrid'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'

function ProductsContent() {
  const searchParams = useSearchParams()
  const category = searchParams.get('category') || ''
  const brand = searchParams.get('brand') || ''

  const hasRequiredParams = category && brand

  return (
    <div className="min-h-screen bg-white pt-20 md:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!hasRequiredParams ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-brand-blue-900 mb-4">
              Missing selection details
            </h1>
            <p className="text-gray-600 mb-6 max-w-md">
              Please select a category and brand first to view available devices.
            </p>
          </div>
        ) : (
          <>
            <header className="mb-8 md:mb-12 text-center">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-brand-blue-900 mb-6">
                Sell Your {brand.charAt(0).toUpperCase() + brand.slice(1)}
              </h1>
            </header>

            <ProductsGrid category={category} brand={brand} />
          </>
        )}
      </div>
    </div>
  )
}

function ProductsPageSkeleton() {
  return (
    <div className="min-h-screen bg-white pt-20 md:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-8 md:mb-12 text-center">
          <div className="h-12 w-64 bg-gray-200 rounded-lg animate-pulse mx-auto mb-6" />
        </header>
        <div className="mb-8 md:mb-10">
          <div className="relative max-w-2xl mx-auto">
            <div className="h-14 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </div>
        <ProductGridSkeleton count={10} />
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Navigation />
      <Suspense fallback={<ProductsPageSkeleton />}>
        <ProductsContent />
      </Suspense>
    </main>
  )
}


