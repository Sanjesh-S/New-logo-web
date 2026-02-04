'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Navigation from '@/components/Navigation'

// Dynamically import AssessmentWizard to prevent static generation issues
const AssessmentWizard = dynamic(() => import('@/components/AssessmentWizard'), {
  ssr: false,
  loading: () => <AssessmentSkeleton />,
})

function AssessmentContent() {
  const searchParams = useSearchParams()
  const productId = searchParams.get('id') || ''
  const category = searchParams.get('category') || ''
  const brand = searchParams.get('brand') || ''
  const model = searchParams.get('model') || ''
  const variantId = searchParams.get('variantId') || ''

  if (!productId) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-brand-blue-900 mb-4">
            Product ID Required
          </h1>
          <p className="text-gray-600 mb-6">
            Please select a product to start the assessment.
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
    <AssessmentWizard
      productId={productId}
      category={category}
      brand={brand}
      model={model}
      variantId={variantId || undefined}
    />
  )
}

function AssessmentSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 pt-20 md:pt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
          <div className="space-y-6">
            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
            <div className="mt-8 space-y-4">
              <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AssessmentPage() {
  return (
    <main id="main-content" className="min-h-screen bg-gray-50">
      <Navigation />
      <Suspense fallback={<AssessmentSkeleton />}>
        <AssessmentContent />
      </Suspense>
    </main>
  )
}



