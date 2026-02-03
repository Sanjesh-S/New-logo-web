'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { getAssetPath } from '@/lib/utils'

const categories = [
  {
    id: 'cameras',
    name: 'Camera / DSLR',
    image: '/Icons/DSLR.webp',
    description: 'Canon, Nikon, Sony, Fujifilm',
    color: 'from-brand-blue-600 to-brand-lime',
    bgColor: 'bg-brand-blue-500/10',
    available: true,
  },
  {
    id: 'phones',
    name: 'Phone',
    image: '/Icons/phone.webp',
    description: 'Coming Soon',
    color: 'from-brand-lime to-brand-lime-400',
    bgColor: 'bg-brand-lime/10',
    available: false,
  },
  {
    id: 'laptops',
    name: 'Laptop',
    image: '/Icons/Laptop.webp',
    description: 'Coming Soon',
    color: 'from-brand-blue-500 to-brand-lime-500',
    bgColor: 'bg-brand-blue-500/10',
    available: false,
  },
  {
    id: 'tablets',
    name: 'Tablet',
    image: '/Icons/Tablet.webp',
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
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-brand-blue-900 mb-2 md:mb-4">
            Select a category to get started
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-6xl mx-auto">
          {categories.map((category, index) => {
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.3, ease: 'easeOut' }}
              >
                {category.available ? (
                  <Link href={`/trade-in?category=${category.id}`} prefetch={true}>
                    <div className="relative h-64 md:h-80 transition-all cursor-pointer group">
                      <div className="h-full flex flex-col items-center justify-center p-6 md:p-8">
                        <div className="flex-1 flex items-center justify-center w-full mb-4">
                          <Image
                            src={getAssetPath(category.image)}
                            alt={category.name}
                            width={200}
                            height={200}
                            className="w-full h-full max-w-[180px] md:max-w-[220px] object-contain group-hover:scale-105 transition-transform duration-300 will-change-transform"
                            loading="lazy"
                          />
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-brand-blue-900 text-center">
                          {category.name}
                        </h3>
                        {category.description && category.description !== 'Coming Soon' && (
                          <p className="text-sm text-gray-500 text-center mt-1">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="relative h-64 md:h-80 opacity-60">
                    <div className="h-full flex flex-col items-center justify-center p-6 md:p-8">
                      <div className="flex-1 flex items-center justify-center w-full mb-4">
                        <Image
                          src={getAssetPath(category.image)}
                          alt={category.name}
                          width={200}
                          height={200}
                          className="w-full h-full max-w-[180px] md:max-w-[220px] object-contain opacity-50"
                        />
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-brand-blue-900 text-center">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-sm text-gray-500 text-center mt-1">
                          {category.description}
                        </p>
                      )}
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


