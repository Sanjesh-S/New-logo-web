'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function MobileCTA() {
    return (
        <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 100 }}
            className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-4"
        >
            <Link href="/trade-in" className="block">
                <button className="w-full py-4 bg-brand-lime text-brand-blue-900 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg">
                    Get Instant Quote
                    <ArrowRight className="w-5 h-5" />
                </button>
            </Link>
        </motion.div>
    )
}
