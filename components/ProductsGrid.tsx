'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { AlertCircle, RefreshCw } from 'lucide-react'
import type { Product } from '@/lib/firebase/database'
import { getProductsByBrand } from '@/lib/firebase/database'
import { dataCache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache'
import ProductCard from './ProductCard'
import EnhancedSearch from './EnhancedSearch'
import { ProductGridSkeleton } from './ui/Skeleton'

interface ProductsGridProps {
  category: string
  brand: string
}

export default function ProductsGrid({ category, brand }: ProductsGridProps) {
  // Check cache synchronously on initial render
  const cacheKey = CACHE_KEYS.PRODUCTS_BY_BRAND(category, brand)
  const cachedProducts = dataCache.get<Product[]>(cacheKey)
  
  const [products, setProducts] = useState<Product[]>(cachedProducts || [])
  const [loading, setLoading] = useState(!cachedProducts)
  const [error, setError] = useState<string | null>(null)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(cachedProducts || [])
  const fetchedRef = useRef(false)

  const fetchProducts = async (forceRefresh = false) => {
    const cacheKey = CACHE_KEYS.PRODUCTS_BY_BRAND(category, brand)
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = dataCache.get<Product[]>(cacheKey)
      if (cached) {
        setProducts(cached)
        setFilteredProducts(cached)
        setLoading(false)
        return
      }
    }

    try {
      setLoading(true)
      setError(null)

      const items = await getProductsByBrand(category, brand)
      
      // Cache the results
      dataCache.set(cacheKey, items, CACHE_TTL.MEDIUM)
      
      setProducts(items)
      setFilteredProducts(items)
    } catch (err: any) {
      setError(err.message || 'Something went wrong while loading products.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (category && brand && !fetchedRef.current) {
      fetchedRef.current = true
      // Only fetch if we don't have cached data
      if (!cachedProducts) {
        fetchProducts()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, brand])

  // Initialize filtered products with all products
  useEffect(() => {
    setFilteredProducts(products)
  }, [products])

  if (loading) {
    return (
      <section className="pb-16">
        <div className="mb-8 md:mb-10">
          <div className="relative max-w-2xl mx-auto">
            <div className="h-14 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </div>
        <ProductGridSkeleton count={10} />
      </section>
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
      {/* Enhanced Search */}
      <div className="mb-8 md:mb-10">
        <EnhancedSearch
          products={products}
          onFilteredProductsChange={setFilteredProducts}
          placeholder={`Search ${brand} devices...`}
          showSuggestions={true}
          showFilters={false}
          showSort={false}
        />
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h2 className="text-xl font-semibold text-brand-blue-900 mb-2">
            No products found
          </h2>
          <p className="text-gray-600 mb-4">
            Try adjusting your search or filters.
          </p>
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


