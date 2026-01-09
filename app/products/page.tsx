'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Navigation from '@/components/Navigation'
import ProductsGrid from '@/components/ProductsGrid'

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

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Navigation />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center text-gray-600">
            Loading products...
          </div>
        }
      >
        <ProductsContent />
      </Suspense>
    </main>
  )
}


