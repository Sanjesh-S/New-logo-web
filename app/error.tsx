'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import Navigation from '@/components/Navigation'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console or error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <>
      <Navigation />
      <main id="main-content" className="min-h-screen bg-gray-50 pt-20 md:pt-24 flex items-center justify-center px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-brand-blue-900 mb-4">
              Something went wrong!
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              We encountered an unexpected error. Don't worry, our team has been notified.
            </p>
            {process.env.NODE_ENV === 'development' && error.message && (
              <p className="text-sm text-gray-500 mt-4 p-4 bg-gray-100 rounded-lg font-mono text-left">
                {error.message}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-900 text-white rounded-lg font-semibold hover:bg-brand-blue-800 transition-colors shadow-md hover:shadow-lg"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-blue-900 border-2 border-brand-blue-900 rounded-lg font-semibold hover:bg-brand-blue-50 transition-colors"
            >
              <Home className="w-5 h-5" />
              Go to Home
            </Link>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">
              If this problem persists, please contact our support team.
            </p>
            <a
              href="tel:+919843010746"
              className="text-brand-blue-600 hover:text-brand-blue-700 underline text-sm"
            >
              +91 98430 10746
            </a>
            {' | '}
            <a
              href="mailto:office@worthyten.com"
              className="text-brand-blue-600 hover:text-brand-blue-700 underline text-sm"
            >
              office@worthyten.com
            </a>
          </div>
        </div>
      </main>
    </>
  )
}
