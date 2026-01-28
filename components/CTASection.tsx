'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'

export default function CTASection() {
  return (
    <section className="py-16 md:py-24 px-4 bg-gradient-to-br from-brand-blue-900 via-brand-blue-800 to-brand-blue-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-lime/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-blue-500/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-brand-lime font-medium text-sm mb-6"
        >
          <Sparkles className="w-4 h-4" />
          Limited Time: Extra 5% on all trade-ins!
        </motion.div>

        <motion.h2
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          Ready to Trade In Your Device?
        </motion.h2>

        <motion.p
          className="text-lg md:text-xl lg:text-2xl text-gray-300 mb-8 md:mb-12 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          Get your instant quote now. No commitments, no hassle.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <a 
            href="#trade-in"
            onClick={(e) => {
              e.preventDefault()
              const element = document.querySelector('#trade-in')
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            }}
          >
            <button className="px-8 md:px-12 py-4 md:py-5 bg-brand-lime text-brand-blue-900 text-lg md:text-xl font-bold rounded-xl hover:bg-brand-lime-400 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center gap-3 justify-center">
              Get Your Quote
              <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </a>

          <a
            href="https://wa.me/919843010705"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 md:px-12 py-4 md:py-5 bg-white/10 text-white text-lg md:text-xl font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20 flex items-center gap-3 justify-center"
          >
            Chat with Us
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-gray-400 text-sm"
        >
          ✓ Instant valuation ✓ Free doorstep pickup ✓ Same-day payment
        </motion.p>
      </div>
    </section>
  )
}
