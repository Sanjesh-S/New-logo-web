'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Navigation from '@/components/Navigation'
import AssessmentWizard from '@/components/AssessmentWizard'

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
          <p className="text-gray-600">
            Please select a product to start the assessment.
          </p>
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

export default function AssessmentPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Navigation />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center text-gray-600">
            Loading assessment...
          </div>
        }
      >
        <AssessmentContent />
      </Suspense>
    </main>
  )
}



