'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getBrandLogo } from '@/lib/utils/brandLogos'

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
  cameras: ['Canon', 'Fujifilm', 'GoPro', 'Sony', 'Nikon'],
  phones: ['Apple', 'Samsung'],
  laptops: ['Apple'],
  tablets: ['Apple'],
}

// Cache configuration
const CACHE_PREFIX = 'brands_cache_'
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes
const API_TIMEOUT = 5000 // 5 seconds

interface CacheEntry {
  brands: string[]
  timestamp: number
}

// Client-side cache utilities
const getCachedBrands = (category: string): string[] | null => {
  if (typeof window === 'undefined') return null
  
  try {
    const cacheKey = `${CACHE_PREFIX}${category}`
    const cached = sessionStorage.getItem(cacheKey)
    if (!cached) return null

    const entry: CacheEntry = JSON.parse(cached)
    const now = Date.now()
    
    // Check if cache is still valid
    if (now - entry.timestamp < CACHE_TTL) {
      return entry.brands
    }
    
    // Cache expired, remove it
    sessionStorage.removeItem(cacheKey)
    return null
  } catch (error) {
    console.error('Error reading cache:', error)
    return null
  }
}

const setCachedBrands = (category: string, brands: string[]): void => {
  if (typeof window === 'undefined') return
  
  try {
    const cacheKey = `${CACHE_PREFIX}${category}`
    const entry: CacheEntry = {
      brands,
      timestamp: Date.now(),
    }
    sessionStorage.setItem(cacheKey, JSON.stringify(entry))
  } catch (error) {
    console.error('Error setting cache:', error)
  }
}

// Timeout promise helper
const createTimeoutPromise = (ms: number): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('API request timeout')), ms)
  })
}

