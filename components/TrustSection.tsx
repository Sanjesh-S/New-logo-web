'use client'

import { motion } from 'framer-motion'
import { Shield, Zap, Package, CheckCircle } from 'lucide-react'

const trustPoints = [
  {
    icon: Zap,
    title: 'Instant Valuation',
    description: 'Get your device value in seconds',
    gradient: 'from-brand-blue-500 via-brand-blue-600 to-brand-lime',
    bgGradient: 'from-brand-blue-50 via-brand-lime-50 to-brand-blue-50',
    glow: 'shadow-brand-blue-200/50',
  },
  {
    icon: Shield,
    title: 'Safe & Secure',
    description: 'Your data is protected',
    gradient: 'from-brand-blue-600 via-brand-blue-700 to-brand-lime',
    bgGradient: 'from-brand-blue-50 via-brand-lime-50 to-brand-blue-50',
    glow: 'shadow-brand-blue-200/50',
  },
  {
    icon: Package,
    title: 'Free Pickup',
    description: 'We collect from your doorstep',
    gradient: 'from-brand-lime via-brand-lime-400 to-brand-blue-500',
    bgGradient: 'from-brand-lime-50 via-brand-blue-50 to-brand-lime-50',
    glow: 'shadow-brand-lime-200/50',
  },
  {
    icon: CheckCircle,
    title: 'Transparent Pricing',
    description: 'No hidden charges',
    gradient: 'from-brand-blue-500 via-brand-lime to-brand-blue-600',
    bgGradient: 'from-brand-blue-50 via-brand-lime-50 to-brand-blue-50',
    glow: 'shadow-brand-lime-200/50',
  },
]

export default function TrustSection() {
  return (
    <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-gray-50 via-white to-gray-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-brand-lime/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-12 md:mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block mb-4"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-blue-100 to-brand-lime-100 rounded-full text-brand-blue-900 font-semibold text-sm">
              <Shield className="w-4 h-4 text-brand-lime" />
              Trusted Service
            </span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-brand-blue-900 mb-4 bg-gradient-to-r from-brand-blue-900 via-brand-blue-700 to-brand-blue-900 bg-clip-text text-transparent">
            Why Choose Us?
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Experience the difference with our trusted trade-in service
          </p>
        </motion.div>

        {/* Desktop: Modern grid with enhanced cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {trustPoints.map((point, index) => {
            const Icon = point.icon

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ 
                  delay: index * 0.15, 
                  duration: 0.6,
                  type: 'spring',
                  stiffness: 100
                }}
                whileHover={{ 
                  scale: 1.05, 
                  y: -10,
                  rotateY: 5,
                }}
                className="group relative"
              >
                {/* Glow effect on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${point.gradient} rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 -z-10`} />
                
                <div className={`relative bg-white rounded-3xl p-8 h-full border-2 border-gray-100 hover:border-transparent transition-all duration-300 shadow-lg hover:shadow-2xl bg-gradient-to-br ${point.bgGradient} backdrop-blur-sm`}>
                  {/* Icon container with animated gradient */}
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                    className="relative mb-6"
                  >
                    <div className={`w-20 h-20 bg-gradient-to-br ${point.gradient} rounded-2xl flex items-center justify-center shadow-xl ${point.glow} group-hover:shadow-2xl transition-shadow duration-300`}>
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    {/* Decorative circle */}
                    {point.title === 'Safe & Secure' ? (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-brand-lime rounded-full opacity-60 blur-sm" />
                    ) : (
                      <div className={`absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br ${point.gradient} rounded-full opacity-60 blur-sm`} />
                    )}
                  </motion.div>

                  <h3 className="text-xl md:text-2xl font-bold text-brand-blue-900 mb-3 group-hover:text-brand-blue-700 transition-colors">
                    {point.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-base md:text-lg">
                    {point.description}
                  </p>

                  {/* Bottom accent line */}
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '100%' }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15 + 0.3, duration: 0.6 }}
                    className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${point.gradient} rounded-b-3xl`}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Additional trust indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-16 md:mt-20 flex flex-wrap justify-center items-center gap-8 md:gap-12 text-center"
        >
          <div className="flex flex-col items-center">
            <div className="text-3xl md:text-4xl font-bold text-brand-blue-900 mb-1">10K+</div>
            <div className="text-sm md:text-base text-gray-600">Happy Customers</div>
          </div>
          <div className="hidden md:block w-px h-12 bg-gray-300" />
          <div className="flex flex-col items-center">
            <div className="text-3xl md:text-4xl font-bold text-brand-blue-900 mb-1">4.8★</div>
            <div className="text-sm md:text-base text-gray-600">Average Rating</div>
          </div>
          <div className="hidden md:block w-px h-12 bg-gray-300" />
          <div className="flex flex-col items-center">
            <div className="text-3xl md:text-4xl font-bold text-brand-blue-900 mb-1">24/7</div>
            <div className="text-sm md:text-base text-gray-600">Support Available</div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
