'use client'

import { motion } from 'framer-motion'
import { getBrandLogo } from '@/lib/utils/brandLogos'

// Brands organized by category
const allBrands = [
    // DSLR/Camera brands
    { name: 'Canon', category: 'cameras' },
    { name: 'Nikon', category: 'cameras' },
    { name: 'Sony', category: 'cameras' },
    { name: 'Fujifilm', category: 'cameras' },
    { name: 'GoPro', category: 'cameras' },
    // Phone brands
    { name: 'Apple', category: 'phones' },
    { name: 'Samsung', category: 'phones' },
    // Laptop brands
    { name: 'Apple', category: 'laptops' },
    // Tablet brands
    { name: 'Apple', category: 'tablets' },
]

// Get unique brand names for display
const uniqueBrands = Array.from(new Set(allBrands.map(b => b.name)))

export default function BrandLogos() {
    return (
        <section className="py-8 md:py-12 bg-white border-y border-gray-100 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <p className="text-center text-gray-500 text-sm font-medium mb-6">
                    Trusted by customers selling devices from top brands
                </p>
            </div>

            <div className="relative">
                {/* Gradient overlays */}
                <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10" />

                {/* Scrolling container */}
                <motion.div
                    animate={{ x: ['0%', '-50%'] }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                    className="flex gap-8 items-center whitespace-nowrap"
                >
                    {/* Duplicate brands for seamless loop */}
                    {[...uniqueBrands, ...uniqueBrands].map((brand, index) => {
                        const logoPath = getBrandLogo(brand)
                        return (
                            <div
                                key={`${brand}-${index}`}
                                className="flex-shrink-0 px-8 py-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-brand-lime transition-colors flex items-center justify-center h-20"
                            >
                                {logoPath ? (
                                    <img
                                        src={logoPath}
                                        alt={`${brand} logo`}
                                        className="h-12 w-auto object-contain max-w-[120px]"
                                    />
                                ) : (
                                    <span className="text-2xl font-bold text-gray-500 hover:text-brand-blue-900 transition-colors">
                                        {brand}
                                    </span>
                                )}
                            </div>
                        )
                    })}
                </motion.div>
            </div>
        </section>
    )
}
