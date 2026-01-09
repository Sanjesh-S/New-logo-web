'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Search, AlertCircle, RefreshCw } from 'lucide-react'
import type { Product } from '@/lib/firebase/database'
import { getProductsByBrand } from '@/lib/firebase/database'
import ProductCard from './ProductCard'

interface ProductsGridProps {
  category: string
  brand: string
}

export default function ProductsGrid({ category, brand }: ProductsGridProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      const items = await getProductsByBrand(category, brand)
      setProducts(items)
    } catch (err: any) {
      setError(err.message || 'Something went wrong while loading products.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (category && brand) {
      fetchProducts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, brand])

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return products
    }
    const query = searchQuery.toLowerCase()
    return products.filter((product) =>
      product.modelName.toLowerCase().includes(query)
    )
  }, [products, searchQuery])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-12 h-12 border-4 border-brand-lime border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-600">Loading products...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-10">
        <div className="max-w-xl mx-auto bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col items-center text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mb-3" />
          <h2 className="text-lg font-semibold text-red-700 mb-2">
            Couldn&apos;t load products
          </h2>
          <p className="text-sm text-red-600 mb-4">
            {error}
          </p>
          <button
            type="button"
            onClick={fetchProducts}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!products.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h2 className="text-2xl font-semibold text-brand-blue-900 mb-3">
          No products found for this brand
        </h2>
        <p className="text-gray-600 mb-6 max-w-md">
          We couldn&apos;t find any devices for this brand in the selected category.
          You can go back and pick a different brand.
        </p>
        <Link
          href={`/brands?category=${encodeURIComponent(category)}`}
          className="px-5 py-3 rounded-lg bg-white border-2 border-gray-200 text-brand-blue-900 font-semibold hover:border-brand-lime hover:bg-gray-50 transition-colors"
        >
          Back to brands
        </Link>
      </div>
    )
  }

  return (
    <section className="pb-16">
      {/* Search Bar */}
      <div className="mb-8 md:mb-10 max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a model"
            className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-lime focus:ring-4 focus:ring-brand-lime/20 text-gray-900 shadow-sm transition-all text-base"
          />
        </div>
        {searchQuery && (
          <p className="mt-3 text-sm text-gray-600 text-center">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
          </p>
        )}
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h2 className="text-xl font-semibold text-brand-blue-900 mb-2">
            No products match your search
          </h2>
          <p className="text-gray-600 mb-4">
            Try adjusting your search terms.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="px-5 py-2 rounded-lg bg-white border-2 border-gray-200 text-brand-blue-900 font-semibold hover:border-brand-lime hover:bg-gray-50 transition-colors"
          >
            Clear search
          </button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5"
        >
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              imageUrl={product.imageUrl}
              modelName={product.modelName}
              basePrice={product.basePrice}
              brand={product.brand}
              productId={product.id}
              category={category}
            />
          ))}
        </motion.div>
      )}
    </section>
  )
}


