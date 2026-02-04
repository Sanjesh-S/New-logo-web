import Link from 'next/link'
import { Home, Search, ArrowLeft } from 'lucide-react'
import Navigation from '@/components/Navigation'

export default function NotFound() {
  return (
    <>
      <Navigation />
      <main id="main-content" className="min-h-screen bg-gray-50 pt-20 md:pt-24 flex items-center justify-center px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-brand-blue-900 mb-4">404</h1>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue-900 mb-4">
              Page Not Found
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or doesn't exist.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-900 text-white rounded-lg font-semibold hover:bg-brand-blue-800 transition-colors shadow-md hover:shadow-lg"
            >
              <Home className="w-5 h-5" />
              Go to Home
            </Link>
            <Link
              href="/brands"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-blue-900 border-2 border-brand-blue-900 rounded-lg font-semibold hover:bg-brand-blue-50 transition-colors"
            >
              <Search className="w-5 h-5" />
              Browse Products
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </button>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">Popular Pages:</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/trade-in" className="text-brand-blue-600 hover:text-brand-blue-700 underline text-sm">
                Trade In
              </Link>
              <Link href="/#how-it-works" className="text-brand-blue-600 hover:text-brand-blue-700 underline text-sm">
                How It Works
              </Link>
              <Link href="/#faq" className="text-brand-blue-600 hover:text-brand-blue-700 underline text-sm">
                FAQ
              </Link>
              <Link href="/privacy-policy" className="text-brand-blue-600 hover:text-brand-blue-700 underline text-sm">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
