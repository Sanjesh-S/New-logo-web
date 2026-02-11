'use client'

import { motion } from 'framer-motion'
import { CheckCircle, Phone, MapPin } from 'lucide-react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import { Suspense } from 'react'

const showrooms = [
  { city: 'COIMBATORE', phone: '98430 10705' },
  { city: 'TIRUCHIRAPPALLI', phone: '98430 10774' },
  { city: 'MADURAI', phone: '98430 10781' },
  { city: 'CHENNAI', phone: '98430 10716' },
]

function ConfirmationContent() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 md:pt-24 pb-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl w-full"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-24 h-24 bg-gradient-to-br from-brand-lime to-brand-lime-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
        >
          <CheckCircle className="w-12 h-12 text-white" />
        </motion.div>

        {/* Main Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-brand-blue-900 mb-4">
            We Have Received Your Enquiry!
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-2">
            Thank you for your interest in trading your device.
          </p>
          <p className="text-base md:text-lg text-gray-700 font-semibold">
            Please call our showroom for more details and exact pricing.
          </p>
        </motion.div>

        {/* Showroom Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-xl md:text-2xl font-bold text-brand-blue-900 text-center mb-6">
            Contact Our Showrooms
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {showrooms.map((showroom, index) => (
              <motion.div
                key={showroom.city}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="bg-gradient-to-br from-brand-blue-50 to-brand-lime/10 border-2 border-brand-lime/30 rounded-xl p-6 hover:shadow-lg transition-all hover:scale-105"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-brand-lime/20 rounded-full flex items-center justify-center mb-3">
                    <MapPin className="w-6 h-6 text-brand-blue-600" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-brand-blue-900 mb-3 uppercase">
                    {showroom.city}
                  </h3>
                  <a
                    href={`tel:+91${showroom.phone.replace(/\s/g, '')}`}
                    className="flex items-center gap-2 text-xl md:text-2xl font-bold text-brand-blue-900 hover:text-brand-blue-700 transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    {showroom.phone}
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/"
            className="px-6 py-3 bg-gradient-to-br from-brand-blue-600 to-brand-lime text-white rounded-lg font-semibold hover:opacity-90 transition-opacity text-center"
          >
            Back to Home
          </Link>
          <Link
            href="/#trade-in"
            className="px-6 py-3 border-2 border-brand-blue-600 text-brand-blue-900 rounded-lg font-semibold hover:bg-brand-blue-50 transition-colors text-center"
          >
            Browse Other Categories
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default function LaptopTabletConfirmationPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Navigation />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-gray-600">Loading...</div>
        </div>
      }>
        <ConfirmationContent />
      </Suspense>
    </main>
  )
}
