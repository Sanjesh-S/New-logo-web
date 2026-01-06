'use client'

import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const value = searchParams.get('value')
  const id = searchParams.get('id')

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 md:pt-24">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-24 h-24 bg-gradient-to-br from-brand-lime to-brand-lime-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
        >
          <CheckCircle className="w-12 h-12 text-white" />
        </motion.div>

        <h1 className="text-3xl md:text-4xl font-bold text-brand-blue-900 mb-4">
          Valuation Submitted!
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-8">
          We've received your trade-in request
        </p>

        {value && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-brand-blue-700 to-brand-lime-600 rounded-2xl p-6 mb-8 glass"
          >
            <div className="text-white/80 text-sm mb-1">Estimated Value</div>
            <div className="text-4xl font-bold text-white">
              ${parseInt(value).toLocaleString()}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <p className="text-gray-600 mb-6 text-sm md:text-base">
            Our team will review your submission and contact you within 24 hours to schedule a pickup.
          </p>
          <Link href="/">
            <motion.button
              className="w-full px-6 py-3 bg-brand-lime text-brand-blue-900 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-brand-lime-400 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Back to Home
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Navigation />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center text-white">
          Loading...
        </div>
      }>
        <SuccessContent />
      </Suspense>
    </main>
  )
}


