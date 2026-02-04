'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { Search, Check, TrendingUp, Users, Star, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { getAssetPath } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { getAllProducts, type Product } from '@/lib/firebase/database'

const categories = [
  { id: 'cameras', name: 'Camera / DSLR', image: '/Icons/DSLR.webp', active: true },
  { id: 'phones', name: 'Phone', image: '/Icons/phone.webp', active: true },
  { id: 'laptops', name: 'Laptop', image: '/Icons/Laptop.webp', active: true },
  { id: 'tablets', name: 'Tablet', image: '/Icons/Tablet.webp', active: true },
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

  // Advanced Parallax State
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Smooth springs for 3D rotation
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [7, -7]), { stiffness: 150, damping: 20 })
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-7, 7]), { stiffness: 150, damping: 20 })

  // Layer transforms for parallax depth
  const layer1X = useSpring(useTransform(mouseX, [-0.5, 0.5], [-20, 20]), { stiffness: 100, damping: 20 })
  const layer1Y = useSpring(useTransform(mouseY, [-0.5, 0.5], [-20, 20]), { stiffness: 100, damping: 20 })

  const layer2X = useSpring(useTransform(mouseX, [-0.5, 0.5], [-40, 40]), { stiffness: 100, damping: 20 })
  const layer2Y = useSpring(useTransform(mouseY, [-0.5, 0.5], [-40, 40]), { stiffness: 100, damping: 20 })

  // Throttle mouse move for better performance
  const lastUpdateRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    
    // Cancel previous RAF if pending
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }
    
    // Use requestAnimationFrame for smooth updates
    rafRef.current = requestAnimationFrame(() => {
      const now = Date.now()
      // Throttle to ~60fps (16ms)
      if (now - lastUpdateRef.current < 16) return
      lastUpdateRef.current = now
      
      const rect = containerRef.current!.getBoundingClientRect()
      const width = rect.width
      const height = rect.height
      const mouseXPos = e.clientX - rect.left
      const mouseYPos = e.clientY - rect.top
      const xPct = mouseXPos / width - 0.5
      const yPct = mouseYPos / height - 0.5
      mouseX.set(xPct)
      mouseY.set(yPct)
    })
  }, [mouseX, mouseY])

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    mouseX.set(0)
    mouseY.set(0)
  }, [mouseX, mouseY])

  // Ensure component is mounted before animations run (fixes hydration issues)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch products for suggestions - only when search input is focused or user types
  const fetchProducts = useCallback(async () => {
    if (products.length > 0) return // Already loaded
    
    try {
      setLoading(true)
      const allProducts = await getAllProducts()
      setProducts(allProducts)
    } catch (error) {
      // Error fetching products
    } finally {
      setLoading(false)
    }
  }, [products.length])

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
    // Load products when user focuses on search (lazy loading)
    fetchProducts()
    if (suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  // Load products when user starts typing
  useEffect(() => {
    if (searchQuery.trim().length > 0 && products.length === 0) {
      fetchProducts()
    }
  }, [searchQuery, products.length, fetchProducts])

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-[90vh] md:min-h-screen bg-slate-50 pt-24 pb-8 md:pb-12 overflow-hidden perspective-[2000px]"
    >
      {/* Advanced Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none bg-grid-slate-900/[0.04]">
        {/* Dynamic Orbs with independent motion */}
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] bg-gradient-radial from-brand-lime/20 to-transparent blur-[80px]"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: 2 }}
          className="absolute top-[20%] -left-[10%] w-[600px] h-[600px] bg-gradient-radial from-brand-blue-400/10 to-transparent blur-[80px]"
        />
        {/* Shimmering mesh overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.2]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left - Copy + CTA */}
          <motion.div
            initial={mounted ? { opacity: 0, x: -24 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8 relative z-20"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md border border-brand-blue-100/50 text-brand-blue-900 font-semibold text-sm shadow-sm ring-1 ring-white/50"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-lime opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-lime"></span>
              </span>
              India&apos;s #1 Device Trade-In Platform
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-brand-blue-900 leading-[1.1] tracking-tight">
              Trade-In Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue-600 to-brand-lime font-extrabold relative">
                Gadgets
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 max-w-lg leading-relaxed">
              Get an Instant Price Quote, enjoy Free Doorstep Pickup, and receive Same-Day Payment. Trusted by over 10K+ happy customers.
            </p>

            {/* Premium Search Box */}
            <div className="relative group max-w-xl">
              <div className="absolute -inset-1 bg-gradient-to-r from-brand-lime to-brand-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <form onSubmit={handleSearch} className="relative flex flex-col sm:flex-row gap-2 bg-white p-2 rounded-xl shadow-xl ring-1 ring-slate-900/5">
                <div ref={searchRef} className="flex-1 relative">
                  <label htmlFor="device-search" className="sr-only">
                    Search for your device
                  </label>
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('')
                        setShowSuggestions(false)
                        inputRef.current?.focus()
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors z-10"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <input
                    id="device-search"
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={handleInputFocus}
                    placeholder="Search your device (e.g. iPhone 13)"
                    className="w-full pl-12 pr-10 py-3 bg-transparent border-none text-slate-900 placeholder:text-slate-400 focus:ring-0 text-lg"
                    aria-label="Search for your device"
                    aria-autocomplete="list"
                    aria-expanded={showSuggestions}
                    aria-controls={showSuggestions ? "search-suggestions" : undefined}
                  />
                  <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                      <motion.div
                        id="search-suggestions"
                        role="listbox"
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 right-0 mt-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 max-h-80 overflow-y-auto"
                      >
                        {suggestions.map((product, index) => (
                          <motion.button
                            key={product.id}
                            type="button"
                            role="option"
                            onClick={() => handleSuggestionClick(product)}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="w-full px-5 py-3.5 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0 flex items-center gap-4 group"
                          >
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-brand-lime/20 group-hover:scale-110 transition-all duration-300">
                              <Search className="w-4 h-4 text-slate-500 group-hover:text-brand-lime-700" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{product.modelName}</div>
                              <div className="text-xs text-slate-500 uppercase tracking-wider font-medium mt-0.5">
                                {product.brand}
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
                  className="px-8 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 transition-all shadow-lg hover:shadow-xl active:scale-95"
                >
                  Check Value
                </button>
              </form>
            </div>

            <div className="flex flex-wrap gap-6 text-sm font-medium text-slate-600 pt-2">
              {['Instant Quote', 'Free Pickup', 'Same-Day Payment'].map((benefit) => (
                <div key={benefit} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-brand-blue-100 flex items-center justify-center text-brand-blue-600">
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </div>
                  {benefit}
                </div>
              ))}
            </div>

            {/* Glass Stats */}
            <motion.div
              initial={mounted ? { opacity: 0, y: 16 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="grid grid-cols-3 gap-4 pt-8 mt-8 border-t border-slate-200"
            >
              {stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <div key={index} className="group cursor-default">
                    <div className="text-3xl font-bold text-slate-900 mb-1 group-hover:text-brand-blue-600 transition-colors">
                      <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                    </div>
                    <div className="flex items-center gap-2 text-brand-blue-600 text-sm">
                      <Icon className="w-4 h-4 text-brand-blue-600" />
                      {stat.label}
                    </div>
                  </div>
                )
              })}
            </motion.div>
          </motion.div>

          {/* Right - Advanced 3D Interactive Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            style={{
              rotateX,
              rotateY,
              transformStyle: "preserve-3d" // CRITICAL for 3D effect
            }}
            className="hidden lg:flex relative h-[650px] items-center justify-center pointer-events-none"
          >
            {/* 3D Container Content */}
            <div className="relative w-full max-w-[600px] aspect-square transform-style-3d">

              {/* Layer 0: Ambient Glow (Deep Background) */}
              <div className="absolute inset-0 bg-gradient-conic from-brand-blue-500/20 via-brand-lime/20 to-brand-blue-500/20 blur-3xl opacity-60 animate-pulse-slow rounded-full mix-blend-multiply transition-transform duration-75" />

              {/* Layer 1: Main Product Image (Mid depth) */}
              <motion.div
                style={{ x: layer1X, y: layer1Y, z: 20 }}
                className="absolute inset-0 flex items-center justify-center z-10"
              >
                <div className="relative w-full transform transition-all duration-500 hover:scale-105">
                  {/* Shadow for floating effect */}
                  <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-2/3 h-12 bg-black/20 blur-2xl rounded-[100%]" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getAssetPath('/Icons/home page image.webp')}
                    alt="Trade in your devices"
                    className="w-full h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
                  />
                </div>
              </motion.div>

              {/* Layer 2: Floating Glass Cards (High depth, nearest to user) */}

              {/* Card 1: Payment Success */}
              <motion.div
                style={{ x: layer2X, y: layer2Y, z: 60 }}
                className="absolute -left-4 top-32 z-30"
              >
                <div className="bg-white/70 backdrop-blur-xl p-4 pr-8 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] border border-white/50 flex items-center gap-4 animate-float">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                    <Check className="w-6 h-6 text-white" strokeWidth={3} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Payment Sent</p>
                    <p className="text-lg font-bold text-slate-900 font-mono">₹45,200</p>
                  </div>
                  {/* Shiny overlay */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/0 via-white/40 to-white/0 opacity-0 hover:opacity-100 transition-opacity duration-700 pointer-events-auto" />
                </div>
              </motion.div>

              {/* Card 2: 5-Star Rating */}
              <motion.div
                style={{ x: useTransform(mouseX, [-1, 1], [30, -30]), y: useTransform(mouseY, [-1, 1], [20, -20]), z: 40 }}
                className="absolute -right-8 top-20 z-20"
              >
                <div className="bg-white/80 backdrop-blur-lg p-4 rounded-2xl shadow-xl border border-white/60 animate-float-delayed flex flex-col items-center gap-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400 drop-shadow-sm" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-600">Trusted by India</span>
                </div>
              </motion.div>

              {/* Card 3: Instant Pickup */}
              <motion.div
                style={{ x: layer2X, y: layer2Y, z: 50 }}
                className="absolute -right-0 bottom-32 z-30"
              >
                <div className="bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700/50 flex items-center gap-4 animate-float" style={{ animationDelay: '1.5s' }}>
                  <div className="w-10 h-10 rounded-xl bg-brand-lime flex items-center justify-center shadow-lg shadow-brand-lime/20">
                    <TrendingUp className="w-5 h-5 text-brand-blue-900" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Best Price</p>
                    <p className="text-xs text-slate-300">Guaranteed</p>
                  </div>
                </div>
              </motion.div>

            </div>
          </motion.div>
        </div>

        {/* Categories - with gradient separator */}
        <div className="mt-20 md:mt-24 relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 bg-slate-50 text-sm text-slate-500 font-medium uppercase tracking-widest">Start Selling</span>
          </div>
        </div>

        <motion.div
          id="trade-in"
          initial={mounted ? { opacity: 0, y: 30 } : false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6"
        >
          {categories.map((category) => {
            return (
              <Link
                key={category.id}
                href={`/brands?category=${category.id}`}
                className="group relative p-6 transition-all duration-300"
              >
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="flex-1 flex items-center justify-center w-full mb-4">
                    <Image
                      src={getAssetPath(category.image)}
                      alt={category.name}
                      width={160}
                      height={160}
                      className="w-full h-full max-w-[140px] md:max-w-[160px] object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <span className="font-bold text-brand-blue-900 group-hover:text-brand-blue-700 text-center">{category.name}</span>
                </div>
              </Link>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
