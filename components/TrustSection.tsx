'use client'

import { motion } from 'framer-motion'
import { Shield, Zap, Package, CheckCircle } from 'lucide-react'

const trustPoints = [
  {
    icon: Zap,
    title: 'Instant Valuation',
    description: 'Get your device value in seconds',
    color: 'from-brand-lime to-brand-lime-400',
  },
  {
    icon: Shield,
    title: 'Safe & Secure',
    description: 'Your data is protected',
    color: 'from-brand-blue-500 to-brand-blue-600',
  },
  {
    icon: Package,
    title: 'Free Pickup',
    description: 'We collect from your doorstep',
    color: 'from-brand-lime-500 to-brand-lime-600',
  },
  {
    icon: CheckCircle,
    title: 'Transparent Pricing',
    description: 'No hidden charges',
    color: 'from-brand-blue-400 to-brand-lime',
  },
]

export default function TrustSection() {
  return (
    <section className="py-12 md:py-24 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-8 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-brand-blue-900 mb-2 md:mb-4">
            Why Choose Us?
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustPoints.map((point, index) => {
            const Icon = point.icon

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="bg-white border-2 border-gray-200 rounded-xl p-6 text-center hover:border-brand-lime transition-colors"
              >
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${point.color} flex items-center justify-center mx-auto mb-4`}>
                  <Icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-brand-blue-900 mb-2">
                  {point.title}
                </h3>
                <p className="text-sm md:text-base text-gray-600">
                  {point.description}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}


