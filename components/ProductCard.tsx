'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface ProductCardProps {
  imageUrl?: string
  modelName: string
  basePrice: number
  brand?: string
  productId?: string
  category?: string
}

export default function ProductCard({
  imageUrl,
  modelName,
  basePrice,
  brand,
  productId,
  category,
}: ProductCardProps) {
  const displayPrice = basePrice.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  })

  // Build product detail URL
  const productDetailUrl = productId && category && brand
    ? `/product?id=${encodeURIComponent(productId)}&category=${encodeURIComponent(category)}&brand=${encodeURIComponent(brand)}`
    : '#'

  return (
    <Link href={productDetailUrl} className="block">
      <motion.article
        whileHover={{ y: -2 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group cursor-pointer"
      >
        {/* Product Image */}
        <div className="relative w-full aspect-square bg-gray-50">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={modelName}
              fill
              sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-contain p-3"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
              No image
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4 flex flex-col gap-3 flex-1">
          <div className="flex-1">
            <h2 className="text-sm md:text-base font-semibold text-brand-blue-900 line-clamp-2 mb-2">
              {modelName}
            </h2>
            {brand && (
              <p className="text-xs font-medium text-brand-lime uppercase tracking-wide mb-2">
                {brand}
              </p>
            )}
          </div>

          {/* Check Price Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-2.5 px-4 bg-brand-blue-900 text-white rounded-lg font-semibold text-sm hover:bg-brand-blue-800 transition-colors shadow-sm text-center"
          >
            Check Price
          </motion.div>
        </div>
      </motion.article>
    </Link>
  )
}


