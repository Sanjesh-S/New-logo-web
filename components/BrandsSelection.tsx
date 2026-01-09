'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Device {
  id: string
  brand: string
  model: string
  category: string
  basePrice: number
}

const categoryNames: Record<string, string> = {
  cameras: 'DSLR',
  phones: 'Phone',
  laptops: 'Laptop',
  tablets: 'iPad/Tablet',
}

// Static brands data for each category
const staticBrands: Record<string, string[]> = {
  cameras: ['Canon', 'Fujifilm', 'GoPro', 'Nikon', 'Sony'],
  phones: ['Apple', 'Samsung'],
  laptops: ['Apple'],
  tablets: ['Apple'],
}

export default function BrandsSelection() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const category = searchParams.get('category') || 'cameras'
  const [devices, setDevices] = useState<Device[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [filteredBrands, setFilteredBrands] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true)
        setError(null)

        // First try to fetch from API
        try {
          const response = await fetch(`/api/devices?category=${category}`)

          if (response.ok) {
            const data = await response.json()
            const apiDevices = data.devices || []
            setDevices(apiDevices)

            if (apiDevices.length > 0) {
              // Extract unique brands from API
              const uniqueBrands = Array.from(
                new Set(apiDevices.map((device: Device) => device.brand))
              ).sort() as string[]

              setBrands(uniqueBrands)
              setFilteredBrands(uniqueBrands)
              setLoading(false)
              return
            }
          }
        } catch (apiError) {
          console.log('API fetch failed, using static brands')
        }

        // Fallback to static brands if API fails or returns empty
        const fallbackBrands = staticBrands[category] || []
        setBrands(fallbackBrands)
        setFilteredBrands(fallbackBrands)

      } catch (err) {
        // Use static brands as final fallback
        const fallbackBrands = staticBrands[category] || []
        setBrands(fallbackBrands)
        setFilteredBrands(fallbackBrands)
      } finally {
        setLoading(false)
      }
    }

    fetchDevices()
  }, [category])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredBrands(brands)
    } else {
      const filtered = brands.filter(brand =>
        brand.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredBrands(filtered)
    }
  }, [searchQuery, brands])

  const handleBrandClick = (brand: string) => {
    router.push(`/products?category=${category}&brand=${encodeURIComponent(brand)}`)
  }

  const categoryName = categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-lime border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading brands...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-lime-50 py-8 md:py-12 px-4 pt-24 md:pt-28">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 md:mb-12"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-brand-blue-900 mb-6 transition-colors px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Categories</span>
          </Link>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-brand-blue-900 mb-2">
            Select {categoryName} Brand
          </h1>
          <p className="text-gray-600 text-lg">Choose the brand of your device to continue</p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div className="relative max-w-md mx-auto md:mx-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a brand"
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-lime focus:ring-4 focus:ring-brand-lime/20 text-gray-900 bg-white shadow-sm"
            />
          </div>
        </motion.div>

        {/* Or choose a brand text */}
        {filteredBrands.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-gray-600 mb-6 font-medium"
          >
            Or choose a brand
          </motion.p>
        )}

        {/* Brands Grid */}
        {filteredBrands.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6"
          >
            {filteredBrands.map((brand, index) => (
              <motion.button
                key={brand}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index, duration: 0.3 }}
                onClick={() => handleBrandClick(brand)}
                className="p-6 md:p-8 bg-white border-2 border-gray-200 rounded-2xl hover:border-brand-lime hover:shadow-lg transition-all text-center group"
              >
                <div className="text-2xl md:text-3xl font-bold text-brand-blue-900 group-hover:text-brand-lime transition-colors mb-2">
                  {brand}
                </div>
                <div className="text-sm text-gray-500">
                  {brand}
                </div>
              </motion.button>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-600 mb-4">
              {searchQuery ? 'No brands found matching your search.' : 'No brands available for this category.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-brand-lime hover:text-brand-lime-400 font-semibold"
              >
                Clear search
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}