export default function BrandsSelection() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const category = searchParams.get('category') || 'cameras'
  
  // Initialize with static brands immediately (optimistic UI)
  const staticBrandsForCategory = staticBrands[category] || []
  const [devices, setDevices] = useState<Device[]>([])
  const [brands, setBrands] = useState<string[]>(staticBrandsForCategory)
  const [filteredBrands, setFilteredBrands] = useState<string[]>(staticBrandsForCategory)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Reset to static brands for new category immediately
    const currentStaticBrands = staticBrands[category] || []
    setBrands(currentStaticBrands)
    setFilteredBrands(currentStaticBrands)

    const fetchDevices = async () => {
      // Check cache first
      const cachedBrands = getCachedBrands(category)
      if (cachedBrands && cachedBrands.length > 0) {
        setBrands(cachedBrands)
        setFilteredBrands(cachedBrands)
        // Still fetch in background to update cache, but don't block UI
      }

      // Fetch API data in background with timeout
      try {
        setError(null)
        
        const { getDevices } = await import('@/lib/api/client')
        
        // Race between API call and timeout
        const apiCall = getDevices({ category })
        const timeoutPromise = createTimeoutPromise(API_TIMEOUT)
        
        const data = await Promise.race([apiCall, timeoutPromise])

        const apiDevices = (data.devices || []) as unknown as Device[]

        if (apiDevices.length > 0) {
          // Extract unique brands from API
          const uniqueBrands = Array.from(
            new Set(apiDevices.map((device: Device) => device.brand))
          ).sort() as string[]

          // Only update if we got brands from API (better than static/cached)
          if (uniqueBrands.length > 0) {
            setDevices(apiDevices)
            setBrands(uniqueBrands)
            setFilteredBrands(uniqueBrands)
            // Cache the successful API response
            setCachedBrands(category, uniqueBrands)
          }
        }
      } catch (apiError) {
        // API failed or timed out - this is fine, we already have static/cached brands
        console.log('API fetch failed or timed out, using cached/static brands', apiError)
        // Don't set error state - we have fallback brands showing
      }
    }
    
    // Fetch in background
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-lime-50 py-8 md:py-12 px-4 pt-24 md:pt-28 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-brand-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-brand-lime/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-brand-blue-200/10 to-brand-lime-200/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 md:mb-10"
        >
          <motion.div
            whileHover={{ x: -5 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-700 hover:text-brand-blue-900 mb-6 transition-all px-5 py-2.5 bg-white/80 backdrop-blur-sm rounded-xl border-2 border-gray-200 hover:border-brand-lime shadow-md hover:shadow-lg"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Categories</span>
            </Link>
          </motion.div>

          <div className="mb-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-brand-blue-900">
              Select {categoryName} Brand
            </h1>
            <p className="text-gray-600 text-lg md:text-xl mt-2">Choose the brand of your device to continue</p>
          </div>
        </motion.div>

        {/* Enhanced Search Bar - Centered */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8 md:mb-10"
        >
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-blue-500/20 to-brand-lime/20 rounded-2xl blur-xl -z-10" />
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a brand..."
                className="w-full pl-16 pr-6 py-5 md:py-6 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-brand-lime focus:ring-4 focus:ring-brand-lime/20 text-gray-900 bg-white/90 backdrop-blur-sm shadow-xl text-lg font-medium transition-all"
              />
            </div>
          </div>
        </motion.div>

        {/* Or choose a brand text - Centered */}
        {filteredBrands.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-6 md:mb-8"
          >
            <div className="flex items-center gap-4 max-w-2xl mx-auto">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
              <p className="text-gray-600 font-semibold text-base md:text-lg whitespace-nowrap">
                Or choose a brand
              </p>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
            </div>
          </motion.div>
        )}

        {/* Brands Display - Horizontal Row, All Visible, No Scrolling */}
        {filteredBrands.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="w-full"
          >
            <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 px-2">
              {filteredBrands.map((brand, index) => {
                const logoPath = getBrandLogo(brand)
                return (
                  <motion.button
                    key={brand}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ 
                      delay: 0.05 * index, 
                      duration: 0.4,
                      type: 'spring',
                      stiffness: 100
                    }}
                    whileHover={{ 
                      scale: 1.08, 
                      y: -6,
                    }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleBrandClick(brand)}
                    className="group relative p-4 md:p-6 bg-white/90 backdrop-blur-sm border-2 border-gray-200 rounded-2xl hover:border-brand-lime transition-all text-center flex flex-col items-center justify-center w-[140px] md:w-[160px] h-[140px] md:h-[160px] shadow-lg hover:shadow-2xl overflow-hidden flex-shrink-0"
                  >
                    {/* Gradient glow on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-blue-500/0 via-brand-lime/0 to-brand-blue-500/0 group-hover:from-brand-blue-500/10 group-hover:via-brand-lime/10 group-hover:to-brand-blue-500/10 transition-all duration-500 rounded-2xl" />
                    
                    {/* Decorative corner accent */}
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-brand-lime/0 to-brand-blue-500/0 group-hover:from-brand-lime/20 group-hover:to-brand-blue-500/20 rounded-bl-2xl transition-all duration-500" />
                    
                    {logoPath ? (
                      <div className="relative z-10 w-full flex flex-col items-center justify-center gap-2 flex-1">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: [0, -3, 3, -3, 0] }}
                          transition={{ duration: 0.4 }}
                          className="relative w-full h-16 md:h-20 flex items-center justify-center"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-brand-blue-500/10 to-brand-lime/10 rounded-xl blur-lg group-hover:blur-xl transition-all" />
                          <img
                            src={logoPath}
                            alt={`${brand} logo`}
                            className="relative z-10 max-w-full max-h-full w-auto h-auto object-contain drop-shadow-md"
                          />
                        </motion.div>
                        <div className="text-xs md:text-sm text-gray-700 font-semibold group-hover:text-brand-blue-900 transition-colors">
                          {brand}
                        </div>
                      </div>
                    ) : (
                      <div className="relative z-10 w-full flex flex-col items-center justify-center gap-2 flex-1">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-brand-blue-500 to-brand-lime rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow"
                        >
                          <span className="text-2xl md:text-3xl font-bold text-white">
                            {brand.charAt(0)}
                          </span>
                        </motion.div>
                        <div className="text-sm md:text-base font-bold text-brand-blue-900 group-hover:text-brand-lime transition-colors">
                          {brand}
                        </div>
                      </div>
                    )}
                    
                    {/* Bottom accent line */}
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: '100%' }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.05 * index + 0.3, duration: 0.5 }}
                      className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-brand-blue-500 via-brand-lime to-brand-blue-500 rounded-b-2xl"
                    />
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="inline-block p-6 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-gray-200 shadow-lg">
              <p className="text-gray-700 text-lg mb-4 font-medium">
                {searchQuery ? 'No brands found matching your search.' : 'No brands available for this category.'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-6 py-2 bg-gradient-to-r from-brand-blue-500 to-brand-lime text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Clear search
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
