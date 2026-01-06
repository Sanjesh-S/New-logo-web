'use client'

import { Suspense } from 'react'
import TradeInFlow from '@/components/TradeInFlow'
import Navigation from '@/components/Navigation'

function TradeInContent() {
  return <TradeInFlow />
}

export default function TradeInPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Navigation />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading...</div>}>
        <TradeInContent />
      </Suspense>
    </main>
  )
}

