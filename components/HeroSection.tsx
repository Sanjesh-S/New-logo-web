'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Check, Camera, Smartphone, Laptop, Tablet, TrendingUp, Users, Star, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getAllProducts, type Product } from '@/lib/firebase/database'

const categories = [
  { id: 'cameras', name: 'Camera / DSLR', icon: Camera, active: true },
  { id: 'phones', name: 'Phone', icon: Smartphone, active: true },
  { id: 'laptops', name: 'Laptop', icon: Laptop, active: true },
  { id: 'tablets', name: 'Tablet', icon: Tablet, active: true },
]

const stats = [
  { icon: TrendingUp, value: 5000, suffix: '+', label: 'Devices Traded' },
  { icon: Users, value: 2, suffix: 'Cr+', label: 'Amount Paid' },
  { icon: Star, value: 4.8, suffix: '★', label: 'Customer Rating' },
]

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const duration = 2000
    const steps = 60
    const increment = value / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current * 10) / 10)
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value])

  return (
    <span>
      {value % 1 === 0 ? Math.floor(count).toLocaleString() : count.toFixed(1)}
      {suffix}
    </span>
  )
}

export default function HeroSection() {
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Ensure component is mounted before animations run (fixes hydration issues)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch products for suggestions
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const allProducts = await getAllProducts()
        setProducts(allProducts)
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  // Generate suggestions based on search query
  useEffect(() => {
    if (searchQuery.trim().length > 0 && products.length > 0) {
      const query = searchQuery.toLowerCase().trim()
      const filtered = products
        .filter((product) => {
          const modelMatch = product.modelName?.toLowerCase().includes(query)
          const brandMatch = product.brand?.toLowerCase().includes(query)
          return modelMatch || brandMatch
        })
        .slice(0, 5) // Limit to 5 suggestions
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchQuery, products])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setShowSuggestions(false)
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    } else {
      router.push('/search')
    }
  }

  const handleSuggestionClick = (product: Product) => {
    setSearchQuery(product.modelName || '')
    setShowSuggestions(false)
    router.push(`/search?q=${encodeURIComponent(product.modelName || '')}`)
  }

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  return (
    <section className="relative min-h-[90vh] md:min-h-screen bg-gradient-to-br from-blue-50 via-white to-lime-50 pt-24 pb-8 md:pb-12 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-lime/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Column - Text Content */}
          <motion.div
            initial={mounted ? { opacity: 0, x: -20 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-lime/20 rounded-full text-brand-blue-900 font-medium text-sm">
              <span className="w-2 h-2 bg-brand-lime rounded-full animate-pulse" />
              India's #1 Device Trade-In Platform
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-brand-blue-900 leading-tight">
              Trade-In Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue-600 to-brand-lime">
                Camera & Gadgets
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600">
              Get Instant Price. Doorstep Pickup. Same-Day Payment.
            </p>

            {/* Search Bar with Suggestions */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mt-8">
              <div ref={searchRef} className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      setShowSuggestions(false)
                      inputRef.current?.focus()
                    }}
                    className="absolute right-12 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={handleInputFocus}
                  placeholder="Search your device (e.g. Canon EOS 90D)"
                  className="w-full pl-12 pr-10 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-lime focus:ring-4 focus:ring-brand-lime/20 text-gray-900 shadow-sm transition-all"
                />
                
                {/* Suggestions Dropdown */}
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 max-h-80 overflow-y-auto"
                    >
                      {suggestions.map((product, index) => (
                        <motion.button
                          key={product.id}
                          type="button"
                          onClick={() => handleSuggestionClick(product)}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center gap-3 group"
                        >
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-brand-lime/20 transition-colors">
                            <Search className="w-4 h-4 text-gray-400 group-hover:text-brand-lime" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 truncate">
                              {product.modelName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.brand} {product.category && `• ${product.category}`}
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button
                type="submit"
                className="px-8 py-4 bg-brand-lime text-brand-blue-900 font-bold rounded-xl hover:bg-brand-lime-400 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 whitespace-nowrap"
              >
                Check Price
              </button>
            </form>

            {/* Benefits */}
            <div className="flex flex-wrap gap-4 md:gap-6 mt-6">
              {['Instant Quote', 'Free Pickup', 'Same-Day Payment'].map((benefit) => (
                <div key={benefit} className="flex items-center gap-2 text-gray-600">
                  <div className="w-5 h-5 bg-brand-lime rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-brand-blue-900" />
                  </div>
                  <span className="font-medium">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <motion.div
              initial={mounted ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="grid grid-cols-3 gap-4 pt-8 border-t border-gray-200 mt-8"
            >
              {stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <div key={index} className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-brand-blue-900">
                      <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
                  </div>
                )
              })}
            </motion.div>
          </motion.div>

          {/* Right Column - Product Images */}
          <motion.div
            initial={mounted ? { opacity: 0, x: 20 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="relative hidden lg:block"
          >
            <div className="relative h-[500px]">
              {/* Camera - Large */}
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 left-8 w-52 h-52 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-6 flex items-center justify-center"
              >
                <Camera className="w-24 h-24 text-gray-300" />
              </motion.div>

              {/* Phone */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute top-32 right-8 w-32 h-56 bg-gradient-to-br from-white to-gray-100 rounded-3xl shadow-2xl border-4 border-gray-200 flex items-center justify-center"
              >
                <Smartphone className="w-12 h-12 text-gray-400" />
              </motion.div>

              {/* Laptop */}
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-12 left-16 w-56 h-36 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl shadow-2xl flex items-center justify-center"
              >
                <Laptop className="w-20 h-20 text-gray-300" />
              </motion.div>

              {/* Tablet */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                className="absolute bottom-32 right-4 w-28 h-36 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl shadow-xl border-2 border-gray-300 flex items-center justify-center"
              >
                <Tablet className="w-10 h-10 text-gray-400" />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Category Cards at Bottom */}
        <motion.div
          id="trade-in"
          initial={mounted ? { opacity: 0, y: 20 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-12 md:mt-16 scroll-mt-20"
        >
          <p className="text-center text-gray-500 mb-6 font-medium">Select a category to get started</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <Link
                  key={category.id}
                  href={`/brands?category=${category.id}`}
                  className="group flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-gray-200 bg-white hover:border-brand-lime hover:shadow-lg transition-all"
                >
                  <div className="w-14 h-14 bg-gray-100 group-hover:bg-brand-lime/20 rounded-xl flex items-center justify-center mb-3 transition-colors">
                    <Icon className="w-7 h-7 text-gray-500 group-hover:text-brand-blue-900 transition-colors" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-brand-blue-900 transition-colors">
                    {category.name}
                  </span>
                </Link>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
