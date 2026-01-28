'use client'

import { motion } from 'framer-motion'
import { Camera, Smartphone, Laptop, Tablet, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const categories = [
  {
    id: 'cameras',
    name: 'Camera / DSLR',
    icon: Camera,
    description: 'Canon, Nikon, Sony, Fujifilm',
    color: 'from-brand-blue-600 to-brand-lime',
    bgColor: 'bg-brand-blue-500/10',
    available: true,
  },
  {
    id: 'phones',
    name: 'Phone',
    icon: Smartphone,
    description: 'Coming Soon',
    color: 'from-brand-lime to-brand-lime-400',
    bgColor: 'bg-brand-lime/10',
    available: false,
  },
  {
    id: 'laptops',
    name: 'Laptop',
    icon: Laptop,
    description: 'Coming Soon',
    color: 'from-brand-blue-500 to-brand-lime-500',
    bgColor: 'bg-brand-blue-500/10',
    available: false,
  },
  {
    id: 'tablets',
    name: 'Tablet',
    icon: Tablet,
    description: 'Coming Soon',
    color: 'from-brand-blue-600 to-brand-lime-400',
    bgColor: 'bg-brand-blue-500/10',
    available: false,
  },
]

export default function CategorySection() {
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
            Select a category to get started
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
          {categories.map((category, index) => {
            const Icon = category.icon

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
              >
                {category.available ? (
                  <Link href={`/trade-in?category=${category.id}`}>
                    <div className="relative h-48 md:h-56 bg-white rounded-xl border-2 border-gray-200 hover:border-brand-lime transition-all cursor-pointer shadow-sm hover:shadow-md">
                      <div className="h-full flex flex-col items-center justify-center p-6">
                        <div className={`w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4`}>
                          <Icon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-brand-blue-900 mb-2">
                          {category.name}
                        </h3>
                        <p className="text-sm md:text-base text-gray-600 text-center mb-4">
                          {category.description}
                        </p>
                        <div className="flex items-center gap-2 text-brand-lime font-semibold text-sm md:text-base">
                          <span>Get Started</span>
                          <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="relative h-48 md:h-56 bg-white rounded-xl border-2 border-gray-200 opacity-60">
                    <div className="h-full flex flex-col items-center justify-center p-6">
                      <div className={`w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 opacity-50`}>
                        <Icon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-brand-blue-900 mb-2">
                        {category.name}
                      </h3>
                      <p className="text-sm md:text-base text-gray-600 text-center">
                        {category.description}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}


