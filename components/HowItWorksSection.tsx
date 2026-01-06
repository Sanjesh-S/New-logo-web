'use client'

import { motion } from 'framer-motion'
import { Search, ClipboardCheck, Truck, Banknote } from 'lucide-react'

const steps = [
  {
    id: 1,
    title: 'Select Device',
    description: 'Choose your device brand and model from our catalog',
    icon: Search,
  },
  {
    id: 2,
    title: 'Get Quote',
    description: 'Answer quick questions and see your instant valuation',
    icon: ClipboardCheck,
  },
  {
    id: 3,
    title: 'Free Pickup',
    description: 'Schedule a convenient time for doorstep collection',
    icon: Truck,
  },
  {
    id: 4,
    title: 'Get Paid',
    description: 'Receive same-day payment via bank transfer or UPI',
    icon: Banknote,
  },
]

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 md:py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-brand-blue-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Get paid in 4 simple steps. No hassle, no hidden fees.
          </p>
        </motion.div>

        {/* Desktop: Horizontal timeline */}
        <div className="hidden md:block relative">
          {/* Connection line */}
          <div className="absolute top-16 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-brand-blue-500 via-brand-lime to-brand-blue-500" />

          <div className="grid grid-cols-4 gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15, duration: 0.4 }}
                  className="relative text-center"
                >
                  {/* Icon circle */}
                  <div className="relative z-10 w-32 h-32 mx-auto mb-6 bg-white rounded-2xl border-2 border-gray-100 shadow-lg flex items-center justify-center group hover:border-brand-lime hover:shadow-xl transition-all">
                    <div className="w-20 h-20 bg-gradient-to-br from-brand-blue-500 to-brand-lime rounded-xl flex items-center justify-center">
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    {/* Step number */}
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-brand-blue-900 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {step.id}
                    </div>
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

        {/* Mobile: Vertical list */}
        <div className="md:hidden space-y-6">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="flex gap-4 items-start"
              >
                <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-brand-blue-500 to-brand-lime rounded-xl flex items-center justify-center relative">
                  <Icon className="w-8 h-8 text-white" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-brand-blue-900 rounded-full flex items-center justify-center text-white font-bold text-xs">
                    {step.id}
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-lg font-bold text-brand-blue-900 mb-1">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
