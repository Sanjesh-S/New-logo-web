'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Check, Camera, Smartphone, Laptop, Tablet, TrendingUp, Users, Star } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/trade-in?search=${encodeURIComponent(searchQuery)}`)
    } else {
      router.push('/trade-in')
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
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-lime/20 rounded-full text-brand-blue-900 font-medium text-sm">
              <span className="w-2 h-2 bg-brand-lime rounded-full animate-pulse" />
              India's #1 Device Trade-In Platform
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-brand-blue-900 leading-tight">
              Trade-In Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue-600 to-brand-lime">
                Camera & Gadgets
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600">
              Get Instant Price. Doorstep Pickup. Same-Day Payment.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mt-8">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your device (e.g. Canon EOS 90D)"
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-lime focus:ring-4 focus:ring-brand-lime/20 text-gray-900 shadow-sm transition-all"
                />
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 md:mt-16"
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
