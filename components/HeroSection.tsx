'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Check, Camera, Smartphone, Laptop, Tablet, TrendingUp, Users, Star, X } from 'lucide-react'
import Link from 'next/link'
import { getAssetPath } from '@/lib/utils'
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
    <section className="relative min-h-[90vh] md:min-h-screen bg-gradient-to-br from-brand-blue-50 via-white to-brand-lime-50/30 pt-24 pb-8 md:pb-12 overflow-hidden">
      {/* Background: soft orbs + edge accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[480px] h-[480px] bg-brand-lime/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-brand-blue-400/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-24 w-72 h-72 bg-brand-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-lime/40 via-brand-blue-500/30 to-transparent hidden lg:block" />
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-brand-lime/30 to-brand-blue-500/40 hidden lg:block" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left - Copy + CTA */}
          <motion.div
            initial={mounted ? { opacity: 0, x: -24 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-7"
          >
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-gradient-to-r from-white via-brand-lime-50/90 to-brand-blue-50/90 backdrop-blur-sm border border-brand-lime/30 text-brand-blue-900 font-semibold text-sm shadow-sm">
              <span className="w-2 h-2 bg-brand-lime rounded-full animate-pulse shadow-sm shadow-brand-lime/50" />
              India&apos;s #1 Device Trade-In Platform
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-brand-blue-900 leading-[1.1] tracking-tight">
              Trade-In Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue-600 to-brand-lime">
                Camera & Gadgets
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 max-w-lg">
              Get instant price, free doorstep pickup, and same-day payment. Trusted by thousands.
            </p>

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
                  className="w-full pl-12 pr-10 py-4 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-lime focus:ring-4 focus:ring-brand-lime/25 text-gray-900 shadow-md hover:shadow-lg transition-all placeholder:text-gray-400"
                />
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 max-h-80 overflow-y-auto ring-2 ring-brand-lime/10"
                    >
                      {suggestions.map((product, index) => (
                        <motion.button
                          key={product.id}
                          type="button"
                          onClick={() => handleSuggestionClick(product)}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="w-full px-4 py-3 text-left hover:bg-brand-blue-50/50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center gap-3 group"
                        >
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-brand-lime/20 transition-colors">
                            <Search className="w-4 h-4 text-gray-500 group-hover:text-brand-lime" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 truncate">{product.modelName}</div>
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
                className="px-8 py-4 bg-gradient-to-r from-brand-lime to-brand-lime-400 text-brand-blue-900 font-bold rounded-xl hover:shadow-lg hover:shadow-brand-lime/25 focus:outline-none focus:ring-4 focus:ring-brand-lime/30 transition-all shadow-lg hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap border border-brand-lime-300/50"
              >
                Check Price
              </button>
            </form>

            <div className="flex flex-wrap gap-5 md:gap-8">
              {['Instant Quote', 'Free Pickup', 'Same-Day Payment'].map((benefit) => (
                <div key={benefit} className="flex items-center gap-2.5 text-gray-700">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-lime to-brand-lime-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-brand-lime/30">
                    <Check className="w-3.5 h-3.5 text-brand-blue-900" strokeWidth={2.5} />
                  </div>
                  <span className="font-semibold">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Stats - card style with subtle gradients */}
            <motion.div
              initial={mounted ? { opacity: 0, y: 16 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="grid grid-cols-3 gap-4 pt-8 mt-8 border-t border-gray-200/80"
            >
              {stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <div
                    key={index}
                    className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-b from-white/80 to-brand-blue-50/40 backdrop-blur-sm border border-brand-blue-100/60 shadow-sm hover:shadow-md hover:border-brand-lime/20 transition-all duration-200"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-blue-100 to-brand-blue-50 flex items-center justify-center mb-2">
                      <Icon className="w-5 h-5 text-brand-blue-700" />
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-brand-blue-900">
                      <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                    </div>
                    <div className="text-xs md:text-sm text-gray-500 font-medium mt-0.5">{stat.label}</div>
                  </div>
                )
              })}
            </motion.div>
          </motion.div>

          {/* Right - Hero visual: no outer box, content on gradient */}
          <motion.div
            initial={mounted ? { opacity: 0, x: 24 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative hidden lg:flex items-center justify-center flex-1 min-h-[500px] rounded-2xl bg-gradient-to-l from-white via-brand-lime-50/40 to-brand-blue-100/50"
          >
            <div className="relative w-full max-w-lg min-h-[420px] flex items-center justify-center">
              {/* Soft glow behind image (no box) */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-lime/15 via-transparent to-brand-blue-400/15 blur-2xl pointer-events-none" />
              {/* Decorative orbs */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-8 w-40 h-40 rounded-full bg-brand-blue-300/20 blur-2xl" />
                <div className="absolute bottom-1/4 -right-8 w-48 h-48 rounded-full bg-brand-lime/15 blur-2xl" />
              </div>
              {/* Corner accents */}
              <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-brand-lime/50 pointer-events-none" />
              <div className="absolute top-6 right-6 w-1.5 h-1.5 rounded-full bg-brand-blue-400/40 pointer-events-none" />
              <div className="absolute bottom-6 left-6 w-2 h-2 rounded-full bg-brand-blue-400/40 pointer-events-none" />
              <div className="absolute bottom-4 left-4 w-1.5 h-1.5 rounded-full bg-brand-lime/50 pointer-events-none" />
              {/* Main image with shadow */}
              <div className="relative z-10 w-full flex justify-center px-4">
                <div style={{ filter: 'drop-shadow(0 20px 40px rgba(30, 58, 138, 0.12)) drop-shadow(0 8px 16px rgba(132, 204, 22, 0.08))' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getAssetPath('/images/hero-web-img1.png')}
                    alt="Cameras, laptops, phones and gadgets - Trade in for instant value"
                    className="w-full h-auto max-h-[400px] object-contain object-center"
                  />
                </div>
              </div>
              {/* Instant value badge */}
              <div className="absolute bottom-4 right-4 z-10 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-sm border border-brand-lime/30 shadow-sm">
                <span className="text-xs font-semibold text-brand-blue-900">Instant value</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Categories - with gradient separator */}
        <div className="mt-14 md:mt-20 h-px w-full bg-gradient-to-r from-transparent via-brand-lime/30 to-transparent" />
        <motion.div
          id="trade-in"
          initial={mounted ? { opacity: 0, y: 20 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="scroll-mt-20"
        >
          <div className="relative mb-6">
            <p className="text-center text-gray-600 font-semibold text-lg">Select a category to get started</p>
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-24 h-0.5 bg-gradient-to-r from-transparent via-brand-lime/50 to-transparent rounded-full" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <Link
                  key={category.id}
                  href={`/brands?category=${category.id}`}
                  className="group flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-gray-200 bg-gradient-to-b from-white to-brand-blue-50/30 hover:border-brand-lime hover:bg-gradient-to-b hover:from-brand-lime-50/40 hover:to-brand-blue-50/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 shadow-sm"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-50 group-hover:from-brand-lime/20 group-hover:to-brand-blue-100/50 rounded-2xl flex items-center justify-center mb-3 transition-all duration-200">
                    <Icon className="w-8 h-8 text-gray-600 group-hover:text-brand-blue-900 transition-colors" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-brand-blue-900 transition-colors text-center">
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
