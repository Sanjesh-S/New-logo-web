'use client'

import { motion } from 'framer-motion'
import { Search, ClipboardCheck, Truck, Banknote, ArrowRight } from 'lucide-react'

const steps = [
  {
    id: 1,
    title: 'Select Device',
    description: 'Choose your device brand and model from our catalog',
    icon: Search,
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-50 to-cyan-50',
  },
  {
    id: 2,
    title: 'Check Price',
    description: 'Answer quick questions and see your instant valuation',
    icon: ClipboardCheck,
    gradient: 'from-cyan-500 to-lime-500',
    bgGradient: 'from-cyan-50 to-lime-50',
  },
  {
    id: 3,
    title: 'Free Pickup',
    description: 'Schedule a convenient time for doorstep collection',
    icon: Truck,
    gradient: 'from-lime-500 to-green-500',
    bgGradient: 'from-lime-50 to-green-50',
  },
  {
    id: 4,
    title: 'Get Paid',
    description: 'Receive same-day payment via bank transfer or UPI',
    icon: Banknote,
    gradient: 'from-green-500 to-emerald-500',
    bgGradient: 'from-green-50 to-emerald-50',
  },
]

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 md:py-24 px-4 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-brand-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-brand-lime/5 rounded-full blur-3xl" />
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
              <span className="w-2 h-2 bg-brand-lime rounded-full animate-pulse" />
              Simple Process
            </span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-brand-blue-900 mb-4 bg-gradient-to-r from-brand-blue-900 via-brand-blue-700 to-brand-blue-900 bg-clip-text text-transparent">
            How It Works
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Get paid in 4 simple steps. No hassle, no hidden fees.
          </p>
        </motion.div>

        {/* Desktop: Modern staggered grid */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-2 gap-6 relative">
            {/* Animated connecting line */}
            <motion.div
              className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-brand-blue-500 via-brand-lime to-brand-blue-500 rounded-full opacity-20"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, delay: 0.3 }}
            />

            {steps.map((step, index) => {
              const Icon = step.icon
              const isEven = index % 2 === 1
              
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2, duration: 0.6, type: 'spring' }}
                  className={`relative ${isEven ? 'mt-16' : ''}`}
                >
                  <motion.div
                    whileHover={{ scale: 1.05, y: -8 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className={`relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-brand-lime/30 bg-gradient-to-br ${step.bgGradient} backdrop-blur-sm`}
                  >
                    {/* Step number badge */}
                    <div className={`absolute -top-4 -left-4 w-16 h-16 bg-gradient-to-br ${step.gradient} rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-xl z-20`}>
                      {step.id}
                    </div>

                    {/* Icon container */}
                    <div className="mb-6 mt-4">
                      <div className={`w-20 h-20 bg-gradient-to-br ${step.gradient} rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 group-hover:rotate-0 transition-transform`}>
                        <Icon className="w-10 h-10 text-white" />
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-brand-blue-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-700 leading-relaxed text-base">
                      {step.description}
                    </p>

                    {/* Arrow connector (except last) */}
                    {index < steps.length - 1 && (
                      <div className="absolute top-1/2 -right-3 z-10 hidden xl:block">
                        <motion.div
                          animate={{ x: [0, 8, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                          className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-brand-lime"
                        >
                          <ArrowRight className="w-6 h-6 text-brand-lime" />
                        </motion.div>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Tablet: 2x2 grid */}
        <div className="hidden md:block lg:hidden">
          <div className="grid grid-cols-2 gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15, duration: 0.5 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                  className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border-2 border-gray-100 hover:border-brand-lime/50"
                >
                  <div className={`absolute -top-3 -left-3 w-12 h-12 bg-gradient-to-br ${step.gradient} rounded-xl flex items-center justify-center text-white font-bold shadow-lg`}>
                    {step.id}
                  </div>
                  <div className={`w-16 h-16 bg-gradient-to-br ${step.gradient} rounded-xl flex items-center justify-center mb-4 mt-2`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-brand-blue-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Mobile: Vertical timeline */}
        <div className="md:hidden space-y-6">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="relative"
              >
                {/* Timeline line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-8 top-20 bottom-0 w-0.5 bg-gradient-to-b from-brand-blue-500 to-brand-lime" />
                )}

                <div className="flex gap-4 items-start">
                  {/* Icon and number */}
                  <div className="relative flex-shrink-0">
                    <div className={`w-16 h-16 bg-gradient-to-br ${step.gradient} rounded-2xl flex items-center justify-center shadow-lg relative z-10`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className={`absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br ${step.gradient} rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md z-20`}>
                      {step.id}
                    </div>
                  </div>

                  {/* Content */}
                  <motion.div
                    whileHover={{ x: 5 }}
                    className="flex-1 bg-white rounded-2xl p-5 shadow-md border-2 border-gray-100"
                  >
                    <h3 className="text-lg font-bold text-brand-blue-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
