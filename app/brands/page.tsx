'use client'

import { Suspense } from 'react'
import Navigation from '@/components/Navigation'
import BrandsSelection from '@/components/BrandsSelection'

function BrandsContent() {
  return <BrandsSelection />
}

export default function BrandsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Navigation />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-gray-600">Loading...</div>
        </div>
      }>
        <BrandsContent />
      </Suspense>
    </main>
  )
}




