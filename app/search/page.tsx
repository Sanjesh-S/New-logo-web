'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { motion } from 'framer-motion'
import { Search, AlertCircle } from 'lucide-react'
import { getAllProducts, type Product } from '@/lib/firebase/database'
import ProductCard from '@/components/ProductCard'
import Link from 'next/link'

function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || searchParams.get('search') || ''
  
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        const allProducts = await getAllProducts()
        setProducts(allProducts)
      } catch (err: any) {
        setError(err.message || 'Failed to load products')
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  useEffect(() => {
    if (query.trim() && products.length > 0) {
      const searchQuery = query.toLowerCase().trim()
      const filtered = products.filter((product) => {
        const modelMatch = product.modelName?.toLowerCase().includes(searchQuery)
        const brandMatch = product.brand?.toLowerCase().includes(searchQuery)
        const categoryMatch = product.category?.toLowerCase().includes(searchQuery)
        return modelMatch || brandMatch || categoryMatch
      })
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts([])
    }
  }, [query, products])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-lime border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 px-4">
        <div className="max-w-xl mx-auto bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-red-700 mb-2">Error loading products</h2>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 md:pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-brand-blue-900 mb-4">
            {query ? `Search Results for "${query}"` : 'Search Products'}
          </h1>
          {query && (
            <p className="text-gray-600 text-lg">
              Found {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'}
            </p>
          )}
        </div>

        {/* Results */}
        {!query ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="w-16 h-16 text-gray-300 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Enter a search query</h2>
            <p className="text-gray-600 mb-6 max-w-md">
              Search for devices by brand, model, or category name.
            </p>
            <Link
              href="/"
              className="px-6 py-3 bg-brand-blue-600 text-white rounded-xl font-semibold hover:bg-brand-blue-700 transition-colors"
            >
              Go to Home
            </Link>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="w-16 h-16 text-gray-300 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No results found</h2>
            <p className="text-gray-600 mb-6 max-w-md">
              We couldn&apos;t find any products matching &quot;{query}&quot;. Try a different search term.
            </p>
            <Link
              href="/"
              className="px-6 py-3 bg-brand-blue-600 text-white rounded-xl font-semibold hover:bg-brand-blue-700 transition-colors"
            >
              Go to Home
            </Link>
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
                modelName={product.modelName || ''}
                basePrice={product.basePrice}
                brand={product.brand}
                productId={product.id}
                category={product.category?.toLowerCase() || 'cameras'}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gray-50">
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center pt-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading search...</p>
            </div>
          </div>
        }>
          <SearchContent />
        </Suspense>
      </main>
    </>
  )
}
